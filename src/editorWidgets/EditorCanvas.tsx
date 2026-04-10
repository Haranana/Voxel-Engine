import { useEffect, useRef } from "react";
import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils";
import type { ObjectProperties, RenderMode } from "../RenderableObjectTypes";
import { degreeToRadians } from "../math/utils";
import { Matrices4, PerspectiveMatrices } from "../math/matrices";
import type { Matrix4 } from "../math/matrix4.type";
import type { Camera } from "../classes/camera";
import type { FaceDirection, VoxelObject } from "../classes/voxelObject";
import { additionalZShader, baseShaderWithWireframe } from "../shaders/baseRenderableObjectShaders";
import { Vector3 } from "../math/vector3.type";
import { getVoxelFromObject } from "../classes/rayCaster";
import { Vector2 } from "../math/vector2.type";
import { Vector4 } from "../math/vector4.type";
import type { EditMode, SelectMode } from "../EditorPage";

export type EditorCanvasProps = {
    selectedObject: VoxelObject,
    objectProperties: ObjectProperties;
    camera: Camera;
    onSelectedObjectChanged: (v: VoxelObject) => void;
    renderMode: RenderMode;
    selectMode: SelectMode;
    editMode: EditMode;
}

/*
type MatricesCache = {
        
        cameraTranslation : Matrix4 | null;
        cameraScale : Matrix4 | null;
        cameraRotation : Matrix4 | null;
        
        objectTranslation : Matrix4 | null;
        objectScale : Matrix4 | null;
        objectRotation: Matrix4 | null;
        objectTransformMatrix : Matrix4 | null;

        ndcPerspectiveProjectionMatrix : Matrix4 | null; 
        ndcOrthographicProjectionMatrix: Matrix4 | null;
        
        cameraViewMatrix : Matrix4 | null;
}
const matricesCache : MatricesCache = {};
function getCameraTranslation(){

}*/

type RenderData = {
    context : GPUCanvasContext | null,
    device : GPUDevice | null,
    pipeline : GPURenderPipeline | null,
    uniformDataBuffer : GPUBuffer[] | null,
    bindGroup : GPUBindGroup[] | null,
    uniformView: StructuredView[] | null,
    vertexBuffer: GPUBuffer | null,
    verticesAmount: number | null,
    trianglesIndexBuffer: GPUBuffer | null,
    linesIndexBuffer: GPUBuffer | null,
    quadsIndexBuffer: GPUBuffer | null,
    triangleIndicesAmount: number | null,
    lineIndicesAmount: number | null,
    quadIndicesAmount: number | null,
    depthTexture: GPUTexture | null,
};

type SelectSession = {
    startCoords: Vector3 | null,
    endCoords: Vector3 | null,
}

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
        trianglesIndexBuffer:  null,
        linesIndexBuffer:  null,
        quadsIndexBuffer: null,
        triangleIndicesAmount:  null,
        lineIndicesAmount: null,
        quadIndicesAmount:  null,
        depthTexture: null,
    });

    //stores starting and ending selected object voxel coords
    const selectSessionRef = useRef<SelectSession>({
        startCoords: null,
        endCoords: null,
    })

    const canRender = () => {
        const r = renderDataRef.current;
        return r.context && r.device && r.pipeline; 
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

    function getMousePos(canvas: HTMLCanvasElement, evt: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    var rect = canvas.getBoundingClientRect();
        return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }

    function debugColorVoxel(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>){
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;

        //console.log(getMousePos(canvasRef.current, e));
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
        const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
        const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));

        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();

        const objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
        const ndcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height);
        const cameraViewMatrix = cameraTranslation.multMatrix(cameraRotation).multMatrix(cameraScale).getInversion();

        const rayResults = getVoxelFromObject(props.camera, clickPos, props.selectedObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix);
        const rayCastingResult : Vector3 | null = rayResults? rayResults.voxelCoords : null;
        if(rayCastingResult){
            props.selectedObject.setVoxel(rayCastingResult, {color: new Vector4(160, 130, 210, 255),});
            props.onSelectedObjectChanged(props.selectedObject.copy());
        }
    }

    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);
    
        const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
        const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
        const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));
        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();
        const objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
        const ndcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height);
        const cameraViewMatrix = cameraTranslation.multMatrix(cameraRotation).multMatrix(cameraScale).getInversion();

        const rayResults = getVoxelFromObject(props.camera, clickPos, props.selectedObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix);
        const rayCastingResult : Vector3 | null = rayResults? rayResults.voxelCoords : null;
        
        if(rayCastingResult){
            props.selectedObject.highlightVoxel(rayCastingResult);
            if(selectSessionRef.current.startCoords!=null){
                selectSessionRef.current.endCoords = rayCastingResult;
                if(props.selectMode == "Voxel"){
                    props.selectedObject.selectVoxel(selectSessionRef.current.startCoords);
                }else if(props.selectMode=="Face"){
                    const rayCastingDir: FaceDirection = rayResults!.hitDirection;
                    console.log(`[handlePointerUp] rayCastingDir: ${rayCastingDir}`)
                    props.selectedObject.selectFace(selectSessionRef.current.startCoords, rayCastingDir); 
                    //props.selectedObject.selectCube(selectSessionRef.current.startCoords, selectSessionRef.current.endCoords);
                }
            }
            props.onSelectedObjectChanged(props.selectedObject.copy());
        }
        
        selectSessionRef.current = {startCoords: null, endCoords: null}
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);
    
        const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
        const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
        const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));
        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();
        const objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
        const ndcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height);
        const cameraViewMatrix = cameraTranslation.multMatrix(cameraRotation).multMatrix(cameraScale).getInversion();

        const rayResults = getVoxelFromObject(props.camera, clickPos, props.selectedObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix);
        const rayCastingResult : Vector3 | null = rayResults? rayResults.voxelCoords : null;
        selectSessionRef.current = {startCoords: null, endCoords: null}
        if(rayCastingResult){
           selectSessionRef.current.startCoords = rayCastingResult;
        }
    }

    function handlePointerCancel(e: React.PointerEvent<HTMLCanvasElement>){
        console.log(`[handlePointerCancel]`);
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        props.selectedObject.clearHighlight();
        selectSessionRef.current = {startCoords: null, endCoords: null}
        props.onSelectedObjectChanged(props.selectedObject.copy());
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
        const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
        const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));

        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();

        const objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
        const ndcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height);
        const cameraViewMatrix = cameraTranslation.multMatrix(cameraRotation).multMatrix(cameraScale).getInversion();

        const rayResults = getVoxelFromObject(props.camera, clickPos, props.selectedObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix);
        const rayCastingResult : Vector3 | null = rayResults? rayResults.voxelCoords : null;

        if(rayCastingResult){
            const highlightCausedChange = props.selectedObject.highlightVoxel(rayCastingResult);
            let selectionCausedChange = false;
            if(selectSessionRef.current.startCoords!=null){                
                if(props.selectMode=="Cube"){
                    selectSessionRef.current.endCoords = rayCastingResult;
                    selectionCausedChange = props.selectedObject.selectCube(selectSessionRef.current.startCoords, selectSessionRef.current.endCoords);
                }
            }
            if(highlightCausedChange || selectionCausedChange) props.onSelectedObjectChanged(props.selectedObject.copy());
        }
    }

    const initRenderer = async () => {
        console.log('[initRenderer] Starting initialization');
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        if (!device) {
            console.log('[initRenderer] device is null (does the browser support WebGPU?)');
            return;
        }

        const canvas = canvasRef.current;
        if(!canvas) return;

        const context = canvas.getContext('webgpu');
        if(!context){
            console.log('[initRenderer] canvas context is null');
            return;
        }
        console.log('[initRenderer] initialization not interrupted');

        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied'
        });
        resize(canvasRef.current!);
        
        const selectedObjectShaderCode = baseShaderWithWireframe();
        const selectedObjectShaderModule = device.createShaderModule({
            label: 'selected object shader module',
            code: selectedObjectShaderCode,
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
        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        const pipeline = device.createRenderPipeline({
            label: 'Selected object mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: selectedObjectShaderModule,
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
                module: selectedObjectShaderModule,
                targets: [{format: presentationFormat}],
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

        const selectedObjectUniformDataView = makeStructuredView(makeShaderDataDefinitions(selectedObjectShaderCode).uniforms.uniformData);
        const selectedObjectUniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: selectedObjectUniformDataView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const overlayUniformDataView = makeStructuredView(makeShaderDataDefinitions(additionalZShader()).uniforms.uniformData);
        const overlayUniformViewBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: overlayUniformDataView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroupSelectedObject = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: selectedObjectUniformBuffer},
            }]
        })

        const bindGroupOverlay = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: overlayUniformViewBuffer},
            }]
        })

        renderDataRef.current.context = context;
        renderDataRef.current.device = device;
        renderDataRef.current.pipeline = pipeline;
        renderDataRef.current.uniformDataBuffer = [selectedObjectUniformBuffer]
        renderDataRef.current.bindGroup = [bindGroupSelectedObject];
        renderDataRef.current.uniformView = [selectedObjectUniformDataView];
        //renderDataRef.current.vertexBuffer = vertexDataBuffer;
        //renderDataRef.current.verticesAmount = numVertices;

        //renderDataRef.current.triangleIndicesAmount = trianglesIndices.length;
        //renderDataRef.current.lineIndicesAmount = linesIndices.length;
        //renderDataRef.current.quadIndicesAmount = quadsIndices.length;
        //renderDataRef.current.trianglesIndexBuffer = trianglesIndexBuffer;
        //renderDataRef.current.linesIndexBuffer = linesIndexBuffer;
        //renderDataRef.current.quadsIndexBuffer = quadsIndexBuffer;

        
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
        //const vertexBuffer = r.vertexBuffer!;
        //const verticesAmount = r.verticesAmount!;
        
        //const trianglesIndicesAmount = renderDataRef.current.triangleIndicesAmount! ;
        //const linesIndicesAmount = renderDataRef.current.lineIndicesAmount!;
        //const quadsIndicesAmount = renderDataRef.current.quadIndicesAmount!;
        //const trianglesIndexBuffer = renderDataRef.current.trianglesIndexBuffer!;
        //const linesIndexBuffer = renderDataRef.current.linesIndexBuffer!;
        //const quadsIndexBuffer = renderDataRef.current.quadsIndexBuffer!;

        let depthTexture = r.depthTexture;

        resize(canvas!);
        if(props.selectedObject.shouldRebuildMesh()) {
            console.log(`[renderVoxelObject] calling rebuildMesh`);
            props.selectedObject.rebuildMesh();
        }
        const {vertexData, linesIndices, trianglesIndices, quadsIndices, numVertices} = props.selectedObject.mesh!.getVerticesData();

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
            uniformView[0].set({
                resolution: shadersUniformsValuesResolution,
                objectTransform: shadersUniformsObjectTransformMatrix,
                ndcProjection: shadersUniformsNdcProjectionMatrix,
                viewMatrix: shadersUniformsCameraViewMatrix,
            });
            device!.queue.writeBuffer(uniformDataBuffer[0], 0, uniformView[0].arrayBuffer);

            const pass : GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor);

            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0 , vertexDataBuffer);
            pass.setIndexBuffer(trianglesIndexBuffer, "uint32");
            pass.setBindGroup(0, bindGroup[0]);
            pass.drawIndexed(trianglesIndices.length);
           
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
  }, [props.objectProperties , props.camera, props.selectedObject])

  return (
    <div className="CanvasContainer">
        <canvas
        ref={canvasRef}
        onPointerDown={(e) => handlePointerDown(e)}
        onPointerUp={(e)=>handlePointerUp(e)}
        onPointerCancel={(e)=>handlePointerCancel(e)}
        onPointerMove={e=>handlePointerMove(e)}
        className="EditorMainCanvas"
        />
    </div>
  );
}
