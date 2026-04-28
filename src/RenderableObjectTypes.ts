
import type { Vector3 } from "./math/vector3.type";

export type ObjectProperties = {
    translation: Vector3,
    scale: Vector3,
    rotation: Vector3,
}

export type RenderOptions = {
    voxels: boolean;
    objectGrid: boolean;
    borderWire: boolean;
    borderGrid: boolean;
}