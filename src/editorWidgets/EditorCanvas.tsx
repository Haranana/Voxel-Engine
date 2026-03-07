import { useEffect, useRef } from "react";
import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils";
import type { ObjectProperties } from "../RenderableObjectTypes";
import { degreeToRadians } from "../math/utils";
import type { Matrix3 } from "../math/matrix3.type";
import { Matrices3, Matrices4, PerspectiveMatrices } from "../math/matrices";
import type { Matrix4 } from "../math/matrix4.type";


export type ProjectionType =
  | "orthographic"
  | "perspective";

export type EditorCanvasProps = {
    objectProperties: ObjectProperties | null;
    cameraProjection: ProjectionType;
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
        depthTexture: null,
    });

    const canRender = () => {
        const r = renderDataRef.current;
        return r.context && r.device && r.pipeline && r.uniformDataBuffer && r.bindGroup && r.uniformView  && r.vertexBuffer && r.verticesAmount; 
    }

    const rand = (min: number, max: number) => {
        if (min === undefined) {
            min = 0;
            max = 1;
        } else if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);
    };

    const resize = (canvas: HTMLCanvasElement) => {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
    };

    const getSampleFData = () => {
        const positions = [
        // left column
    0, 0, 0,
    30, 0, 0,
    0, 150, 0,
    30, 150, 0,

    // top rung
    30, 0, 0,
    100, 0, 0,
    30, 30, 0,
    100, 30, 0,

    // middle rung
    30, 60, 0,
    70, 60, 0,
    30, 90, 0,
    70, 90, 0,

    // left column back
    0, 0, 30,
    30, 0, 30,
    0, 150, 30,
    30, 150, 30,

    // top rung back
    30, 0, 30,
    100, 0, 30,
    30, 30, 30,
    100, 30, 30,

    // middle rung back
    30, 60, 30,
    70, 60, 30,
    30, 90, 30,
    70, 90, 30,
        ];
        

        const indices = [
    // front
    0,  1,  2,    2,  1,  3,  // left column
    4,  5,  6,    6,  5,  7,  // top run
    8,  9, 10,   10,  9, 11,  // middle run

    // back
    12,  14,  13,   14, 15, 13,  // left column back
    16,  18,  17,   18, 19, 17,  // top run back
    20,  22,  21,   22, 23, 21,  // middle run back

    0, 12, 5,   12, 17, 5,   // top
    5, 17, 7,   17, 19, 7,   // top rung right
    6, 7, 18,   18, 7, 19,   // top rung bottom
    6, 18, 8,   18, 20, 8,   // between top and middle rung
    8, 20, 9,   20, 21, 9,   // middle rung top
    9, 21, 11,  21, 23, 11,  // middle rung right
    10, 11, 22, 22, 11, 23,  // middle rung bottom
    10, 22, 3,  22, 15, 3,   // stem right
    2, 3, 14,   14, 3, 15,   // bottom
    0, 2, 12,   12, 2, 14,   // left
        ];

        const quadColors = [
            200,  70, 120,  // left column front
      200,  70, 120,  // top rung front
      200,  70, 120,  // middle rung front

       80,  70, 200,  // left column back
       80,  70, 200,  // top rung back
       80,  70, 200,  // middle rung back

       70, 200, 210,  // top
      160, 160, 220,  // top rung right
       90, 130, 110,  // top rung bottom
      200, 200,  70,  // between top and middle rung
      210, 100,  70,  // middle rung top
      210, 160,  70,  // middle rung right
       70, 180, 210,  // middle rung bottom
      100,  70, 210,  // stem right
       76, 210, 100,  // bottom
      140, 210,  80,  // left
        ];

        const numVertices = indices.length;
        const vertexData = new Float32Array(numVertices * 4); // xyz + color
        const colorData = new Uint8Array(vertexData.buffer);

        for(let i = 0; i<indices.length; i++){
            const vertexPositionsStart = indices[i]*3;
            const vertexPositions = positions.slice(vertexPositionsStart , vertexPositionsStart+3);
            vertexData.set(vertexPositions, i*4);
            
            const quadPositionStart = Math.floor(i/6)*3;
            const quadColor = quadColors.slice(quadPositionStart, quadPositionStart + 3);
            colorData.set(quadColor, i * 16 + 12);  
            colorData[i * 16 + 15] = 255;       
        }
        
        return {
            vertexData,
            numVertices: numVertices,
        };
    }

    

    const renderSampleObject = async () => {
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
                ndcProjection: mat4x4f    
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

                let vertNdcPosition = (uniformData.ndcProjection * vertPixelPosition).xyzw;
                out.position = vec4f(vertNdcPosition);
                out.color = v.color;

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


        const {vertexData, numVertices} = getSampleFData();
        const vertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(vertexDataBuffer , 0 , vertexData);

        const bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: pipeline.getBindGroupLayout(0),
            entries:[{
                binding: 0,
                resource: {buffer: uniformDataBuffer},
            }]
        })

        renderDataRef.current.context = context;
        renderDataRef.current.device = device;
        renderDataRef.current.pipeline = pipeline;
        renderDataRef.current.uniformDataBuffer = uniformDataBuffer;
        renderDataRef.current.bindGroup = bindGroup;
        renderDataRef.current.uniformView = shadersUniformsView;
        //renderDataRef.current.indexBuffer = [indexDataBuffer];
        renderDataRef.current.vertexBuffer = vertexDataBuffer;
        renderDataRef.current.verticesAmount = numVertices;
        
        if(canRender()) render();
    }

     function render(){

        const r = renderDataRef.current;
        if (!canRender()) return;

        const canvas = canvasRef.current!;

        const context = r.context!;
        const device = r.device!;
        const pipeline = r.pipeline!;
        const uniformDataBuffer = r.uniformDataBuffer!;
        const bindGroup = r.bindGroup!;
        const uniformView = r.uniformView!;
        //const indexBuffer = r.indexBuffer!;
        const vertexBuffer = r.vertexBuffer!;
        const verticesAmount = r.verticesAmount!;
        let depthTexture = r.depthTexture;

        const canvasTexture = context.getCurrentTexture();
        const view = canvasTexture.createView();

            const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
            const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
            const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();


            const shadersUniformsObjectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale).toArrays();
            const shadersUniformsNdcProjectionMatrix = props.cameraProjection==="orthographic"?
             PerspectiveMatrices.orthogonalProjection(0, canvas.width,0, canvas.height, 0.1, 1000).toArrays() 
             : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(60), 0.1, 1000, canvas.width/canvas.height).toArrays();
            
            console.log(shadersUniformsNdcProjectionMatrix.toString());
            
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
            resize(canvas!);

            const shadersUniformsValuesResolution = [canvas!.width, canvas!.height];
            uniformView.set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: shadersUniformsObjectTransformMatrix,
                ndcProjection: shadersUniformsNdcProjectionMatrix,
            });
            device!.queue.writeBuffer(uniformDataBuffer, 0, uniformView.arrayBuffer);

            const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0 , vertexBuffer);
            //pass.setIndexBuffer(indexBuffer, 'uint32');
            pass.setBindGroup(0, bindGroup);
            pass.draw(verticesAmount);
            pass.end();

            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }

  useEffect(() => {
      if (initializedRef.current) return;
  initializedRef.current = true;
    let requestedAnimationFrame = 0;
    
    renderSampleObject().catch((e) => console.error(e));
    return () => cancelAnimationFrame(requestedAnimationFrame);
  }, []);

  useEffect(()=>{
    render();
  }, [props.objectProperties])

  return (
    <div className="CanvasContainer">
        <canvas
        ref={canvasRef}
        className="EditorMainCanvas"
        />
    </div>
  );
}
