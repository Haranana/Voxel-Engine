import { useEffect, useRef } from "react";
import { makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";

export default function WebGPUTester() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    //define function which calculates vertices coordinates
    function createCircleVertices({
            radius = 1,
            numSubdivisions = 24,
            innerRadius = 0,
            startAngle = 0,
            endAngle = Math.PI * 2,
            } = {}) {
            // 2 triangles per subdivision, 3 verts per tri, 2 values (xy) each.
            const numVertices = numSubdivisions * 3 * 2;
            const vertexData = new Float32Array(numSubdivisions * 2 * 3 * 2);
            
            let offset = 0;
            const addVertex = (x: number, y: number) => {
                vertexData[offset++] = x;
                vertexData[offset++] = y;
            };
            
            // 2 triangles per subdivision
            //
            // 0--1 4
            // | / /|
            // |/ / |
            // 2 3--5
            for (let i = 0; i < numSubdivisions; ++i) {
                const angle1 = startAngle + (i + 0) * (endAngle - startAngle) / numSubdivisions;
                const angle2 = startAngle + (i + 1) * (endAngle - startAngle) / numSubdivisions;
            
                const c1 = Math.cos(angle1);
                const s1 = Math.sin(angle1);
                const c2 = Math.cos(angle2);
                const s2 = Math.sin(angle2);
            
                // first triangle
                addVertex(c1 * radius, s1 * radius);
                addVertex(c2 * radius, s2 * radius);
                addVertex(c1 * innerRadius, s1 * innerRadius);
            
                // second triangle
                addVertex(c1 * innerRadius, s1 * innerRadius);
                addVertex(c2 * radius, s2 * radius);
                addVertex(c2 * innerRadius, s2 * innerRadius);
            }
            
            return {
                vertexData,
                numVertices,
            };
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

   const drawTriangle = async () => {

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
    });
    resize(canvasRef.current!);


    const baseShaderModule = device.createShaderModule({
    label: 'our hardcoded red triangle shaders',
    code: /* wgsl */ `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.2, -0.5),  // bottom left
          vec2f( 0.2, -0.5)   // bottom right
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
 
      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(0.6, 0.0, 0.6, 1.0);
      }
    `,
    });

    const pipeline = device.createRenderPipeline({
        label: 'Red triangle',
        layout: 'auto',
        vertex: {
            entryPoint: `vs`,
            module: baseShaderModule,
        },
        fragment: {
            entryPoint: `fs`,
            module: baseShaderModule,
            targets: [{format: presentationFormat}],
        },
    });

    

    function render(){
        const view = context!.getCurrentTexture().createView();
        
        const renderPassDescriptor : GPURenderPassDescriptor = {
        label: `basic canvas renderPass`,
        colorAttachments: [
            {
                view,
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
                
            },
        ],
        };
        
        const encoder : GPUCommandEncoder = device!.createCommandEncoder({
            label: 'basic encoder'
        });

        const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        device!.queue.submit([commandBuffer]);
    }
    render();
   } 

    const drawUniformTriangle = async () => {

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
        });
        resize(canvasRef.current!);

        const code = `
            struct SomeStruct{
                color: vec4f,
                scale: vec2f,
                offset: vec2f,
            };

            @group(0) @binding(0) var<uniform> someStruct: SomeStruct; 

            @vertex fn vs(
                @builtin(vertex_index) vertexIndex : u32
            ) -> @builtin(position) vec4f {
                let pos = array(
                vec2f( 0.0,  0.5),  // top center
                vec2f(-0.2, -0.5),  // bottom left
                vec2f( 0.2, -0.5)   // bottom right
                );
        
                return vec4f(
                    pos[vertexIndex] * someStruct.scale + someStruct.offset, 0.0, 1.0);
            }
        
            @fragment fn fs() -> @location(0) vec4f {
                return someStruct.color;
            }`

        const baseShaderModule = device.createShaderModule({
            label: 'uniform triangle',
            code: code,
        });

        const pipeline = device.createRenderPipeline({
            label: 'uniform triangle',
            layout: 'auto',
            vertex: {
                module: baseShaderModule,
            },
            fragment: {
                module: baseShaderModule,
                targets: [{format: presentationFormat}],
            },
        });


        const defs = makeShaderDataDefinitions(code);
        const myUniformValues = makeStructuredView(defs.uniforms.someStruct);
        
        const uniformBuffer = device.createBuffer({
            size: myUniformValues.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        myUniformValues.set({
            color: [0.8,0,0.8,1.0],
            scale: [1.5,1.5],
            offset: [1,1],       
        });

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: uniformBuffer}
            ]
        });


        function render(){
            device!.queue.writeBuffer(uniformBuffer, 0, myUniformValues.arrayBuffer);


            const view = context!.getCurrentTexture().createView();
            const renderPassDescriptor : GPURenderPassDescriptor = {
                label: `basic canvas renderPass`,
                colorAttachments: [
                    {
                        view,
                        clearValue: [0.3, 0.3, 0.3, 1],
                        loadOp: 'clear',
                        storeOp: 'store',
                        
                    },
                ],
            };
            
            const encoder : GPUCommandEncoder = device!.createCommandEncoder({
                label: 'basic encoder'
            });

            const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setBindGroup(0,bindGroup);
            pass.draw(3);
            pass.end();

            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }

        render();
   } 

    const drawPatternTriangle = async () => {

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
    });
    resize(canvasRef.current!);


    const baseShaderModule = device.createShaderModule({
    label: 'pattern triangle shaders',
    code: /* wgsl */ `

        struct VertexShaderOutput{
            @builtin(position) position: vec4f,
        }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> VertexShaderOutput {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.25, -0.5),  // bottom left
          vec2f( 0.25, -0.5)   // bottom right
        );
        
 
        var vsOutput: VertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex],0.0,1.0);
        
        return vsOutput;
      }
 
      @fragment fn fs(fsInput: VertexShaderOutput) -> @location(0) vec4f {
        let red = vec4f(1,0,0,1);
        let cyan = vec4f(0,1,1,1);
        let grid = vec2u(fsInput.position.xy)/8;
        let checker = (grid.x + grid.y) % 2 == 1;
        return select(red, cyan, checker);
      }
    `,
    });

    const pipeline = device.createRenderPipeline({
        label: 'Red triangle',
        layout: 'auto',
        vertex: {
            entryPoint: `vs`,
            module: baseShaderModule,
        },
        fragment: {
            entryPoint: `fs`,
            module: baseShaderModule,
            targets: [{format: presentationFormat}],
        },
    });

    

    function render(){
        const view = context!.getCurrentTexture().createView();
        
        const renderPassDescriptor : GPURenderPassDescriptor = {
        label: `basic canvas renderPass`,
        colorAttachments: [
            {
                view,
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
                
            },
        ],
        };
        
        const encoder : GPUCommandEncoder = device!.createCommandEncoder({
            label: 'basic encoder'
        });

        const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        device!.queue.submit([commandBuffer]);
    }
    render();
   } 

    const doubleOnGpu = async (nums: number[]) =>{
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter?.requestDevice();
        if(!adapter || !device){
            console.log("Couldn't inititalize GPU :( (adapter or device null");
            return;
        }

        const module = device.createShaderModule({
            label: 'Doubling module',
            code:`
            @group(0) @binding(0) var<storage, read_write> data: array<f32>;
 
            @compute @workgroup_size(1) fn computeSomething(
                @builtin(global_invocation_id) id: vec3u
            ) {
                let i = id.x;
                data[i] = data[i] * 2.0;
            }
            `,
        });

        const pipeline = device.createComputePipeline({
            label: 'Doubling pipeline',
            layout: 'auto',
            compute: {
                module,
            },
        });

        const input = new Float32Array(nums);

        const gpuDataBuffer = device.createBuffer({
            label: 'GPU data buffer',
            size: input.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(gpuDataBuffer, 0 , input);


        const gpuResultBuffer = device.createBuffer({
            label: 'GPU result buffer',
            size: input.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });

        const bindGroup = device.createBindGroup({
            label: 'bind group for work buffer',
            layout: pipeline.getBindGroupLayout(0),
            entries:[
                {
                    binding: 0,
                    resource: gpuDataBuffer,
                }
            ]
        });

        const encoder = device.createCommandEncoder({
            label: 'doubling encoder',
        });

        const pass = encoder.beginComputePass({
            label: 'doubling compute pass',
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(input.length);
        pass.end();

        encoder.copyBufferToBuffer(gpuDataBuffer, 0 , gpuResultBuffer,0, gpuResultBuffer.size);


        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        await gpuResultBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(gpuResultBuffer.getMappedRange());

        console.log('input: ', input);
        console.log('result: ', result);

        gpuResultBuffer.unmap();
    }

    const drawManyTrianglesWithStorageBuffers = async () => {
        //get adapter and device
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter?.requestDevice();
        
        if(!adapter || !device || !canvasRef.current){
            console.log("something went wrong");
            return;
        }

        //initialize context
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        const context = canvasRef.current.getContext('webgpu');
        if(!context){
            console.log("something went wrong");
            return;
        }
        context.configure({
            device,
            format: presentationFormat
        })

        //load shaders
        const code = `

            struct VerticesShaderOutput{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            };

            struct ScaleStruct{
                scale: vec2f,                
            };

            struct VisualsStruct{
                color: vec4f,
            };

            struct PositionStruct{
                offset: vec2f,
            };

            const N: u32 = 100u;

            @group(0) @binding(0) var<storage, read> scale: array<ScaleStruct, N>;
            @group(0) @binding(1) var<storage, read> visuals: array<VisualsStruct, N>; 
            @group(0) @binding(2) var<storage, read> position: array<PositionStruct, N>; 
        
            @vertex fn initVertices(@builtin(vertex_index) vertexIndex : u32,
            @builtin(instance_index) instanceIndex: u32) 
            -> VerticesShaderOutput{
            
                let pos = array(
                    vec2f(0.0 , 0.5),
                    vec2f(-0.3,-0.5),
                    vec2f(0.3,-0.5),
                );

                let currentScale = scale[instanceIndex];
                let currentPosition = position[instanceIndex];
                let currentVisual = visuals[instanceIndex];

                var out: VerticesShaderOutput;
                out.position = vec4f(
                    pos[vertexIndex] * currentScale.scale + currentPosition.offset, 0.0, 1.0
                );
                out.color = currentVisual.color;
                return out;
            }
            
            @fragment fn fragmentShader(in: VerticesShaderOutput) -> @location(0) vec4f{
                return in.color;
            }
            `
        
        const module = device.createShaderModule({
            code,
        });

        //define pipeline (which shader modules are responsible for vertices and coloring)
        const pipeline = device.createRenderPipeline({
            label: 'multiple triangles with uniform buffer',
            layout: 'auto',
            vertex: {
                module,
                entryPoint: `initVertices`,
            },
            fragment: {
                module,
                entryPoint: `fragmentShader`,
                targets: [{format: presentationFormat}],
            },
        });

        //init data for buffers creation
        const objectsNumber = 100;

        type ObjectInfo = {
            color: number[],
        };
        const objectInfos : ObjectInfo[] = [];

        const defs = makeShaderDataDefinitions(code);
        const scaleView = makeStructuredView(defs.storages.scale);
        const positionView = makeStructuredView(defs.storages.position);
        const visualsView = makeStructuredView(defs.storages.visuals);

        //create buffers
        const scaleStorageBuffer = device.createBuffer({
            label: `transform buffer for objects`,
            size: scaleView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        const positionStorageBuffer = device.createBuffer({
            label: `transform buffer for objects`,
            size: positionView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        const visualsStorageBuffer = device.createBuffer({
            label: `visual buffer for objects`,
            size: visualsView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

            const scaleViewValues : {scale : number[]}[] = [];
        const positionViewValues : {offset : number[]}[] = [];
        for(let i = 0; i < objectsNumber; i++){
            
            //set values of "static" uniform buffer
            scaleViewValues.push({     
                scale: [Math.random()*1.3+0.1 ,Math.random()*1.3+0.1]
            })

            positionViewValues.push({
                offset: [Math.random()-0.5, Math.random()-0.5],
            });

                        //save data in js list
            objectInfos.push({
                color: [Math.random(), Math.random(), Math.random(), 1],
            })
        }
        

        //fill data of static buffers
        try{
            scaleView.set(scaleViewValues);
            positionView.set(positionViewValues);
        }catch(e : any){
            console.log("AAAAAAAAAAA: ", e);
        }

        device.queue.writeBuffer(positionStorageBuffer, 0, positionView.arrayBuffer);
        device.queue.writeBuffer(scaleStorageBuffer, 0, scaleView.arrayBuffer);
        
            
            //create bind groups
            const bindGroup = device.createBindGroup({
                label: `bind group for objects`,
                layout: pipeline.getBindGroupLayout(0),
                entries:[
                    {binding: 0, resource:{buffer:  scaleStorageBuffer}},
                    {binding: 1, resource: {buffer: visualsStorageBuffer}},
                    {binding: 2, resource: {buffer: positionStorageBuffer}},
                ],
            });

        function render(){
            resize(canvasRef.current!);

            //define render pass descriptor

            const canvasTextureView = context!.getCurrentTexture().createView();
            const renderPassDescriptor : GPURenderPassDescriptor = {
                label: `basic render pass descriptor`,
                colorAttachments:[
                    {
                        view: canvasTextureView,
                        clearValue: [0.3,0.3,0.3,1],
                        loadOp: `clear`,
                        storeOp: `store`,
                    },
                ],
            };

            //create command encoder and begin render pass
            const encoder = device!.createCommandEncoder();
            const pass = encoder!.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);

            //now we can set values of any buffers that need to be filled in render pass
            const visualsViewValues: { color: number[] }[] = [];
            for (let i = 0; i < objectsNumber; i++) {
                visualsViewValues.push({
                    color: objectInfos[i].color,
                });
            }

            visualsView.set(visualsViewValues);
            device!.queue.writeBuffer(visualsStorageBuffer, 0, visualsView.arrayBuffer);

            
            pass.setBindGroup(0, bindGroup);
            pass.draw(3, objectsNumber);

            
            
            //end pass and send commands to GPU
            pass.end();
            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }
        render();
    }

    const drawManyTriangles = async () =>{
        
        //get adapter and device
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter?.requestDevice();
        
        if(!adapter || !device || !canvasRef.current){
            console.log("something went wrong");
            return;
        }

        //initialize context
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        const context = canvasRef.current.getContext('webgpu');
        if(!context){
            console.log("something went wrong");
            return;
        }
        context.configure({
            device,
            format: presentationFormat
        })

        //load shaders
        const code = `
            struct TransformStruct{
                scale: vec2f,
                offset: vec2f,
            };

            struct VisualsStruct{
                color: vec4f,
            };

            @group(0) @binding(0) var<uniform> transform: TransformStruct;
            @group(0) @binding(1) var<uniform> visuals: VisualsStruct; 
        
            @vertex fn initVertices(@builtin(vertex_index) vertexIndex : u32) 
            -> @builtin(position) vec4f{
            
                let pos = array(
                    vec2f(0.0 , 0.5),
                    vec2f(-0.3,-0.5),
                    vec2f(0.3,-0.5),
                );

                return vec4f(
                    pos[vertexIndex] * transform.scale + transform.offset ,
                    0.0, 1.0
                );
            }
            
            @fragment fn fragmentShader() -> @location(0) vec4f{
                return visuals.color;
            }
            `
        
        const module = device.createShaderModule({
            code,
        });

        //define pipeline (which shader modules are responsible for vertices and coloring)
        const pipeline = device.createRenderPipeline({
            label: 'multiple triangles with uniform buffer',
            layout: 'auto',
            vertex: {
                module,
                entryPoint: `initVertices`,
            },
            fragment: {
                module,
                entryPoint: `fragmentShader`,
                targets: [{format: presentationFormat}],
            },
        });

        //init data for buffers creation
        const objectsNumber = 100;

        type ObjectInfo = {
            color: number[],
            uniformBuffer: GPUBuffer,
            bindGroup: GPUBindGroup,
        };
        const objectInfos : ObjectInfo[] = [];

        const defs = makeShaderDataDefinitions(code);
        const transformView = makeStructuredView(defs.uniforms.transform);
        const visualsView = makeStructuredView(defs.uniforms.visuals);

        //create buffer, let assume that transform buffer is only set once
        //there's no actual reason for colors to be set in render pass here, but it's an excercise
        for(let i = 0; i < objectsNumber; i++){
            
            //create uniform buffers
            const transformUniformBuffer = device.createBuffer({
                label: `transform buffer for obj ${i}`,
                size: transformView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const visualsUniformBuffer = device.createBuffer({
                label: `visual buffer for obj ${i}`,
                size: visualsView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            //set values of "static" uniform buffer
            transformView.set({
                    offset: [Math.random()-0.5, Math.random()-0.5],
                    scale: [Math.random()*1.3+0.1 , Math.random()*1.3+0.1],
            });
            device.queue.writeBuffer(transformUniformBuffer, 0, transformView.arrayBuffer);
            
            //create bind groups
            const bindGroup = device.createBindGroup({
                label: `bind group for obj: ${i}`,
                layout: pipeline.getBindGroupLayout(0),
                entries:[
                    {binding: 0, resource:{buffer:  transformUniformBuffer}},
                    {binding: 1, resource: {buffer: visualsUniformBuffer}},
                ],
            });


            //save data in js list
            objectInfos.push({
                color: [Math.random(), Math.random(), Math.random(), 1],
                uniformBuffer: visualsUniformBuffer, 
                bindGroup: bindGroup,
            })
        }


        function render(){
            resize(canvasRef.current!);

            //define render pass descriptor

            const canvasTextureView = context!.getCurrentTexture().createView();
            const renderPassDescriptor : GPURenderPassDescriptor = {
                label: `basic render pass descriptor`,
                colorAttachments:[
                    {
                        view: canvasTextureView,
                        clearValue: [0.3,0.3,0.3,1],
                        loadOp: `clear`,
                        storeOp: `store`,
                    },
                ],
            };

            //create command encoder and begin render pass
            const encoder = device!.createCommandEncoder();
            const pass = encoder!.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);

            //now we can set values of any buffers that need to be filled in render pass
            objectInfos.forEach(objInfo => {
                visualsView.set({color: objInfo.color});
                device!.queue.writeBuffer(objInfo.uniformBuffer, 0, visualsView.arrayBuffer);
                pass.setBindGroup(0, objInfo.bindGroup);
                pass.draw(3);
            });
            
            
            //end pass and send commands to GPU
            pass.end();
            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }
        render();
    }

    const drawManyCircles = async () => {
        //get adapter and device
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter?.requestDevice();
        
        if(!adapter || !device || !canvasRef.current){
            console.log("something went wrong");
            return;
        }

        //initialize context
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        const context = canvasRef.current.getContext('webgpu');
        if(!context){
            console.log("something went wrong");
            return;
        }
        context.configure({
            device,
            format: presentationFormat
        })

        //load shaders
        const code = `

            struct VertexShaderOutputStruct{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            };

            struct Vertex{
                @location(0) position: vec2f,
                @location(1) offset: vec2f,
                @location(2) color: vec4f,
                @location(3) scale: vec2f,
            };

            
            @vertex fn vertexShader(v: Vertex)                                   
            -> VertexShaderOutputStruct{
                var out: VertexShaderOutputStruct;
                out.position = vec4f(
                    v.position * v.scale + v.offset, 0.0, 1.0
                );
                out.color = v.color;
                return out;
            }
            
            @fragment fn fragmentShader(in: VertexShaderOutputStruct) -> @location(0) vec4f{
                return in.color;
            }
            `
        
        const module = device.createShaderModule({
            code,
        });



        //define pipeline (which shader modules are responsible for vertices and coloring)
        const pipeline = device.createRenderPipeline({
            label: 'storage buffer vertices',
            layout: 'auto',
            vertex: {
                module,
                entryPoint: `vertexShader`,
                buffers: [
                    {   //position
                        arrayStride: 2 * 4,
                        attributes:[
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2',
                            }
                        ]
                    },
                    {   //offset
                        arrayStride: 2 * 4,
                        stepMode: 'instance',
                        attributes:[
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x2',
                            }
                        ]
                    },
                    {   //color
                        arrayStride: 4 * 4,
                        stepMode: 'instance',
                        attributes:[
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: 'float32x4',
                            }
                        ]
                    },
                    {   //scale
                        arrayStride: 2 * 4,
                        stepMode: 'instance',
                        attributes:[
                            {
                                shaderLocation: 3,
                                offset: 0,
                                format: 'float32x2',
                            }
                        ]
                    },

                ]
            },
            fragment: {
                module,
                entryPoint: `fragmentShader`,
                targets: [{format: presentationFormat}],
            },
        });

        //init data for buffers creation
        const objectsNumber = 100;

        /*
        type ObjectInfo = {
            scale: number[],
        };
        const objectInfos : ObjectInfo[] = [];*/

        //const defs = makeShaderDataDefinitions(code);
        //const staticDataView = makeStructuredView(defs.storages.staticData);
        //const dynamicDataView = makeStructuredView(defs.storages.dynamicData);
        const positionBufferSize = 2 * 4;
        const offsetBufferSize = 2 * 4;
        const colorBufferSize = 4 * 4;
        const scaleBufferSize = 2 * 4;


        //create buffers
        const { vertexData, numVertices } = createCircleVertices({
            radius: 0.5,
            innerRadius: 0.25,
        });
        const positionVertexBuffer = device.createBuffer({
            label: `position data buffer for objects`,
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        const offsetVertexBuffer = device.createBuffer({
            label: `offset data buffer for objects`,
            size: offsetBufferSize * objectsNumber,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        const colorVertexBuffer = device.createBuffer({
            label: `color data buffer for objects`,
            size: colorBufferSize * objectsNumber,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        const scaleVertexBuffer = device.createBuffer({
            label: `scale data buffer for objects`,
            size: scaleBufferSize * objectsNumber,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        //const positionDataValues = new Float32Array(objectsNumber * positionBufferSize);
        const offsetDataValues = new Float32Array(objectsNumber * 2);
        const colorDataValues = new Float32Array(objectsNumber * 4);
        const scaleDataValues = new Float32Array(objectsNumber * 2);

        for(let i = 0; i < objectsNumber; i++){
            //set values of "static" uniform buffer
            colorDataValues.set([rand(0,1), rand(0,1), rand(0,1), 1], i*4);        
            offsetDataValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], i*2);   
            scaleDataValues.set([rand(0.1,0.75) , rand(0.1,0.75)], i*2);   
        }
        

        //fill data of static buffers
        device.queue.writeBuffer(offsetVertexBuffer, 0, offsetDataValues);
        device.queue.writeBuffer(colorVertexBuffer, 0, colorDataValues);
        device.queue.writeBuffer(scaleVertexBuffer, 0 ,scaleDataValues);
        device.queue.writeBuffer(positionVertexBuffer, 0 ,vertexData);

        function render(){
            resize(canvasRef.current!);

            //define render pass descriptor
            const canvasTextureView = context!.getCurrentTexture().createView();
            const renderPassDescriptor : GPURenderPassDescriptor = {
                label: `basic render pass descriptor`,
                colorAttachments:[
                    {
                        view: canvasTextureView,
                        clearValue: [0.3,0.3,0.3,1],
                        loadOp: `clear`,
                        storeOp: `store`,
                    },
                ],
            };

            //create command encoder and begin render pass
            const encoder = device!.createCommandEncoder();
            const pass = encoder!.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, positionVertexBuffer);
            pass.setVertexBuffer(1, offsetVertexBuffer);
            pass.setVertexBuffer(2, colorVertexBuffer);
            pass.setVertexBuffer(3, scaleVertexBuffer);
            pass.draw(numVertices, objectsNumber);

            
            
            //end pass and send commands to GPU
            pass.end();
            const commandBuffer = encoder.finish();
            device!.queue.submit([commandBuffer]);
        }
        render();
    }



  useEffect(() => {
    let requestedAnimationFrame = 0;
    drawManyCircles().catch((e) => console.error(e));
    return () => cancelAnimationFrame(requestedAnimationFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="EditorMainCanvas"
    />
  );
}
