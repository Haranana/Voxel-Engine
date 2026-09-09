import type { Matrix4 } from "./matrix4.type";
import { Vector2 } from "./vector2.type";
import { Vector3 } from "./vector3.type";
import { Vector4 } from "./vector4.type";
import { Vectors } from "./vectors";

export const Spaces = {
    modelToWorld(v: Vector3, transform: Matrix4): Vector3{
        const v4 = Vectors.vector3To4(v);
        return Vectors.vector4To3(transform.multVector(v4));
    },
    worldToCamera(v: Vector3, view: Matrix4): Vector3{
        return Vectors.vector4To3(view.multVector(Vectors.vector3To4(v)));
    },
    cameraToClip(v: Vector3, projection: Matrix4): Vector4{
        return projection.multVector(Vectors.vector3To4(v));
    },
    clipToNdc(v: Vector4): Vector3{
        return v.homogeneousDivide();
    },
    ndcToScreen(v: Vector3, resolution: Vector2): Vector2 {
        return new Vector2(
            (v.x + 1) * resolution.x / 2,
            (1 - v.y) * resolution.y / 2
        );
    },
    modelToNdc(v: Vector3, transform: Matrix4, view: Matrix4, projection: Matrix4): Vector3{
        const vWorld: Vector3 = this.modelToWorld(v, transform);
        const vCamera: Vector3 = this.worldToCamera(vWorld, view); 
        const vClip: Vector4 = this.cameraToClip(vCamera, projection);
        const vNdc: Vector3 = this.clipToNdc(vClip);        
        return vNdc;
    },

    modelToScreen(v: Vector3, transform: Matrix4, view: Matrix4, projection: Matrix4, resolution: Vector2): Vector2{
        const vWorld: Vector3 = this.modelToWorld(v, transform);
        const vCamera: Vector3 = this.worldToCamera(vWorld, view); 
        const vClip: Vector4 = this.cameraToClip(vCamera, projection);
        const vNdc: Vector3 = this.clipToNdc(vClip);
        const vScreen: Vector2 = this.ndcToScreen(vNdc, resolution);
        return vScreen;
    },

    worldToModel(v: Vector3, transform: Matrix4): Vector3{
        return Vectors.vector4To3(transform.getInversion().multVector(Vectors.vector3To4(v)));
    },

    cameraToWorld(v: Vector3, view: Matrix4): Vector3{
        return Vectors.vector4To3(view.getInversion().multVector(Vectors.vector3To4(v)));
    },

    clipToCamera(v: Vector4, projection: Matrix4): Vector3{
        return projection.getInversion().multVector(v).homogeneousDivide();
    },

    ndcToClip(v: Vector3, w: number): Vector4{
        return new Vector4(v.x * w, v.y * w, v.z * w, w);
    },

    screenToNdc(v: Vector2, z: number, resolution: Vector2): Vector3{
        return new Vector3(
            v.x * 2 / resolution.x - 1,
            1 - v.y * 2 / resolution.y,
            z
        );
    },    

    screenToModel(v: Vector2, resolution: Vector2,z: number, w: number, projection: Matrix4, view: Matrix4, transform: Matrix4){
        const vNdc = this.screenToNdc(v,z, resolution);
        const vClip = this.ndcToClip(vNdc, w);
        const vCamera = this.clipToCamera(vClip, projection);
        const vWorld = this.cameraToWorld(vCamera, view);
        const vModel = this.worldToModel(vWorld, transform);
        return vModel;
    }
} as const;