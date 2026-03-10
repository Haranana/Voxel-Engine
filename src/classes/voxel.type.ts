import { Vector4 } from "../math/vector4.type"

export type Voxel = {
    color: Vector4;
}

export function copyVoxel(v: Voxel): Voxel{
    return {
        color: v.color.copy(),
    };
}