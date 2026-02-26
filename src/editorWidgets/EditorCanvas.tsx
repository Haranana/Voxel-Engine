import { useEffect, useRef } from "react";
import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils";
import type { ObjectProperties } from "../RenderableObjectTypes";
import { Vector2 } from "../math/vector2.type";

export type EditorCanvasProps = {
    objectProperties: ObjectProperties | null
}

type RenderData = {
    context : GPUCanvasContext | null,
    device : GPUDevice | null,
    pipeline : GPURenderPipeline | null,
    uniformDataBuffer : GPUBuffer | null,
    bindGroup : GPUBindGroup | null,
    uniformView: StructuredView | null,
    indexBuffer: GPUBuffer | null,
    vertexBuffer: GPUBuffer | null,
    verticesAmount: number | null,
};

export default function EditorCanvas(props: EditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const renderDataRef = useRef<RenderData>({
        context : null,
        device : null,
        pipeline : null,
        uniformDataBuffer : null,
        bindGroup : null,
        uniformView: null,
        indexBuffer: null,
        vertexBuffer: null,
        verticesAmount: null,
    });

    const canRender = () => {
        const r = renderDataRef.current;
        return r.context && r.device && r.pipeline && r.uniformDataBuffer && r.bindGroup && r.uniformView && r.indexBuffer && r.vertexBuffer && r.verticesAmount; 
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
          const vertexData = new Float32Array([
            // left column
            0, 0,
            30, 0,
            0, 150,
            30, 150,
        
            // top rung
            30, 0,
            100, 0,
            30, 30,
            100, 30,
        
            // middle rung
            30, 60,
            70, 60,
            30, 90,
            70, 90,
        ]);
        
        const indexData = new Uint32Array([
            0,  1,  2,    2,  1,  3,  // left column
            4,  5,  6,    6,  5,  7,  // top run
            8,  9, 10,   10,  9, 11,  // middle run
        ]);
        
        return {
            vertexData,
            indexData,
            numVertices: indexData.length,
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
                color: vec4f,
                resolution: vec2f,
                translation: vec2f,
            };

            struct Vertex{
                @location(0) position: vec2f,
            };

            struct VertexShaderOutput{
                @builtin(position) position: vec4f,
            }

            @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

            @vertex fn vertexShader(
                v: Vertex) -> VertexShaderOutput {
                
                var out: VertexShaderOutput;

                let vertPixelPosition = v.position + uniformData.translation;
                let vertNdcPosition = ((((vertPixelPosition/uniformData.resolution)*2.0)-1.0)*vec2f(1,-1));
                out.position = vec4f(vertNdcPosition, 0.0, 1.0);
                
                return out;
            }
        
            @fragment fn fragmentShader() -> @location(0) vec4f {
                return uniformData.color;
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
                        arrayStride: 2*4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2',
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
        });

        const shaderDef = makeShaderDataDefinitions(shadersCode);
        const shadersUniformsView = makeStructuredView(shaderDef.uniforms.uniformData);
        const shadersUniformsValuesColor = [rand(0,1), rand(0,1), rand(0,1), 1];
        shadersUniformsView.set({color: shadersUniformsValuesColor});

        const uniformDataBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: shadersUniformsView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });


        const {vertexData, indexData, numVertices} = getSampleFData();
        const vertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const indexDataBuffer = device.createBuffer({
            label: 'index data buffer',
            size: indexData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(vertexDataBuffer , 0 , vertexData);
        device.queue.writeBuffer(indexDataBuffer, 0 , indexData);

        const bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: pipeline.getBindGroupLayout(0),
            entries:[{
                binding: 0,
                resource: uniformDataBuffer,
            }]
        })

        renderDataRef.current.context = context;
        renderDataRef.current.device = device;
        renderDataRef.current.pipeline = pipeline;
        renderDataRef.current.uniformDataBuffer = uniformDataBuffer;
        renderDataRef.current.bindGroup = bindGroup;
        renderDataRef.current.uniformView = shadersUniformsView;
        renderDataRef.current.indexBuffer = indexDataBuffer;
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
        const indexBuffer = r.indexBuffer!;
        const vertexBuffer = r.vertexBuffer!;
        const verticesAmount = r.verticesAmount!;

            const view = context!.getCurrentTexture().createView();

            const objectTranslation : Vector2 = props.objectProperties? props.objectProperties.translation : new Vector2(0,0);
            const shadersUniformsValuesTranslation = [objectTranslation.x , objectTranslation.y]
            
            const renderPassDescriptor : GPURenderPassDescriptor = {
            label: `basic canvas renderPass`,
            colorAttachments: [
                {
                    view,
                    loadOp: 'clear',
                    storeOp: 'store',
                    
                },
            ],
            };
            
            const encoder : GPUCommandEncoder = device!.createCommandEncoder({
                label: 'basic encoder'
            });
            resize(canvas!);

            const shadersUniformsValuesResolution = [canvas!.width, canvas!.height];
            uniformView.set({
                resolution: shadersUniformsValuesResolution,
                translation: shadersUniformsValuesTranslation,
            });
            device!.queue.writeBuffer(uniformDataBuffer, 0, uniformView.arrayBuffer);

            const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0 , vertexBuffer);
            pass.setIndexBuffer(indexBuffer, 'uint32');
            pass.setBindGroup(0, bindGroup);
            pass.drawIndexed(verticesAmount);
            pass.end();

            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }

  useEffect(() => {
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
