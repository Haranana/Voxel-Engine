import { Matrices4, PerspectiveMatrices } from "../math/matrices";
import { Matrix4 } from "../math/matrix4.type";
import { degreeToRadians } from "../math/utils";
import { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes";
import type { Camera } from "./camera";
import { VoxelObject } from "./voxelObject";
export type RenderSceneOptions = {
    borderWire: boolean,
    borderGrid: boolean,
    voxelObjectsGrid: boolean,
}
export class Scene{

    #voxelObject: VoxelObject = new VoxelObject(new Vector3(0,0,0));
    #camera: Camera
    #cameraViewMatrix: Matrix4 = Matrices4.identity()
    #objectTransformMatrix: Matrix4 = Matrices4.identity();
    #perspectiveNdcProjectionMatrix: Matrix4 =Matrices4.identity();
    #orthoNdcProjectionMatrix: Matrix4 = Matrices4.identity();
    #canvas: HTMLCanvasElement | null = null;
    initialized: boolean = false
    
    options: RenderSceneOptions = {
        borderWire: false,
        borderGrid: false,
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

        const eye = new Vector3(
            this.#camera.target.x + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.sin(degreeToRadians(this.#camera.yaw)),
            this.#camera.target.y + this.#camera.distance * Math.sin(degreeToRadians(this.#camera.pitch)),
            this.#camera.target.z + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.cos(degreeToRadians(this.#camera.yaw)),
        );
        this.#cameraViewMatrix = PerspectiveMatrices.lightView(
            eye,
            this.#camera.target,
            new Vector3(0, 1, 0)
        );
        this.#perspectiveNdcProjectionMatrix = PerspectiveMatrices.PerspectiveProjection(
            degreeToRadians(this.#camera.fovY), this.#camera.near, this.#camera.far, this.#canvas.width/this.#canvas.height);
        this.#orthoNdcProjectionMatrix = PerspectiveMatrices.orthogonalProjection(
            -this.#canvas.width/2, this.#canvas.width/2,-this.#canvas.height/2, this.#canvas.height/2, this.#camera.near, this.#camera.far) 
    
        this.initialized = true;
        return true;
    }
    
    #setCameraView(){
        const eye = new Vector3(
            this.#camera.target.x + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.sin(degreeToRadians(this.#camera.yaw)),
            this.#camera.target.y + this.#camera.distance * Math.sin(degreeToRadians(this.#camera.pitch)),
            this.#camera.target.z + this.#camera.distance * Math.cos(degreeToRadians(this.#camera.pitch)) * Math.cos(degreeToRadians(this.#camera.yaw)),
        );
        this.#cameraViewMatrix = PerspectiveMatrices.lightView(
            eye,
            this.#camera.target,
            new Vector3(0, 1, 0)
        );
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
        this.#setCameraView();
        return true;
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

}