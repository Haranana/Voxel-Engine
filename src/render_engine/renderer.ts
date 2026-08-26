import { type StructuredView } from "webgpu-utils";
import {type RenderableObject } from "./renderableObjects/renderableObject";
import { Vector2 } from "../math/vector2.type";
import type { ShaderResourceContext} from "./shaders/shader-resource";
import type { Matrix4 } from "../math/matrix4.type";
import { GPUMeshCache } from "./meshes/mesh-cache";
import type { Vector3 } from "../math/vector3.type";

export type ShaderGPUResources = {
    pipeline: GPURenderPipeline;
    shaderModule: GPUShaderModule;
    bindGroupLayout: GPUBindGroupLayout;
}

export type ObjectRenderResources = {
    uniformBuffer: GPUBuffer;
    uniformBufferView: StructuredView;
    bindGroup: GPUBindGroup;
}

export type RenderContext = {
    device: GPUDevice | null,
    queue: GPUQueue | null,
    cameraContext: CameraContext | null,
    viewportContext: ViewportContext | null,
    gizmoCameraContext: GizmoCameraContext | null,
    timeContext: TimeContext | null,
    globalData: unknown,
}

export type CameraContext = {
    viewMatrix: Matrix4,
    ndcProjection: Matrix4,
}

export type GizmoCameraContext = {
    pitch: number,
    yaw: number,
}

export type ViewportContext = {
    resolution: Vector2,
}

export type TimeContext = {

}

async function debugShader(shaderModule: GPUShaderModule) {
    const info = await shaderModule.getCompilationInfo();

    if (info.messages.length) {
        console.log("[DEBUG] " + info.messages);
    }
}

export class Renderer{

    //readonly shaderResourceRegistry = new Map<Function, ShaderResourceHandler>();

    //#shaderGPUResourcesCache : Map<Shader, ShaderGPUResources> = new Map();
    //#renderResources: Map<RenderableObject, ObjectRenderResources> = new Map();

    //because of this cache, meshes need to be treated as effectively immutable, 
    //also any method which deletes mesh should probably also delete it from this map
    #meshCache: GPUMeshCache = new GPUMeshCache();

    #device: GPUDevice | null  = null
    #canvas: HTMLCanvasElement | null = null
    #context: GPUCanvasContext | null = null
    #presentationFormat: GPUTextureFormat | null = null
    #depthTexture: GPUTexture | null = null    
    #gizmosDepthTexture: GPUTexture | null = null


    initialized: boolean = false;
    initializing: boolean = false;

    constructor(){}

    async init(canvas: HTMLCanvasElement): Promise<boolean>{
        if(this.initialized || this.initializing) return false;
        this.initializing = true;
        const adapter = await navigator.gpu?.requestAdapter();
        if(!adapter) {
            return false;
        }

        //console.log("gimmie this device");
        const device = await adapter.requestDevice();
        if (!device) {
            return false;
        }

        const context = canvas.getContext('webgpu');
        if(!context){
            return false;
        }

        //console.log("Device initialized !");
        this.#device = device;
        this.#canvas =canvas;
        this.#context = context;
        this.#presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        
        context.configure({
            device,
            format: this.#presentationFormat,
            alphaMode: 'premultiplied'
        });
        const canvasTexture = this.#context.getCurrentTexture();
        this.#depthTexture = this.#device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.#gizmosDepthTexture = this.#device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.initialized = true;
        this.initializing = false;
        return true
    }

    updateDepthTexture(){
        if(!this.initialized) false;
        const context = this.#context!;
        const device = this.#device!;

        const canvasTexture = context.getCurrentTexture();
        this.#depthTexture = device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

    }

    updateSecondaryDepthTexture(){
        if(!this.initialized) false;
        const context = this.#context!;
        const device = this.#device!;

        const canvasTexture = context.getCurrentTexture();
        this.#gizmosDepthTexture = device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }    

    renderScene(objects: RenderableObject[], renderContext: RenderContext){
        //console.log("[renderScene] called with " + objects.length +" objects")
        if(!this.initialized) return false;

        const device = this.#device!;
        device.addEventListener("uncapturederror", (e) => {
            console.error("WebGPU:", e.error);
        });
        renderContext.device = device;
        renderContext.queue = device.queue;


        const context = this.#context!;
        //const canvas = this.#canvas!
        this.resizeCanvas();
        const canvasTexture = context.getCurrentTexture();

        if (this.#depthTexture!.width !== canvasTexture.width ||
            this.#depthTexture!.height !== canvasTexture.height) {

            this.#depthTexture!.destroy();
            this.updateDepthTexture();
        };
        if (this.#gizmosDepthTexture!.width !== canvasTexture.width ||
            this.#gizmosDepthTexture!.height !== canvasTexture.height) {

            this.#gizmosDepthTexture!.destroy();
            this.updateSecondaryDepthTexture();
        };

        const encoder : GPUCommandEncoder = device.createCommandEncoder({
            label: 'GPU command encoder'
        });

                                
        const pass : GPURenderPassEncoder = encoder.beginRenderPass({
            label: `basic canvas renderPassDescriptor`,
            colorAttachments: [
                {
                    view: canvasTexture.createView(),
                    loadOp: 'clear',
                    storeOp: 'store',                    
                },
            ],
                depthStencilAttachment: {
                view: this.#depthTexture!.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                },
        });
        objects.forEach((obj, id)=>{            
            if(!obj.mesh || !obj.material ||obj.useSecondaryDepthTexture) return;
            
            const meshResources = this.#meshCache.get(obj.mesh); 
            let vertexBuffer;
            let indexBuffer;

            //filling index and vertex buffer and updating mesh cache
            if(meshResources){
                vertexBuffer = meshResources.vertexBuffer;
                indexBuffer = meshResources.indexBuffer;
            }else{    
                vertexBuffer = device.createBuffer({
                    label: 'vertex data buffer',
                    size: obj.mesh.vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(vertexBuffer , 0 , obj.mesh.vertices);

                indexBuffer = device.createBuffer({
                    label: 'index data buffer',
                    size: obj.mesh.indices.byteLength,
                    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(indexBuffer, 0 , obj.mesh.indices);     
                this.#meshCache.set(obj.mesh, {
                    vertexBuffer,
                    indexBuffer,
                });                 
            }

            //initializing and updating shader resources, fetching bind groups and their layouts
            const bindGroups : Map<number, GPUBindGroup> = new Map<number, GPUBindGroup>();
            const bindGroupLayouts: GPUBindGroupLayout[] = []
            let objectRenderError: boolean = false;
            obj.material.shader.resources.forEach((res)=>{
                const shaderResourceContext: ShaderResourceContext = {
                    object: obj,
                    renderContext: renderContext,
                };
                const bindGroupLayout = device.createBindGroupLayout(res.getBindGroupLayoutDescriptor(shaderResourceContext)) ;
                bindGroupLayouts.push(bindGroupLayout);

                let initSuccess;
                let updateSuccess; 
                if(!res.initialized){
                    initSuccess = res.init(shaderResourceContext, bindGroupLayout)
                    if(!initSuccess){
                        console.error("[renderScene] couldn't init shaderResource");
                        objectRenderError = true;
                        return;                        
                    }
                }
                
                updateSuccess = res.update(shaderResourceContext);
                if(!updateSuccess){
                    console.error("[renderScene] couldn't update shaderResource");
                    objectRenderError = true;
                    return;  
                }
                const bindGroup = res.getBindGroup()!;
                const groupId = res.bindGroupNumber;
                bindGroups.set(groupId, bindGroup);
            })
            if(objectRenderError){
                console.log("[renderScene] objectRenderError")
                return;
            }

            //creating render pipeline
            const shader = obj.material.shader;
            const shaderModule = device.createShaderModule({code: shader.code})
            debugShader(shaderModule);
            const pipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: bindGroupLayouts,
            });

            const renderPipeline = device.createRenderPipeline({
                label: 'Selected object mesh pipeline',
                layout: pipelineLayout,
                vertex: {
                    entryPoint: shader.vertexEntryPoint,
                    module: shaderModule,
                    buffers:[
                        {
                            arrayStride: obj.mesh.layout.stride,
                            attributes: obj.mesh.layout.attributes,
                        }
                    ]
                },
                fragment: {
                    entryPoint: shader.fragmentEntryPoint,
                    module: shaderModule,
                    targets: [{format: this.#presentationFormat!,
                        blend: {
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                },
                    }],

                },
                primitive: obj.mesh.primitiveState,
                depthStencil: obj.mesh.depthStencilState
            });

            pass.setPipeline(renderPipeline);
            pass.setVertexBuffer(0 , vertexBuffer);
            pass.setIndexBuffer(indexBuffer, "uint32");
            bindGroups.forEach((group,id)=>{
                pass.setBindGroup(id, group);
            })            
            pass.drawIndexed(obj.mesh.indices.length);
            //console.log("[renderScene]Drawed: " + obj.name);
        });
        pass.end();

        const gizmoPass: GPURenderPassEncoder = encoder.beginRenderPass({
            label: `secondary (gizmos) canvas renderPassDescriptor`,
            colorAttachments: [
                {
                    view: canvasTexture.createView(),
                    loadOp: 'load',
                    storeOp: 'store',                    
                },
            ],
                depthStencilAttachment: {
                view: this.#gizmosDepthTexture!.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                },
        });
        objects.forEach((obj, id)=>{            
            if(!obj.mesh || !obj.material || !obj.useSecondaryDepthTexture) return;
            
            const meshResources = this.#meshCache.get(obj.mesh); 
            let vertexBuffer;
            let indexBuffer;

            //filling index and vertex buffer and updating mesh cache
            if(meshResources){
                vertexBuffer = meshResources.vertexBuffer;
                indexBuffer = meshResources.indexBuffer;
            }else{    
                vertexBuffer = device.createBuffer({
                    label: 'vertex data buffer',
                    size: obj.mesh.vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(vertexBuffer , 0 , obj.mesh.vertices);

                indexBuffer = device.createBuffer({
                    label: 'index data buffer',
                    size: obj.mesh.indices.byteLength,
                    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                });
                device.queue.writeBuffer(indexBuffer, 0 , obj.mesh.indices);     
                this.#meshCache.set(obj.mesh, {
                    vertexBuffer,
                    indexBuffer,
                });                 
            }

            //initializing and updating shader resources, fetching bind groups and their layouts
            const bindGroups : Map<number, GPUBindGroup> = new Map<number, GPUBindGroup>();
            const bindGroupLayouts: GPUBindGroupLayout[] = []
            let objectRenderError: boolean = false;
            obj.material.shader.resources.forEach((res)=>{
                const shaderResourceContext: ShaderResourceContext = {
                    object: obj,
                    renderContext: renderContext,
                };
                const bindGroupLayout = device.createBindGroupLayout(res.getBindGroupLayoutDescriptor(shaderResourceContext)) ;
                bindGroupLayouts.push(bindGroupLayout);

                let initSuccess;
                let updateSuccess; 
                if(!res.initialized){
                    initSuccess = res.init(shaderResourceContext, bindGroupLayout)
                    if(!initSuccess){
                        console.error("[renderScene] couldn't init shaderResource");
                        objectRenderError = true;
                        return;                        
                    }
                }
                
                updateSuccess = res.update(shaderResourceContext);
                if(!updateSuccess){
                    console.error("[renderScene] couldn't update shaderResource");
                    objectRenderError = true;
                    return;  
                }
                const bindGroup = res.getBindGroup()!;
                const groupId = res.bindGroupNumber;
                bindGroups.set(groupId, bindGroup);
            })
            if(objectRenderError){
                console.log("[renderScene] objectRenderError")
                return;
            }

            //creating render pipeline
            const shader = obj.material.shader;
            const shaderModule = device.createShaderModule({code: shader.code})
            debugShader(shaderModule);
            const pipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: bindGroupLayouts,
            });

            const renderPipeline = device.createRenderPipeline({
                label: 'Selected object mesh pipeline',
                layout: pipelineLayout,
                vertex: {
                    entryPoint: shader.vertexEntryPoint,
                    module: shaderModule,
                    buffers:[
                        {
                            arrayStride: obj.mesh.layout.stride,
                            attributes: obj.mesh.layout.attributes,
                        }
                    ]
                },
                fragment: {
                    entryPoint: shader.fragmentEntryPoint,
                    module: shaderModule,
                    targets: [{format: this.#presentationFormat!,
                        blend: {
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                },
                    }],

                },
                primitive: obj.mesh.primitiveState,
                depthStencil: obj.mesh.depthStencilState
            });

            gizmoPass.setPipeline(renderPipeline);
            gizmoPass.setVertexBuffer(0 , vertexBuffer);
            gizmoPass.setIndexBuffer(indexBuffer, "uint32");
            bindGroups.forEach((group,id)=>{
                gizmoPass.setBindGroup(id, group);
            })            
            gizmoPass.drawIndexed(obj.mesh.indices.length);
            //console.log("[renderScene]Drawed: " + obj.name);
        });
        gizmoPass.end();
        
        
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
        //console.log("[renderScene] commandBuffer submitted");
    }

    /*
    getObjectRenderResources(device: GPUDevice, obj: RenderableObject, renderTechniqueType: RenderTechniqueType, renderTechniqueRes: RenderTechniqueResources): ObjectRenderResources {


        if(renderTechniqueType == RenderTechniqueType.FILLED){

        }else if(renderTechniqueType == RenderTechniqueType.GIZMO){
            const uniformBufferView = makeStructuredView(makeShaderDataDefinitions(renderTechniqueRes.shaderCode).uniforms.uniformData);
            const uniformBuffer = device.createBuffer({
                label: 'uniform buffer',
                size: uniformBufferView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            const bindGroup = device.createBindGroup({
                label: 'bind group for uniform data',
                layout: renderTechniqueRes.bindGroupLayout,
                entries:[{
                    binding: 0,
                    resource: {buffer: uniformBuffer},
                }]
            })
            uniformBufferView.set({
                anchor: ,
                scale: ,
                objectRotation: ,
            });
            device.queue.writeBuffer(uniformBuffer, 0, uniformBufferView.arrayBuffer);
            return {
                uniformBuffer,
                uniformBufferView,
                bindGroup,
            }
            
        }else if(renderTechniqueType == RenderTechniqueType.GRID){

        }else if(renderTechniqueType == RenderTechniqueType.OUTLINE){

        }else if(renderTechniqueType == RenderTechniqueType.WIREFRAME){

        }
    }*/

    resizeCanvas() {
        if(!this.initialized) return;
        const canvas = this.#canvas!;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
    };
}