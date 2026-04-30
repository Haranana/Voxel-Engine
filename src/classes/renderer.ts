import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils";
import { baseShaderWithWireframe, borderGridShader, voxelObjectBorderShader } from "../shaders/baseRenderableObjectShaders";
import type { Scene } from "./scene";

export type EntityRenderData = {
    renderPipeline: GPURenderPipeline | null;
    bindGroup: GPUBindGroup | null;
    uniformBuffer: GPUBuffer | null;
    uniformBufferView: StructuredView | null;
}

export class Renderer{

    #voxelObjectRenderData: EntityRenderData = {
        renderPipeline: null,
        bindGroup: null,
        uniformBuffer: null,
        uniformBufferView: null
    }
    #isVoxelObjectRenderDataLoaded() : boolean {
        return this.#voxelObjectRenderData.renderPipeline!=null && this.#voxelObjectRenderData.bindGroup!=null && 
        this.#voxelObjectRenderData.uniformBuffer!=null && this.#voxelObjectRenderData.uniformBufferView!=null
    }

    #selectedAreaRenderData: EntityRenderData = {
        renderPipeline: null,
        bindGroup: null,
        uniformBuffer: null,
        uniformBufferView: null
    }
    #isSelectedAreaRenderDataLoaded() : boolean {
        return this.#selectedAreaRenderData.renderPipeline!=null && this.#selectedAreaRenderData.bindGroup!=null && 
        this.#selectedAreaRenderData.uniformBuffer!=null && this.#selectedAreaRenderData.uniformBufferView!=null
    }

    #sceneBorderGridRenderData: EntityRenderData = {
        renderPipeline: null,
        bindGroup: null,
        uniformBuffer: null,
        uniformBufferView: null
    }
    #isSceneBorderGridRenderDataLoaded() : boolean {
        return this.#sceneBorderGridRenderData.renderPipeline!=null && this.#sceneBorderGridRenderData.bindGroup!=null && 
        this.#sceneBorderGridRenderData.uniformBuffer!=null && this.#sceneBorderGridRenderData.uniformBufferView!=null
    }

    #sceneBorderWireRenderData: EntityRenderData = {
        renderPipeline: null,
        bindGroup: null,
        uniformBuffer: null,
        uniformBufferView: null
    }
    #isSceneBorderWireRenderDataLoaded() : boolean {
        return this.#sceneBorderWireRenderData.renderPipeline!=null && this.#sceneBorderWireRenderData.bindGroup!=null && 
        this.#sceneBorderWireRenderData.uniformBuffer!=null && this.#sceneBorderWireRenderData.uniformBufferView!=null
    }

    #device: GPUDevice | null  = null
    #canvas: HTMLCanvasElement | null = null
    #adapter: GPUAdapter | null = null
    #context: GPUCanvasContext | null = null
    #presentationFormat: GPUTextureFormat | null = null
    #depthTexture: GPUTexture | null = null
    #renderPassDescriptor: GPURenderPassDescriptor | null = null
    initialized: boolean = false;

    constructor(){}

    async init(canvas: HTMLCanvasElement): Promise<boolean>{
        if(this.initialized) return false;
        const adapter = await navigator.gpu?.requestAdapter();
        if(!adapter) {
            return false;
        }

        const device = await adapter.requestDevice();
        if (!device) {
            return false;
        }

        const context = canvas.getContext('webgpu');
        if(!context){
            return false;
        }

        this.#device = device;
        this.#canvas =canvas;
        this.#adapter = adapter;
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
        this.#renderPassDescriptor = {
        label: `basic canvas renderPass`,
        colorAttachments: [
            {
                view: canvasTexture.createView(),
                loadOp: 'clear',
                storeOp: 'store',                    
            },
        ],
            depthStencilAttachment: {
            view: this.#depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            },
        };
        this.loadVoxelObjectRenderData();
        this.loadSelectedAreaRenderData();
        this.loadSceneBorderGridRenderData();
        this.loadSceneBorderWireRenderData();
        this.initialized = true;

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

        this.#renderPassDescriptor = {
        label: `basic canvas renderPass`,
        colorAttachments: [
            {
                view: canvasTexture.createView(),
                loadOp: 'clear',
                storeOp: 'store',                    
            },
        ],
            depthStencilAttachment: {
            view: this.#depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            },
        };
    }

    loadVoxelObjectRenderData(){
        if(!this.initialized) false;
        const device = this.#device!;

        const shaderCode = baseShaderWithWireframe();
        const shaderModule = device.createShaderModule({
            label: 'voxel object shader module',
            code: shaderCode,
        });

        const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
            },
        ],
        });

        this.#voxelObjectRenderData.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.uniformData);
        this.#voxelObjectRenderData.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.#voxelObjectRenderData.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        this.#voxelObjectRenderData.renderPipeline = device.createRenderPipeline({
            label: 'Selected object mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: shaderModule,
                buffers:[
                    {
                        arrayStride: 6*4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'unorm8x4',
                            },
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: 'float32x2',
                            },
                        ]
                    }
                ]
            },
            fragment: {
                entryPoint: `fragmentShader`,
                module: shaderModule,
                targets: [{format: this.#presentationFormat!}],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: 'front',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        this.#voxelObjectRenderData.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.#voxelObjectRenderData.uniformBuffer!},
            }]
        })
    }

    loadSelectedAreaRenderData(){
        if(!this.initialized) false;
        const device = this.#device!;

        const shaderCode = baseShaderWithWireframe();
        const shaderModule = device.createShaderModule({
            label: 'voxel object shader module',
            code: shaderCode,
        });

        const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
            },
        ],
        });

        this.#selectedAreaRenderData.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.uniformData);
        this.#selectedAreaRenderData.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.#selectedAreaRenderData.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        this.#selectedAreaRenderData.renderPipeline = device.createRenderPipeline({
            label: 'Selected object mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: shaderModule,
                buffers:[
                    {
                        arrayStride: 6*4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'unorm8x4',
                            },
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: 'float32x2',
                            },
                        ]
                    }
                ]
            },
            fragment: {
                entryPoint: `fragmentShader`,
                module: shaderModule,
                targets: [{format: this.#presentationFormat!}],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: 'front',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less-equal',
                format: 'depth24plus',
            },
        });

        this.#selectedAreaRenderData.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.#selectedAreaRenderData.uniformBuffer!},
            }]
        })
    }

    loadSceneBorderGridRenderData(){
        if(!this.initialized) false;
        const device = this.#device!;
        
        const shaderCode = borderGridShader();
        const shaderModule = device.createShaderModule({
            label: 'voxel object shader module',
            code: shaderCode,
        });

        const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
            },
        ],
        });

        this.#sceneBorderGridRenderData.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.uniformData);
        this.#sceneBorderGridRenderData.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.#sceneBorderGridRenderData.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        this.#sceneBorderGridRenderData.renderPipeline = device.createRenderPipeline({
            label: 'Selected object mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: shaderModule,
                buffers:[
                    {
                        arrayStride: 6*4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'unorm8x4',
                            },
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: 'float32x2',
                            },
                        ]
                    }
                ]
            },
            fragment: {
                entryPoint: `fragmentShader`,
                module: shaderModule,
                targets: [{
                    format: this.#presentationFormat!,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                }],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: 'back',
            },
            depthStencil: {
                depthCompare: 'less',
                depthWriteEnabled: false,
                format: 'depth24plus',
            },
        });

        this.#sceneBorderGridRenderData.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.#sceneBorderGridRenderData.uniformBuffer!},
            }]
        })
    }

    loadSceneBorderWireRenderData(){
        if(!this.initialized) false;
        const device = this.#device!;

        const shaderCode = voxelObjectBorderShader();
        const shaderModule = device.createShaderModule({
            label: 'voxel object shader module',
            code: shaderCode,
        });

        const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" },
            },
        ],
        });

        this.#sceneBorderWireRenderData.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.uniformData);
        this.#sceneBorderWireRenderData.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.#sceneBorderWireRenderData.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        this.#sceneBorderWireRenderData.renderPipeline = device.createRenderPipeline({
            label: 'Selected object mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: shaderModule,
                buffers:[
                    {
                        arrayStride: 6*4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'unorm8x4',
                            },
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: 'float32x2',
                            },
                        ]
                    }
                ]
            },
            fragment: {
                entryPoint: `fragmentShader`,
                module: shaderModule,
                targets: [{format: this.#presentationFormat!}],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: 'back',
            },
            depthStencil: {
                depthCompare: 'less-equal',
                depthWriteEnabled: true,
                format: 'depth24plus',
            },
        });

        this.#sceneBorderWireRenderData.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.#sceneBorderWireRenderData.uniformBuffer!},
            }]
        })
    }

    renderScene(scene: Scene){
        if(!this.initialized) return false;
        //console.log(`[renderScene] camera: ` + scene.getCameraCopy().pitch + " : " + scene.getCameraCopy().yaw ) ;
        const device = this.#device!;
        const context = this.#context!;
        const canvas = this.#canvas!;

        this.resizeCanvas(scene);
        const canvasTexture = context.getCurrentTexture();

        if (this.#depthTexture!.width !== canvasTexture.width ||
            this.#depthTexture!.height !== canvasTexture.height) {

            this.#depthTexture!.destroy();
            this.updateDepthTexture();
        };

        const encoder : GPUCommandEncoder = device.createCommandEncoder({
            label: 'GPU command encoder'
        });

        this.#renderPassDescriptor = {
        label: `basic canvas renderPass`,
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
        };
        const pass : GPURenderPassEncoder = encoder.beginRenderPass(this.#renderPassDescriptor!);
        //console.log(`[renderScene] after initializations, starting proper entities render`);
        //render object
        if(this.#isVoxelObjectRenderDataLoaded()){
            if(scene.getObjectRef().shouldRebuildMesh()) {
                scene.getObjectRef().rebuildMesh();
            }
            const {vertexData, linesIndices, trianglesIndices, quadsIndices} = scene.getObjectRef().mesh!.getVerticesData();
            //console.log(`[renderScene] object mesh has: ${trianglesIndices.length} indices`);
            const vertexDataBuffer = device.createBuffer({
                label: 'vertex data buffer',
                size: vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(vertexDataBuffer , 0 , vertexData);

            const trianglesIndexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: trianglesIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(trianglesIndexBuffer, 0 , trianglesIndices);

            const linesIndexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: linesIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(linesIndexBuffer, 0 , linesIndices);

            const quadsIndexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: quadsIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(quadsIndexBuffer, 0 , quadsIndices);

            const ndcProjection = scene.getCameraCopy().projectionType === "orthographic"? scene.getOrthoProjectionMatrix() : scene.getPerspectiveProjectionMatrix();
            const shadersUniformsValuesResolution = [canvas.width, canvas.height];
            this.#voxelObjectRenderData.uniformBufferView!.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: scene.getObjectTransformMatrix().toArrays(),
                ndcProjection: ndcProjection.toArrays(),
                viewMatrix: scene.getCameraView().toArrays(),
            });
            //console.log(`[viewMatrix]: ${scene.getCameraView().toArrays().toString()}`)
            device.queue.writeBuffer(this.#voxelObjectRenderData.uniformBuffer!, 0, this.#voxelObjectRenderData.uniformBufferView!.arrayBuffer);

            pass.setPipeline(this.#voxelObjectRenderData.renderPipeline!);
            pass.setVertexBuffer(0 , vertexDataBuffer);
            pass.setIndexBuffer(trianglesIndexBuffer, "uint32");
            pass.setBindGroup(0, this.#voxelObjectRenderData.bindGroup);
            //console.log(`[renderScene] drawing ${trianglesIndices.length} vertices of voxel object`);
            pass.drawIndexed(trianglesIndices.length);
        }
        //render selected area
        if(this.#isSelectedAreaRenderDataLoaded()){

            const selectedAreaMesh = scene.getObjectRef().getSelectedAreaMesh();
            const meshData = selectedAreaMesh!.getVerticesData();
            console.log(`[renderScene] selectedAreaVertices: ${meshData.trianglesIndices.length}`)

            const vertexBuffer = device.createBuffer({
                label: 'vertex data buffer',
                size: meshData.vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(vertexBuffer , 0 , meshData.vertexData);

            const indexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: meshData.trianglesIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(indexBuffer, 0 , meshData.trianglesIndices);

            const shadersUniformsValuesResolution = [canvas.width, canvas.height];
            this.#selectedAreaRenderData.uniformBufferView!.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: scene.getObjectTransformMatrix().toArrays(),
                ndcProjection: scene.getPerspectiveProjectionMatrix().toArrays(),
                viewMatrix: scene.getCameraView().toArrays(),
            });
            device.queue.writeBuffer(this.#selectedAreaRenderData.uniformBuffer!, 0, this.#selectedAreaRenderData.uniformBufferView!.arrayBuffer);

            pass.setPipeline(this.#selectedAreaRenderData.renderPipeline!);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setIndexBuffer(indexBuffer, "uint32");
            pass.setBindGroup(0, this.#selectedAreaRenderData.bindGroup);
            //console.log(`[renderScene] drawing ${meshData.trianglesIndices.length} vertices of selected area`);
            pass.drawIndexed(meshData.trianglesIndices.length);
        }

        //render border grid
        if(scene.options.borderGrid && this.#isSceneBorderGridRenderDataLoaded() ){
            
            const meshData = scene.getObjectRef().getBorderGrid().getVerticesData();

            const vertexBuffer = device.createBuffer({
                label: 'vertex data buffer',
                size: meshData.vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(vertexBuffer , 0 , meshData.vertexData);

            const indexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: meshData.trianglesIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(indexBuffer, 0, meshData.trianglesIndices);

            const shadersUniformsValuesResolution = [canvas.width, canvas.height];
            this.#sceneBorderGridRenderData.uniformBufferView!.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: scene.getObjectTransformMatrix().toArrays(),
                ndcProjection: scene.getPerspectiveProjectionMatrix().toArrays(),
                viewMatrix: scene.getCameraView().toArrays(),
            });
            device.queue.writeBuffer(this.#sceneBorderGridRenderData.uniformBuffer!, 0, this.#sceneBorderGridRenderData.uniformBufferView!.arrayBuffer);

            pass.setPipeline(this.#sceneBorderGridRenderData.renderPipeline!);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setIndexBuffer(indexBuffer, "uint32");
            pass.setBindGroup(0, this.#sceneBorderGridRenderData.bindGroup);
            //console.log(`[renderScene] drawing ${meshData.trianglesIndices.length} vertices of border grid`);
            pass.drawIndexed(meshData.trianglesIndices.length);
        }

        //render border wire
        if(scene.options.borderWire && this.#isSceneBorderWireRenderDataLoaded()){
            const meshData = scene.getObjectRef().getBorderMesh().getVerticesData();

            const objectBorderVertexDataBuffer = device.createBuffer({
                label: 'vertex data buffer',
                size: meshData.vertexData.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(objectBorderVertexDataBuffer , 0 , meshData.vertexData);

            const objectBorderTrianglesIndexBuffer = device.createBuffer({
                label: 'index data buffer',
                size: meshData.trianglesIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(objectBorderTrianglesIndexBuffer, 0, meshData.trianglesIndices);

            const shadersUniformsValuesResolution = [canvas.width, canvas.height];
            this.#sceneBorderWireRenderData.uniformBufferView!.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: scene.getObjectTransformMatrix().toArrays(),
                ndcProjection: scene.getPerspectiveProjectionMatrix().toArrays(),
                viewMatrix: scene.getCameraView().toArrays(),
            });
            device.queue.writeBuffer(this.#sceneBorderWireRenderData.uniformBuffer!, 0, this.#sceneBorderWireRenderData.uniformBufferView!.arrayBuffer);

            pass.setPipeline(this.#sceneBorderWireRenderData.renderPipeline!);
            pass.setVertexBuffer(0, objectBorderVertexDataBuffer);
            pass.setIndexBuffer(objectBorderTrianglesIndexBuffer, "uint32");
            pass.setBindGroup(0, this.#sceneBorderWireRenderData.bindGroup);
            pass.drawIndexed(meshData.trianglesIndices.length);
        }
        pass.end();
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

    resizeCanvas(scene: Scene | null = null) {
        if(!this.initialized) return;
        const canvas = this.#canvas!;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        if(scene){
            scene.setNdcProjectionMatrices();
        }

    };

}