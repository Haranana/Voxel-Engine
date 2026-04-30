import { Matrices4, PerspectiveMatrices } from "../math/matrices";
import { Matrix4 } from "../math/matrix4.type";
import { degreeToRadians } from "../math/utils";
import { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes";
import type { Camera } from "./camera";
import { getVoxelFromObject } from "./rayCaster";
import { VoxelObject } from "./voxelObject";
export type RenderSceneOptions = {
    borderWire: boolean,
    borderGrid: boolean,
    voxelObjectsGrid: boolean,
}
export class Scene{

    #voxelObject: VoxelObject = new VoxelObject(new Vector3(0,0,0));
    #camera: Camera
    #objectTransformMatrix: Matrix4 = Matrices4.identity();
    #perspectiveNdcProjectionMatrix: Matrix4 =Matrices4.identity();
    #orthoNdcProjectionMatrix: Matrix4 = Matrices4.identity();
    #canvas: HTMLCanvasElement | null = null;
    initialized: boolean = false
    
    options: RenderSceneOptions = {
        borderWire: true,
        borderGrid: true,
        voxelObjectsGrid: false,
    };

    constructor(voxelObject: VoxelObject, camera: Camera){
        this.#voxelObject = voxelObject;
        this.#camera = camera;
       
    }

    init(canvas: HTMLCanvasElement){
        if(this.initialized) return false;
        this.#canvas = canvas;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);

        this.#perspectiveNdcProjectionMatrix = PerspectiveMatrices.PerspectiveProjection(
            degreeToRadians(this.#camera.fovY), this.#camera.near, this.#camera.far, this.#canvas.width/this.#canvas.height);
        this.#orthoNdcProjectionMatrix = PerspectiveMatrices.orthogonalProjection(
            -this.#canvas.width/2, this.#canvas.width/2,-this.#canvas.height/2, this.#canvas.height/2, this.#camera.near, this.#camera.far) 
    
        this.initialized = true;
        return true;
    }
    


    setNdcProjectionMatrices() : boolean{
        if(!this.initialized) return false
        this.#perspectiveNdcProjectionMatrix = PerspectiveMatrices.PerspectiveProjection(
            degreeToRadians(this.#camera.fovY), this.#camera.near, this.#camera.far, this.#canvas!.width/this.#canvas!.height);
        this.#orthoNdcProjectionMatrix = PerspectiveMatrices.orthogonalProjection(
            -this.#canvas!.width/2, this.#canvas!.width/2,-this.#canvas!.height/2, this.#canvas!.height/2, this.#camera.near, this.#camera.far) 
        return true;
    }

    getPerspectiveProjectionMatrix(){
        return this.#perspectiveNdcProjectionMatrix;
    }

    getOrthoProjectionMatrix(){
        return this.#orthoNdcProjectionMatrix;
    }

    setObject(v: VoxelObject) : boolean{
        if(!this.initialized) return false;
        this.#voxelObject = v;
        this.setNdcProjectionMatrices();
        return true;
    }

    getObjectRef(){
        return this.#voxelObject;
    }

    getObjectCopy(){
        return this.#voxelObject.copy();
    }

    getCameraCopy(){
        return {...this.#camera}
    }

    setCamera(c: Camera){
        if(!this.initialized) return false;
        this.#camera = c;
        return true;
    }

    getCanvasRef(){
        return this.#canvas;
    }

    getCameraView(): Matrix4{
         const eye = new Vector3(
            this.#camera.target.x + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.sin(degreeToRadians(this.#camera.yaw)),
            this.#camera.target.y + this.#camera.distance * Math.sin(degreeToRadians(this.#camera.pitch)),
            this.#camera.target.z + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.cos(degreeToRadians(this.#camera.yaw)),
        );
        return PerspectiveMatrices.lightView(
            eye,
            this.#camera.target,
            new Vector3(0, 1, 0)
        );
    }

    setObjectTransformMatrix(o: ObjectProperties){
        const objectTranslation : Matrix4 = Matrices4.translation(o.translation)
        const objectScale : Matrix4 = Matrices4.scaling(o.scale)
        const objectRotation: Matrix4 = Matrices4.rotation(degreeToRadians(o.rotation.x), degreeToRadians(o.rotation.y), degreeToRadians(o.rotation.z))
        this.#objectTransformMatrix = objectTranslation.multMatrix(objectRotation).multMatrix(objectScale);
    }

    getObjectTransformMatrix(): Matrix4{
        return this.#objectTransformMatrix;
    }

    shootRay(clickPos: Vector2, lastEmpty: boolean = false, hitOnExit: boolean = true){    
        if(!this.initialized) return; 
        const canvas = this.#canvas!;
        const objectTransformMatrix = this.#objectTransformMatrix;
        const ndcProjectionMatrix = this.#camera.projectionType==="orthographic"?
            PerspectiveMatrices.orthogonalProjection(-canvas.width/2, canvas.width/2,-canvas.height/2, canvas.height/2, this.#camera.near, this.#camera.far) 
            : PerspectiveMatrices.PerspectiveProjection(degreeToRadians(this.#camera.fovY), this.#camera.near, this.#camera.far, canvas.width/canvas.height);
        
        
         const eye = new Vector3(
            this.#camera.target.x + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.sin(degreeToRadians(this.#camera.yaw)),
            this.#camera.target.y + this.#camera.distance * Math.sin(degreeToRadians(this.#camera.pitch)),
            this.#camera.target.z + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.cos(degreeToRadians(this.#camera.yaw)),
        );

        const cameraViewMatrix = PerspectiveMatrices.lightView(
            eye,
            this.#camera.target,
            new Vector3(0, 1, 0)
        );
        
        return getVoxelFromObject(this.#camera, clickPos, this.#voxelObject, new Vector2(canvas.width, canvas.height) , objectTransformMatrix, ndcProjectionMatrix, cameraViewMatrix, lastEmpty, hitOnExit);
    }

}