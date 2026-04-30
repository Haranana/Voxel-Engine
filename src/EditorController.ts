import type { RefObject } from "react";
import type { Camera, ProjectionType } from "./classes/camera";
import type { Scene } from "./classes/scene";
import { faceDirectionToVector, vectorToFaceDirection } from "./classes/voxelObject";
import type { EditMode, SelectMode } from "./EditorPage";
import { clamp, mod } from "./math/utils";
import type { Vector2 } from "./math/vector2.type"
import { Vector3 } from "./math/vector3.type"
import { debugPaintColor, defaultColor } from "./sampleObjects";

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

export class EditorController{

    //base fields
    camera: Camera | null = null;

    selectModeRef: RefObject<SelectMode> | null = null;
    //selectMode: SelectMode | null = null;
    editModeRef: RefObject<EditMode> | null = null;
    scene: Scene | null = null;
    renderScene: (()=>void) | null = null;
    initialized: boolean = false;

    constructor(){}

    init(camera: Camera, selectMode: RefObject<SelectMode>, editMode: RefObject<EditMode>, scene: Scene, renderScene: ()=>void){
        this.camera = camera;
        this.renderScene = renderScene;
        this.startCameraMoveAnimationLoop();
        this.selectModeRef = selectMode;
        this.selectModeRef = selectMode
        this.editModeRef = editMode;
        this.scene = scene;

        this.initialized = true;
    }

    setCamera(camera: Camera){
        this.camera = camera;
    }

    setRenderScene(renderScene: ()=>void){
        this.renderScene = renderScene;
    }

    //Pressed keys handling
    pressedKeys : Set<string> = new Set();

    registerKeyDown(e: KeyboardEvent){
        this.pressedKeys.add(e.key.toLowerCase());
    }

    registerKeyUp(e: KeyboardEvent){
        this.pressedKeys.delete(e.key.toLowerCase());
    }

    //Camera properties handling
    cameraMoveSession: CameraMoveSession = {
        lastX : null,
        lastY : null,
        deltaX: 0,
        deltaY: 0,
    };
    animationFrameId: number | null = null;
    lastTime: number | null = null;
    cameraFovYMinValue = 1;
    cameraFovYMaxValue = 179;

    cameraNearMinValue = 0.001;
    cameraNearMaxValue = 1000;

    cameraFarMinValue = 0.001;
    cameraFarMaxValue = 5000;

    cameraDistanceMinValue = 0;
    cameraDistanceMaxValue = 10000;

    cameraPitchMinValue = -89;
    cameraPitchMaxValue = 89;
    cameraYawMinValue = 0;
    cameraYawMaxValue = 360;

    mouseWheelSensitivity = 0.25;

    onCameraModified : (()=>void) | null = null;

    startCameraMoveAnimationLoop(){
        const cameraMoveAnimationLoop = (time: number) => {
            if(!this.initialized) return;
            const camera = this.camera!;

            const pitchChangeRate = 90;
            const yawChangeRate = 90;
            const last = this.lastTime ?? time;
            const deltaTime = (time - last) / 1000;
            this.lastTime = time;
            
            //let updatedCamera = { ...this.camera!};
            let cameraModified = false;

            if(this.pressedKeys.has("w")){
                camera.pitch = clamp({value: camera.pitch + pitchChangeRate*deltaTime, min: -89, max: 89});
                cameraModified = true;
            }
            if(this.pressedKeys.has("s")){
                camera.pitch = clamp({value: camera.pitch - pitchChangeRate*deltaTime, min: -89, max: 89});
                cameraModified = true;
            }
            if(this.pressedKeys.has("a")){
                camera.yaw = camera.yaw + yawChangeRate*deltaTime;
                cameraModified = true;
            }
            if(this.pressedKeys.has("d")){
                camera.yaw = camera.yaw - yawChangeRate*deltaTime;
                cameraModified = true;
            }   

            const mouseSensitivity = 0.5;
            const dx = this.cameraMoveSession.deltaX;
            const dy = this.cameraMoveSession.deltaY;

            if (dx !== 0 || dy !== 0) {
                camera.yaw -= dx * mouseSensitivity;
                camera.pitch -=dy * mouseSensitivity;
                camera.pitch = clamp( {value: camera.pitch , min: -89, max: 89});
                this.cameraMoveSession.deltaX = 0;
                this.cameraMoveSession.deltaY = 0;

                cameraModified = true;
            }

            if(cameraModified){
                //console.log("[EditorController] camera modified: " + this.camera!.pitch + " : " + this.camera!.yaw);
                if(this.onCameraModified!=null) this.onCameraModified();
                this.renderScene!();   
            }
                    
            this.animationFrameId = requestAnimationFrame(cameraMoveAnimationLoop);
        };
        this.animationFrameId = requestAnimationFrame(cameraMoveAnimationLoop);
    }

    hasCameraMoveSessionStarted(){
        return this.cameraMoveSession.lastX != null && this.cameraMoveSession.lastY != null;
    }

    startCameraMoveSession(clickPos: Vector2){
        this.cameraMoveSession.lastX = clickPos.x;
        this.cameraMoveSession.lastY = clickPos.y;
    }

    updateCameraMoveSession(clickPos: Vector2){
        if(!this.hasCameraMoveSessionStarted()) return;

        const dx = clickPos.x - this.cameraMoveSession.lastX!;
        const dy = clickPos.y - this.cameraMoveSession.lastY!;

        if(dx!==0 || dy!==0) {
            this.cameraMoveSession.deltaX += dx;
            this.cameraMoveSession.deltaY += dy;

            this.cameraMoveSession.lastX = clickPos.x;
            this.cameraMoveSession.lastY = clickPos.y;
        }
    }

    endCameraMoveSession(){
        this.cameraMoveSession = {lastX: null,
            lastY: null,
            deltaX: 0,
            deltaY: 0,
        };
    }

        stopCameraMoveAnimationLoop(){
        if(this.animationFrameId!=null){
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    setCameraFovY(newVal: number) {
    if (!this.initialized) return;
    const camera = this.camera!;
    const v = clamp({ value: newVal, min: this.cameraFovYMinValue, max: this.cameraFovYMaxValue });

    if (v !== camera.fovY) {
        camera.fovY = v;
        if(this.onCameraModified!=null) this.onCameraModified();
        this.renderScene!();
    }
}

    addCameraFovY(delta: number) {
        this.setCameraFovY(this.camera!.fovY + delta);
    }


    setCameraNear(newVal: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        const near = clamp({ value: newVal, min: this.cameraNearMinValue, max: this.cameraNearMaxValue });
        const far = clamp({
            value: near >= camera.far ? near + 0.001 : camera.far,
            min: this.cameraFarMinValue,
            max: this.cameraFarMaxValue,
        });

        const changed = near !== camera.near || far !== camera.far;

        camera.near = near;
        camera.far = far;

        if (changed) {
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    addCameraNear(delta: number) {
        this.setCameraNear(this.camera!.near + delta);
    }

    setCameraFar(newVal: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        const far = clamp({ value: newVal, min: this.cameraFarMinValue, max: this.cameraFarMaxValue });
        const near = clamp({
            value: far <= camera.near ? Math.max(this.cameraNearMinValue, far - 0.001) : camera.near,
            min: this.cameraNearMinValue,
            max: this.cameraNearMaxValue,
        });

        const changed = near !== camera.near || far !== camera.far;

        camera.near = near;
        camera.far = far;

        if (changed){
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    addCameraFar(delta: number) {
        this.setCameraFar(this.camera!.far + delta);
    }

    setCameraDistance(value: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        const v = clamp({ value, min: this.cameraDistanceMinValue, max: this.cameraDistanceMaxValue });

        if (v !== camera.distance) {
            camera.distance = v;
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    addCameraDistance(delta: number) {
        this.setCameraDistance(this.camera!.distance + delta);
    }

    setCameraDistanceByWheel(mouseDeltaY: number){
        if (!this.initialized) return;
        const camera = this.camera!;

        const value =  Math.max(0.1, camera.distance + mouseDeltaY * this.mouseWheelSensitivity);
        const v = clamp({ value, min: this.cameraDistanceMinValue, max: this.cameraDistanceMaxValue });

        if (v !== camera.distance) {
            camera.distance = v;
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    setCameraProjectionType(value: ProjectionType){
        if (!this.initialized) return;
        const camera = this.camera!;
        if(value!==camera.projectionType){
            camera.projectionType = value;
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    setCameraPitch(value: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        const v = clamp({ value, min: this.cameraPitchMinValue, max: this.cameraPitchMaxValue });

        if (v !== camera.pitch) {
            camera.pitch = v;
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    addCameraPitch(delta: number) {
        this.setCameraPitch(this.camera!.pitch + delta);
    }

    setCameraYaw(value: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        const v = mod(value, 360);

        if (v !== camera.yaw) {
            camera.yaw = v;
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    addCameraYaw(delta: number) {
        this.setCameraYaw(this.camera!.yaw + delta);
    }

    setCameraTarget(x: number, y: number, z: number) {
        if (!this.initialized) return;
        const camera = this.camera!;

        if (camera.target.x !== x || camera.target.y !== y || camera.target.z !== z) {
            camera.target = new Vector3(x, y, z);
            if(this.onCameraModified!=null) this.onCameraModified();
            this.renderScene!();
        }
    }

    setCameraTargetX(x: number) {
        const t = this.camera!.target;
        this.setCameraTarget(x, t.y, t.z);
    }

    setCameraTargetY(y: number) {
        const t = this.camera!.target;
        this.setCameraTarget(t.x, y, t.z);
    }

    setCameraTargetZ(z: number) {
        const t = this.camera!.target;
        this.setCameraTarget(t.x, t.y, z);
    }

    addCameraTargetX(delta: number) {
        this.setCameraTargetX(this.camera!.target.x + delta);
    }

    addCameraTargetY(delta: number) {
        this.setCameraTargetY(this.camera!.target.y + delta);
    }

    addCameraTargetZ(delta: number) {
        this.setCameraTargetZ(this.camera!.target.z + delta);
    }

    //Select and Edit component

    selectSession: SelectSession = {
        startCoords: null,
        endCoords: null,
    }

    hasSelectSessionStarted(){
        return this.selectSession.startCoords!=null;
    }

    resetSelectSession(){
        if(!this.initialized) return;
        const selectAreaModified = this.scene!.getObjectRef().resetSelect();
        this.selectSession = {
            startCoords: null,
            endCoords: null,
        }
        if(selectAreaModified){
            this.renderScene!();
        }
    }

    handleCanvasPointerDown(pointerPos: Vector2){
        if(!this.initialized) return;

        const editMode = this.editModeRef!.current;
        const selectMode = this.selectModeRef!.current;

        const lastEmpty = editMode === "Add";
        const hitOnExit = true;
        const rayResults = this.scene!.shootRay(pointerPos, lastEmpty , hitOnExit);
        if(!rayResults) return;
        const hitVoxel : Vector3 = rayResults.voxelCoords;

        let voxelObjectChanged = false;
        let selectedAreaChanged = false;
        if(selectMode=="Voxel" || selectMode=="Face"){
                if(editMode=="Add"){
                    voxelObjectChanged = this.scene!.getObjectRef().addSelectedVoxels(defaultColor)!=0;
                    selectedAreaChanged = this.scene!.getObjectRef().resetSelect()!=0;
                }else if(editMode=="Paint"){
                    voxelObjectChanged = this.scene!.getObjectRef().paintSelectedVoxels(debugPaintColor)!=0;
                    selectedAreaChanged = this.scene!.getObjectRef().resetSelect()!=0;
                }else if(editMode=="Remove"){
                    voxelObjectChanged = this.scene!.getObjectRef().removeSelectedVoxels()!=0;
                    selectedAreaChanged = this.scene!.getObjectRef().resetSelect()!=0;
                }
        }else if(selectMode=="Cube"){
            this.selectSession.startCoords = hitVoxel;  
                selectedAreaChanged = this.scene!.getObjectRef().selectVoxel(hitVoxel);
            //console.log(`[controller] session started ad: ${hitVoxel.toString()}`)
        }

        if(voxelObjectChanged || selectedAreaChanged){
            this.renderScene!();
        }
    }

    handleCanvasPointerMove(pointerPos: Vector2){
        if(!this.initialized) return;

        const editMode = this.editModeRef!.current;
        const selectMode = this.selectModeRef!.current;

        const lastEmpty = editMode === "Add";
        const hitOnExit = true;   
        const rayResults = this.scene!.shootRay(pointerPos, lastEmpty, hitOnExit);
        if(!rayResults){
            this.resetSelectSession();
            return;
        }

        const hitVoxel : Vector3 = rayResults.voxelCoords;
        const hitDirection: Vector3 = faceDirectionToVector(rayResults.hitDirection);

        let selectedAreaChanged = false;
        let voxelObjectChanged = false;

        if(this.hasSelectSessionStarted()){
            //console.log("[controller] session in move")
            if(editMode == "Add"){
                if(selectMode=="Voxel"){
                    this.scene!.getObjectRef().selectVoxel(hitVoxel);
                    voxelObjectChanged = this.scene!.getObjectRef().addSelectedVoxels(defaultColor) != 0;
                }else if(selectMode=="Cube"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectCube(this.selectSession.startCoords!, hitVoxel);
                }
            }else if(editMode=="Remove"){
                if(selectMode=="Voxel"){
                    this.scene!.getObjectRef().selectVoxel(hitVoxel);
                    voxelObjectChanged = this.scene!.getObjectRef().removeSelectedVoxels() != 0;
                }else if(selectMode=="Cube"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectCube(this.selectSession.startCoords!, hitVoxel);
                }
            }else if(editMode=="Paint"){
                if(selectMode=="Voxel"){
                    this.scene!.getObjectRef().selectVoxel(hitVoxel);
                    voxelObjectChanged = this.scene!.getObjectRef().paintSelectedVoxels(debugPaintColor) != 0;
                }else if(selectMode=="Cube"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectCube(this.selectSession.startCoords!, hitVoxel);
                }
            }
        }else{
            if(editMode == "Add"){
                if(selectMode=="Voxel" || selectMode=="Cube"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectVoxel(hitVoxel);
                }else if(selectMode=="Face"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectFace(hitVoxel , vectorToFaceDirection(hitDirection), true);
                }
            }else if(editMode=="Remove" || editMode=="Paint"){
                if(selectMode=="Voxel" || selectMode=="Cube"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectVoxel(hitVoxel);
                }else if(selectMode=="Face"){
                    selectedAreaChanged = this.scene!.getObjectRef().selectFace(hitVoxel , vectorToFaceDirection(hitDirection));
                }
            }else{
                //higlightCausedChange = props.selectedObject.highlightVoxel(hitVoxel);
            }
        }

        if(selectedAreaChanged || voxelObjectChanged) {
            this.renderScene!();
        }
    }

    handleCanvasPointerUp(pointerPos: Vector2){
        if(!this.initialized) return; 
        //console.log(this.editMode + " : " + this.selectMode);
        if(this.hasCameraMoveSessionStarted()){
            this.resetSelectSession();
        }

        const editMode = this.editModeRef!.current;
        const selectMode = this.selectModeRef!.current;

        const lastEmpty = this.editModeRef!.current === "Add";
        const hitOnExit = true;   
        const rayResults = this.scene!.shootRay(pointerPos, lastEmpty, hitOnExit);
        if(!rayResults) return;

        const hitVoxel : Vector3 = rayResults.voxelCoords;

        if(this.hasSelectSessionStarted()){
            this.selectSession.endCoords = hitVoxel;
            if(selectMode=="Cube"){
                if(editMode=="Add"){
                    this.scene!.getObjectRef().addSelectedVoxels(defaultColor);
                }else if(editMode=="Paint"){
                    this.scene!.getObjectRef().paintSelectedVoxels(debugPaintColor);
                }else if(editMode=="Remove"){
                    this.scene!.getObjectRef().removeSelectedVoxels();
                }
            }
            this.resetSelectSession();
        }

        this.scene!.getObjectRef().resetSelect();
        this.renderScene!();        
    }

}