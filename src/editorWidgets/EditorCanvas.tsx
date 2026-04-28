import {  useContext, useEffect, useRef } from "react";
import { type StructuredView } from "webgpu-utils";
import type { ObjectProperties, RenderOptions } from "../RenderableObjectTypes";
import {  degreeToRadians } from "../math/utils";
import { Matrices4, PerspectiveMatrices } from "../math/matrices";
import type { Matrix4 } from "../math/matrix4.type";
import type { Camera } from "../classes/camera";
import { type VoxelObject } from "../classes/voxelObject";
import { Vector3 } from "../math/vector3.type";
import { getVoxelFromObject } from "../classes/rayCaster";
import { Vector2 } from "../math/vector2.type";
import type { EditMode, SelectMode } from "../EditorPage";
import type { Renderer } from "../classes/renderer";
import type { Scene } from "../classes/scene";
import { ControllerContext } from "../ControllerContext";

export type EditorCanvasProps = {
    renderer: Renderer,
    scene: Scene,
    onRenderAndSceneInit: ()=>void,
    renderScene: ()=>void,
    selectedObject: VoxelObject,
    objectProperties: ObjectProperties;
    camera: Camera;
    selectMode: SelectMode;
    editMode: EditMode;
}

type RenderData = {
    context : GPUCanvasContext | null,
    device : GPUDevice | null,

    pipeline : GPURenderPipeline | null,
    selectedAreaPipeline: GPURenderPipeline | null,
    objectBorderPipeline: GPURenderPipeline | null,
    borderGridPipeline: GPURenderPipeline | null,

    uniformDataBuffer : GPUBuffer[] | null,
    bindGroup : GPUBindGroup[] | null,
    uniformView: StructuredView[] | null,
    vertexBuffer: GPUBuffer | null,

    depthTexture: GPUTexture | null
};

type SelectSession = {
    startCoords: Vector3 | null,
    endCoords: Vector3 | null,
}

type CameraMoveSession = {
    lastX: number | null,
    lastY: number | null,
    deltaX: number,
    deltaY: number,
}

export default function EditorCanvas(props: EditorCanvasProps) {
    const controller = useContext(ControllerContext)!;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    //const initializedRef = useRef(false);
    const renderDataRef = useRef<RenderData>({
        context : null,
        device : null,
        pipeline : null,
        selectedAreaPipeline: null,
        objectBorderPipeline: null,
        borderGridPipeline: null,
        uniformDataBuffer : null,
        bindGroup : null,
        uniformView: null,
        vertexBuffer: null,
        depthTexture: null,
    });

    //stores starting and ending selected object voxel coords
    /*
    const selectSessionRef = useRef<SelectSession>({
        startCoords: null,
        endCoords: null,
    })
    
    const selectSessionStarted = ()=>{
        return selectSessionRef.current.startCoords != null;
    }
    const resetSelectSession = ()=>{
        selectSessionRef.current = {startCoords: null, endCoords: null}
    }*/

    //stores data for moving camera with mouse
    /*
    const cameraMoveSessionRef = useRef<CameraMoveSession>({
        lastX: null,
        lastY: null,
        deltaX: 0,
        deltaY: 0,
    });
    
    const cameraMoveSessionStarted = ()=>{
        return cameraMoveSessionRef.current.lastX != null && cameraMoveSessionRef.current.lastY != null;
    }
    const resetCameraMoveSession = ()=>{
        cameraMoveSessionRef.current = {
        lastX: null,
        lastY: null,
        deltaX: 0,
        deltaY: 0,
    }}*/

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

    function shootRay(clickPos: Vector2, lastEmpty: boolean = false, hitOnExit: boolean = true){    
        if(!canvasRef.current) return; 
        const canvas = canvasRef.current;
        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();
        const objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
        const ndcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height);
        
        
        const eye = new Vector3(
            props.camera.target.x + props.camera.distance * Math.cos(degreeToRadians(props.camera.pitch)) * Math.sin(degreeToRadians(props.camera.yaw)),
            props.camera.target.y + props.camera.distance * Math.sin(degreeToRadians(props.camera.pitch)),
            props.camera.target.z + props.camera.distance * Math.cos(degreeToRadians(props.camera.pitch)) * Math.cos(degreeToRadians(props.camera.yaw)),
        );
        const cameraViewMatrix = PerspectiveMatrices.lightView(
            eye,
            props.camera.target,
            new Vector3(0, 1, 0)
        );
       
        return getVoxelFromObject(props.camera, clickPos, props.selectedObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix, lastEmpty, hitOnExit);
    }

    
    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        //M1 - action
        //M2 - camera move
        if(e.button === 0){
            /*
            const lastEmpty = props.editMode === "Add";
            const hitOnExit = true;
            const rayResults = shootRay(clickPos, lastEmpty , hitOnExit);
            if(!rayResults) return;

            const hitVoxel : Vector3 = rayResults.voxelCoords;
            //const hitDirection: Vector3 = faceDirectionToVector(rayResults.hitDirection);

            if(props.selectMode=="Cube"){
                selectSessionRef.current = {startCoords: null, endCoords: null}
                selectSessionRef.current.startCoords = hitVoxel;  
            }else{

                let voxelObjectChanged = false;
                let selectedAreaChanged = false;
                if(props.editMode=="Add"){
                    voxelObjectChanged = props.selectedObject.addSelectedVoxels(defaultColor)!=0;
                    selectedAreaChanged = props.selectedObject.resetSelect()!=0;
                }else if(props.editMode=="Paint"){
                    voxelObjectChanged = props.selectedObject.paintSelectedVoxels(debugPaintColor)!=0;
                    selectedAreaChanged = props.selectedObject.resetSelect()!=0;
                }else if(props.editMode=="Remove"){
                    voxelObjectChanged = props.selectedObject.removeSelectedVoxels()!=0;
                    selectedAreaChanged = props.selectedObject.resetSelect()!=0;
                }

                if(voxelObjectChanged || selectedAreaChanged){
                    props.onSelectedObjectChanged(props.selectedObject.copy());
                }
            }*/
        }else if(e.button===2){ 
            controller.startCameraMoveSession(clickPos);
        }
      
    }

    
    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        controller.updateCameraMoveSession(clickPos);
        /*
        if(cameraMoveSessionStarted()){
            const dx = clickPos.x - cameraMoveSessionRef.current.lastX!;
            const dy = clickPos.y - cameraMoveSessionRef.current.lastY!;

            if(dx!==0 || dy!==0) {
                cameraMoveSessionRef.current.deltaX += dx;
                cameraMoveSessionRef.current.deltaY += dy;

                cameraMoveSessionRef.current.lastX = clickPos.x;
                cameraMoveSessionRef.current.lastY = clickPos.y;
            }
            
        }else{

        const lastEmpty = props.editMode === "Add";
        const hitOnExit = true;   
        const rayResults = shootRay(clickPos, lastEmpty, hitOnExit);
        if(!rayResults){
            if(props.selectedObject.resetSelect()!==0) props.onSelectedObjectChanged(props.selectedObject.copy());
            
            return;
        }
        const hitVoxel : Vector3 = rayResults.voxelCoords;
        const hitDirection: Vector3 = faceDirectionToVector(rayResults.hitDirection);

        //let higlightCausedChange = false;
        let selectedAreaChanged = false;
        let voxelObjectChanged = false;

        if(selectSessionStarted()){
            if(props.editMode == "Add"){
                if(props.selectMode=="Voxel"){
                    props.selectedObject.selectVoxel(hitVoxel);
                    voxelObjectChanged = props.selectedObject.addSelectedVoxels(defaultColor) != 0;
                }else if(props.selectMode=="Cube"){
                    selectedAreaChanged = props.selectedObject.selectCube(selectSessionRef.current.startCoords!, hitVoxel);
                }
            }else if(props.editMode=="Remove"){
                if(props.selectMode=="Voxel"){
                    props.selectedObject.selectVoxel(hitVoxel);
                    voxelObjectChanged = props.selectedObject.removeSelectedVoxels() != 0;
                }else if(props.selectMode=="Cube"){
                    selectedAreaChanged = props.selectedObject.selectCube(selectSessionRef.current.startCoords!, hitVoxel);
                }
            }else if(props.editMode=="Paint"){
                if(props.selectMode=="Voxel"){
                    props.selectedObject.selectVoxel(hitVoxel);
                    voxelObjectChanged = props.selectedObject.paintSelectedVoxels(debugPaintColor) != 0;
                }else if(props.selectMode=="Cube"){
                    selectedAreaChanged = props.selectedObject.selectCube(selectSessionRef.current.startCoords!, hitVoxel);
                }
            }
        }else{
            if(props.editMode == "Add"){
                if(props.selectMode=="Voxel" || props.selectMode=="Cube"){
                    selectedAreaChanged = props.selectedObject.selectVoxel(hitVoxel);
                }else if(props.selectMode=="Face"){
                    selectedAreaChanged = props.selectedObject.selectFace(hitVoxel , vectorToFaceDirection(hitDirection), true);
                }
            }else if(props.editMode=="Remove" || props.editMode=="Paint"){
                if(props.selectMode=="Voxel" || props.selectMode=="Cube"){
                    selectedAreaChanged = props.selectedObject.selectVoxel(hitVoxel);
                }else if(props.selectMode=="Face"){
                    selectedAreaChanged = props.selectedObject.selectFace(hitVoxel , vectorToFaceDirection(hitDirection));
                }
            }else{
                //higlightCausedChange = props.selectedObject.highlightVoxel(hitVoxel);
            }
        }

        if(selectedAreaChanged || voxelObjectChanged) {
            props.onSelectedObjectChanged(props.selectedObject.copy());
        }
    }*/
    }

    
    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);
        controller.endCameraMoveSession();
        /*
        if(cameraMoveSessionStarted()){
            resetCameraMoveSession();
        }

        const rayResults = shootRay(clickPos);
        if(!rayResults) return;

        const hitVoxel : Vector3 = rayResults.voxelCoords;
        //const hitDirection: Vector3 = faceDirectionToVector(rayResults.hitDirection);

        if(selectSessionStarted()){
            selectSessionRef.current.endCoords = hitVoxel;
            if(props.selectMode=="Cube"){
                if(props.editMode=="Add"){
                    props.selectedObject.addSelectedVoxels(defaultColor);
                }else if(props.editMode=="Paint"){
                    props.selectedObject.paintSelectedVoxels(debugPaintColor);
                }else if(props.editMode=="Remove"){
                    props.selectedObject.removeSelectedVoxels();
                }
            }
            selectSessionRef.current = {startCoords: null, endCoords: null}
        }

        props.selectedObject.resetSelect();
        props.onSelectedObjectChanged(props.selectedObject.copy());
        handlePointerMove(e);
        */
    }

    /*
    function handlePointerCancel(_: React.PointerEvent<HTMLCanvasElement>){
        console.log(`[handlePointerCancel]`);
        if(!canvasRef.current) return; 
        props.selectedObject.resetSelect();
        resetSelectSession();
        props.onSelectedObjectChanged(props.selectedObject.copy());
    }*/

/*
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

        const selectedAreaShaderCode = selectedAreaShader();
        const selectedAreaShaderModule = device.createShaderModule({
            label: 'selected object selected area shader module',
            code: selectedAreaShaderCode,
        });

        const objectBorderShaderCode = voxelObjectBorderShader();
        const objectBorderShaderModule = device.createShaderModule({
            label: `object border shader module`,
            code: objectBorderShaderCode,
        })

        const borderGridShaderCode = borderGridShader();
        const borderGridShaderModule = device.createShaderModule({
            label: `object border grid shader module`,
            code: borderGridShaderCode,
        })

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

        const selectedAreaPipeline = device.createRenderPipeline({
            label: 'Selected object selected area mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: selectedAreaShaderModule,
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
                module: selectedAreaShaderModule,
                targets: [{
                format: presentationFormat,
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
                cullMode: 'front',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less-equal',
                format: 'depth24plus',
            },
        })

        const borderGridPipeline = device.createRenderPipeline({
            label: 'Selected object selected area mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: borderGridShaderModule,
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
                module: borderGridShaderModule,
                targets: [{
                format: presentationFormat,
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
        })

        const objectborderPipeline = device.createRenderPipeline({
            label: 'Selected object selected area mesh pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: `vertexShader`,
                module: objectBorderShaderModule,
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
                module: objectBorderShaderModule,
                targets: [{
                format: presentationFormat,
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
                depthCompare: 'less-equal',
                depthWriteEnabled: true,
                format: 'depth24plus',
            },
        })

        const selectedObjectUniformDataView = makeStructuredView(makeShaderDataDefinitions(selectedObjectShaderCode).uniforms.uniformData);
        const selectedObjectUniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: selectedObjectUniformDataView.arrayBuffer.byteLength,
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

        renderDataRef.current.context = context;
        renderDataRef.current.device = device;
        renderDataRef.current.pipeline = pipeline;
        renderDataRef.current.selectedAreaPipeline = selectedAreaPipeline;
        renderDataRef.current.uniformDataBuffer = [selectedObjectUniformBuffer]
        renderDataRef.current.bindGroup = [bindGroupSelectedObject];
        renderDataRef.current.uniformView = [selectedObjectUniformDataView];
        renderDataRef.current.objectBorderPipeline = objectborderPipeline;
        renderDataRef.current.borderGridPipeline = borderGridPipeline;
        
        if(canRender()) renderVoxelObject();
    }*/

        /*

    function renderVoxelObject(){

        const r = renderDataRef.current;
        if (!canRender()) return;

        const canvas = canvasRef.current!;
        const context = r.context!;
        const device = r.device!;

        const pipeline = r.pipeline!;
        const selectedAreaPipeline = r.selectedAreaPipeline!;
        const objectBorderPipeline = r.objectBorderPipeline!;
        const uniformDataBuffer = r.uniformDataBuffer!;
        const bindGroup = r.bindGroup!;
        const uniformView = r.uniformView!;
        const borderGridPipeline = r.borderGridPipeline!;
        let depthTexture = r.depthTexture;

        resize(canvas!);
        if(props.selectedObject.shouldRebuildMesh()) {
            console.log(`[renderVoxelObject] calling rebuildMesh`);
            props.selectedObject.rebuildMesh();
        }

        //voxel object mesh
        const selectedAreaMesh = props.selectedObject.getSelectedAreaMesh();
        const {vertexData, linesIndices, trianglesIndices, quadsIndices} = props.selectedObject.mesh!.getVerticesData();
        const selectedAreaMeshData = selectedAreaMesh!.getVerticesData();
        const objectBorderMeshData = props.selectedObject.getBorderMesh().getVerticesData();
        const borderGridMeshData = props.selectedObject.getBorderGrid().getVerticesData();

        const vertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(vertexDataBuffer , 0 , vertexData);

        const selectedAreaVertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: selectedAreaMeshData.vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(selectedAreaVertexDataBuffer , 0 , selectedAreaMeshData.vertexData);

        const objectBorderVertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: objectBorderMeshData.vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(objectBorderVertexDataBuffer , 0 , objectBorderMeshData.vertexData);

        const borderGridVertexDataBuffer = device.createBuffer({
            label: 'vertex data buffer',
            size: borderGridMeshData.vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(borderGridVertexDataBuffer , 0 , borderGridMeshData.vertexData);

        const trianglesIndexBuffer = device.createBuffer({
            label: 'index data buffer',
            size: trianglesIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(trianglesIndexBuffer, 0 , trianglesIndices);

        const selectedAreaTrianglesIndexBuffer = device.createBuffer({
            label: 'index data buffer',
            size: selectedAreaMeshData.trianglesIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(selectedAreaTrianglesIndexBuffer, 0 , selectedAreaMeshData.trianglesIndices);

        const objectBorderTrianglesIndexBuffer = device.createBuffer({
            label: 'index data buffer',
            size: objectBorderMeshData.trianglesIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(objectBorderTrianglesIndexBuffer, 0, objectBorderMeshData.trianglesIndices);

        const borderGridTrianglesIndexBuffer = device.createBuffer({
            label: 'index data buffer',
            size: borderGridMeshData.trianglesIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(borderGridTrianglesIndexBuffer, 0, borderGridMeshData.trianglesIndices);

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

        //const cameraTranslation : Matrix4 = Matrices4.translation(props.camera.transform.translation);
        //const cameraScale : Matrix4 = Matrices4.scaling(props.camera.transform.scale);
        const eye = new Vector3(
            props.camera.target.x + props.camera.distance * Math.cos(degreeToRadians(props.camera.pitch)) * Math.sin(degreeToRadians(props.camera.yaw)),
            props.camera.target.y + props.camera.distance * Math.sin(degreeToRadians(props.camera.pitch)),
            props.camera.target.z + props.camera.distance * Math.cos(degreeToRadians(props.camera.pitch)) * Math.cos(degreeToRadians(props.camera.yaw)),
        );
        const cameraViewMatrix = PerspectiveMatrices.lightView(
            eye,
            props.camera.target,
            new Vector3(0, 1, 0)
        );
        //const cameraRotation : Matrix4 = Matrices4.rotation(degreeToRadians(props.camera.transform.rotation.x), degreeToRadians(props.camera.transform.rotation.y), degreeToRadians(props.camera.transform.rotation.z));



        const objectTranslation : Matrix4 = props.objectProperties? Matrices4.translation(props.objectProperties.translation) : Matrices4.identity();
        const objectScale : Matrix4 = props.objectProperties? Matrices4.scaling(props.objectProperties.scale) : Matrices4.identity();
        const objectRotation: Matrix4 = props.objectProperties? Matrices4.rotation(degreeToRadians(props.objectProperties.rotation.x), degreeToRadians(props.objectProperties.rotation.y), degreeToRadians(props.objectProperties.rotation.z)) : Matrices4.identity();

        const shadersUniformsObjectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale).toArrays();
        const shadersUniformsNdcProjectionMatrix = props.camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, props.camera.near, props.camera.far).toArrays() 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(props.camera.fovY), props.camera.near, props.camera.far, canvas.width/canvas.height).toArrays();
        const shadersUniformsCameraViewMatrix = cameraViewMatrix.toArrays();

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
        
        pass.setPipeline(selectedAreaPipeline);
        pass.setVertexBuffer(0, selectedAreaVertexDataBuffer);
        pass.setIndexBuffer(selectedAreaTrianglesIndexBuffer, "uint32");
        pass.setBindGroup(0, bindGroup[0]);
        pass.drawIndexed(selectedAreaMeshData.trianglesIndices.length);

        pass.setPipeline(borderGridPipeline);
        pass.setVertexBuffer(0, borderGridVertexDataBuffer);
        pass.setIndexBuffer(borderGridTrianglesIndexBuffer, "uint32");
        pass.setBindGroup(0, bindGroup[0]);
        pass.drawIndexed(borderGridMeshData.trianglesIndices.length);

        pass.setPipeline(objectBorderPipeline);
        pass.setVertexBuffer(0, objectBorderVertexDataBuffer);
        pass.setIndexBuffer(objectBorderTrianglesIndexBuffer, "uint32");
        pass.setBindGroup(0, bindGroup[0]);
        pass.drawIndexed(objectBorderMeshData.trianglesIndices.length);


        pass.end();

        const commandBuffer = encoder.finish();
        device!.queue.submit([commandBuffer]);
    }*/

    /*
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let requestedAnimationFrame = 0;
    
    
    //initRenderer().catch((e) => console.error(e));
    return () => cancelAnimationFrame(requestedAnimationFrame);
  }, []);

  useEffect(()=>{
    //renderVoxelObject();
  }, [props.objectProperties , props.camera, props.selectedObject])
    */

useEffect(()=>{
  const canvas = canvasRef.current;
  if (!canvas) return;

  const run = async () => {
    const rendererInitialized = await props.renderer.init(canvas);
    const sceneInitialized = props.scene.init(canvas);
    props.scene.setObjectTransformMatrix(props.objectProperties);
    props.onRenderAndSceneInit();
  };

  run();
}, []);

  const pressedKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    

    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key.toLowerCase());
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase());
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
/*
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const zoomSpeed = 0.25;

            props.onSelectedCameraChanged(prev => {
            const newDistance = Math.max(0.1, prev.distance + e.deltaY * zoomSpeed);
            return newDistance !== prev.distance
                ? { ...prev, distance: newDistance }
                : prev;});
        };

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener("wheel", handleWheel);
        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };

    }, []);*/
/*
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastTime: number | null = null;

    const animationTick = (time: number) => {
      const pitchChangeRate = 90;
      const yawChangeRate = 90;
      const last = lastTime ?? time;
      const deltaTime = (time - last) / 1000;
      lastTime = time;
      
      props.onSelectedCameraChanged((prev)=>{
        let updatedCamera = { ...prev };
        let cameraModified = false;

        if(pressedKeysRef.current.has("w")){
          updatedCamera.pitch = clamp({value: updatedCamera.pitch + pitchChangeRate*deltaTime, min: -89, max: 89});
          cameraModified = true;
        }
        if(pressedKeysRef.current.has("s")){
          updatedCamera.pitch = clamp({value: updatedCamera.pitch - pitchChangeRate*deltaTime, min: -89, max: 89});
          cameraModified = true;
        }
        if(pressedKeysRef.current.has("a")){
          updatedCamera.yaw = updatedCamera.yaw + yawChangeRate*deltaTime;
          cameraModified = true;
        }
        if(pressedKeysRef.current.has("d")){
          updatedCamera.yaw = updatedCamera.yaw - yawChangeRate*deltaTime;
          cameraModified = true;
        }   

        const mouseSensitivity = 0.5;
        const dx = cameraMoveSessionRef.current.deltaX;
        const dy = cameraMoveSessionRef.current.deltaY;

        if (dx !== 0 || dy !== 0) {
            updatedCamera.yaw -= dx * mouseSensitivity;
            updatedCamera.pitch -=dy * mouseSensitivity;
            updatedCamera.pitch = clamp( {value: updatedCamera.pitch , min: -89, max: 89});
            cameraMoveSessionRef.current.deltaX = 0;
            cameraMoveSessionRef.current.deltaY = 0;

            cameraModified = true;
        }

          return cameraModified? updatedCamera : prev;
      });
             
      animationFrameId = requestAnimationFrame(animationTick);
    };

    animationFrameId = requestAnimationFrame(animationTick);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);*/


  return (
    <div className="CanvasContainer">
        <canvas
        ref={canvasRef}
        onContextMenu={(e)=>e.preventDefault()}
        
        onPointerDown={(e) => handlePointerDown(e)}
        onPointerUp={(e)=>handlePointerUp(e)}
        //onPointerCancel={(e)=>handlePointerCancel(e)}
        onPointerMove={e=>handlePointerMove(e)}
        
        className="EditorMainCanvas"
        />
    </div>
  );
}
