import type { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes"

export type ProjectionType =
  | "orthographic"
  | "perspective";

export type Camera = {
    fovY: number,
    near: number,
    far: number,
    transform: ObjectProperties
    projectionType: ProjectionType
    
    //by default target is (0,0,-500)
    distance: number,
    target: Vector3,

    //in degrees, should convert to radians in calculations
    pitch: number,
    yaw: number,
}