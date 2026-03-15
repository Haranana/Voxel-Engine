import { useEffect, useRef } from "react";
import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils";
import type { ObjectProperties, RenderMode } from "../RenderableObjectTypes";
import { degreeToRadians } from "../math/utils";
import { Matrices4, PerspectiveMatrices } from "../math/matrices";
import type { Matrix4 } from "../math/matrix4.type";
import type { Camera } from "../classes/camera";
import type { VoxelObject } from "../classes/voxelObject";

export type EditorCanvasProps = {
    objectProperties: ObjectProperties | null;
    selectedObject: VoxelObject,
    camera: Camera;
    renderMode: RenderMode;
}

type RenderData = {
    context : GPUCanvasContext | null,
    device : GPUDevice | null,
    pipeline : GPURenderPipeline | null,
    uniformDataBuffer : GPUBuffer | null,
    bindGroup : GPUBindGroup | null,
    uniformView: StructuredView | null,
    vertexBuffer: GPUBuffer | null,
    verticesAmount: number | null,
    indexBuffer: GPUBuffer | null,
    indicesAmount: number | null,
    depthTexture: GPUTexture | null,
};

export default function EditorCanvas(props: EditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const initializedRef = useRef(false);
    const renderDataRef = useRef<RenderData>({
        context : null,
        device : null,
        pipeline : null,
        uniformDataBuffer : null,
        bindGroup : null,
        uniformView: null,
        vertexBuffer: null,
        verticesAmount: null,
        indexBuffer: null,
        indicesAmount: null,
        depthTexture: null,
    });

    const canRender = () => {
        const r = renderDataRef.current;
        return r.context && r.device && r.pipeline && r.uniformDataBuffer && r.bindGroup && r.uniformView  && r.vertexBuffer && r.verticesAmount && r.indexBuffer && r.indicesAmount; 
    }

    const resize = (canvas: HTMLCanvasElement) => {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
    };

    const initRenderer = async () => {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        if (!device) {
            console.log('need a browser that supports WebGPU');
            return;
        }

        const canvas = canvasRef.current;
        if(!canvas) return;

        const context = canvas.getContext('webgpu');
        if(!context){
            console.log('canvas context not present');
            return;
        }
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied'
        });
        resize(canvasRef.current!);
        
        const shadersCode = `
            struct UniformDataStruct{
                resolution: vec2f,
                _pad: vec2f,
                objectTransform: mat4x4f,
                ndcProjection: mat4x4f,    
                viewMatrix: mat4x4f,
                baseColor: vec4f,
            };

            struct Vertex{
                @location(0) position: vec3f,
                @location(1) color: vec4f,
            };

            struct VertexShaderOutput{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            }

            @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

            @vertex fn vertexShader(
                v: Vertex) -> VertexShaderOutput {
                
                var out: VertexShaderOutput;
                let vertPixelPosition = uniformData.objectTransform * vec4f(v.position, 1.0);

                let vertNdcPosition = (uniformData.ndcProjection * uniformData.viewMatrix * vertPixelPosition).xyzw;
                out.position = vec4f(vertNdcPosition);
                out.color = uniformData.baseColor;

                return out;
            }
        
            @fragment fn fragmentShader(vnOut: VertexShaderOutput) -> @location(0) vec4f {
                return vnOut.color;
            }
        `

        const baseShaderModule = device.createShaderModule({
            label: 'F shape shaders',
            code: shadersCode,
        });

        const selectedTopology = props.renderMode == "Raster"? "triangle-list" : "line-list";

        const pipeline = device.createRenderPipeline({
            label: '2D letter F',
            layout: 'auto',
            vertex: {
                entryPoint: `vertexShader`,
                module: baseShaderModule,
                buffers:[
                    {
                        arrayStride: 4*4,
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
                            }
                        ]
                    }
                ]
            },
            fragment: {
                entryPoint: `fragmentShader`,
                module: baseShaderModule,
                targets: [{format: presentationFormat}],
            },
            primitive: {
                topology: selectedTopology,
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        const shaderDef = makeShaderDataDefinitions(shadersCode);
        const shadersUniformsView = makeStructuredView(shaderDef.uniforms.uniformData);

        const uniformDataBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: shadersUniformsView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        if(props.selectedObject.shouldRebuildMesh()) props.selectedObject.rebuildMesh();
        const {vertexData, linesIndices, trianglesIndices, quadsIndices, numVertices} = props.selectedObject.mesh!.getVerticesData();

        const vertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(vertexDataBuffer , 0 , vertexData);

        const indexDataValues = props.renderMode == "Raster"? trianglesIndices : props.renderMode == "TriangleWireframe"? linesIndices : quadsIndices;
        const indexDataBuffer = device.createBuffer({
            label: 'index data buffer',
            size: indexDataValues.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(indexDataBuffer, 0 , indexDataValues);

        const bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: pipeline.getBindGroupLayout(0),
            entries:[{
                binding: 0,
                resource: {buffer: uniformDataBuffer},
            }]
        })

        const indicesAmount = indexDataValues.length;
        renderDataRef.current.context = context;
        renderDataRef.current.device = device;
        renderDataRef.current.pipeline = pipeline;
        renderDataRef.current.uniformDataBuffer = uniformDataBuffer;
        renderDataRef.current.bindGroup = bindGroup;
        renderDataRef.current.uniformView = shadersUniformsView;
        renderDataRef.current.vertexBuffer = vertexDataBuffer;
        renderDataRef.current.verticesAmount = numVertices;
        renderDataRef.current.indexBuffer = indexDataBuffer;
        renderDataRef.current.indicesAmount = indicesAmount;
        
        if(canRender()) renderVoxelObject();
    }

    function renderVoxelObject(){

        const r = renderDataRef.current;
        if (!canRender()) return;

        const canvas = canvasRef.current!;

        const context = r.context!;
        const device = r.device!;
        const pipeline = r.pipeline!;
        const uniformDataBuffer = r.uniformDataBuffer!;
        const bindGroup = r.bindGroup!;
        const uniformView = r.uniformView!;
        const vertexBuffer = r.vertexBuffer!;
        const verticesAmount = r.verticesAmount!;
        const indexBuffer = r.indexBuffer!;
        const indicesAmount = r.indicesAmount!;
        let depthTexture = r.depthTexture;

        resize(canvas!);

        const canvasTexture = context.getCurrentTexture();
        const view = canvasTexture.createView();

            const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
            const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
            const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));

            const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
            const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
            const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();

            const shadersUniformsObjectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale).toArrays();
            const shadersUniformsNdcProjectionMatrix = props.camera.projectionType==="orthographic"?
             PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far).toArrays() 
             : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height).toArrays();
            const shadersUniformsCameraViewMatrix = cameraTranslation.multMatrix(cameraRotation).multMatrix(cameraScale).getInversion().toArrays();

            if (!depthTexture ||
                depthTexture.width !== canvasTexture.width ||
                depthTexture.height !== canvasTexture.height) {
            if (depthTexture) {
                depthTexture.destroy();
            }
            depthTexture = device.createTexture({
                size: [canvasTexture.width, canvasTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            }
            r.depthTexture = depthTexture;
            const depthStencilAttachmentView = depthTexture.createView();

            const renderPassDescriptor : GPURenderPassDescriptor = {
            label: `basic canvas renderPass`,
            colorAttachments: [
                {
                    view,
                    loadOp: 'clear',
                    storeOp: 'store',                    
                },
            ],
                depthStencilAttachment: {
                view: depthStencilAttachmentView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                },
            };
            
            const encoder : GPUCommandEncoder = device!.createCommandEncoder({
                label: 'basic encoder'
            });
            

            const shadersUniformsValuesResolution = [canvas!.width, canvas!.height];
            uniformView.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: shadersUniformsObjectTransformMatrix,
                ndcProjection: shadersUniformsNdcProjectionMatrix,
                viewMatrix: shadersUniformsCameraViewMatrix,
                baseColor: [0.5,0.3,0.62,1],
            });
            device!.queue.writeBuffer(uniformDataBuffer, 0, uniformView.arrayBuffer);

            const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0 , vertexBuffer);
            pass.setIndexBuffer(indexBuffer, "uint32");
            pass.setBindGroup(0, bindGroup);
            pass.drawIndexed(indicesAmount);
            pass.end();

            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
    }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let requestedAnimationFrame = 0;
    
    initRenderer().catch((e) => console.error(e));
    return () => cancelAnimationFrame(requestedAnimationFrame);
  }, []);

  useEffect(()=>{
    renderVoxelObject();
  }, [props.objectProperties , props.camera])

  return (
    <div className="CanvasContainer">
        <canvas
        ref={canvasRef}
        className="EditorMainCanvas"
        />
    </div>
  );
}
