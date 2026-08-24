import { PerspectiveMatrices } from "../../../math/matrices";
import type { Matrix4 } from "../../../math/matrix4.type";
import { degreeToRadians } from "../../../math/utils";
import type { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import { SceneObject, type WorldObjectTransform } from "../sceneObject";


export type ProjectionType =
  | "orthographic"
  | "perspective";

export class Camera extends SceneObject {
    fovY: number = 0.0;
    near: number = 0.0;
    far: number = 1000.0;
    transform: WorldObjectTransform = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0),
    }
    projectionType: ProjectionType = "perspective";
    
    //by default target is (0,0,-500)
    distance: number;
    target: Vector3;

    //in degrees, should convert to radians in calculations
    pitch: number = 0.0;
    yaw: number = 0.0;

    constructor(id: string, target: Vector3, distance: number){
        super(id);
        this.distance = distance;
        this.target = target;
    }

    getProjectionMatrix(canvasSize: Vector2): Matrix4{
        return this.projectionType == "perspective"?
        PerspectiveMatrices.PerspectiveProjection(
            degreeToRadians(this.fovY), this.near, this.far, canvasSize.x/canvasSize.y) : 
        PerspectiveMatrices.orthogonalProjection(
            -canvasSize.x/2, canvasSize.x/2,-canvasSize.y/2, canvasSize.y/2, this.near, this.far)
    }


    getCameraView(): Matrix4 {
        const eye = new Vector3(
            this.target.x + this.distance * Math.cos(degreeToRadians(this.pitch)) * Math.sin(degreeToRadians(this.yaw)),
            this.target.y + this.distance * Math.sin(degreeToRadians(this.pitch)),
            this.target.z + this.distance * Math.cos(degreeToRadians(this.pitch)) * Math.cos(degreeToRadians(this.yaw)),
        );
        return PerspectiveMatrices.lightView(
            eye,
            this.target,
            new Vector3(0, 1, 0)
        );
    }

    load(c: Camera){
        this.fovY = c.fovY
        this.near = c.near;
        this.far = c.far;
        this.transform = {...c.transform};
        this.projectionType = c.projectionType        
        this.distance = c.distance;
        this.target = c.target;        
        this.pitch = c.pitch;
        this.yaw = c.yaw;
    }
}

