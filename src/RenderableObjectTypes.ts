import type { Vector2 } from "./math/vector2.type";
import type { Vector3 } from "./math/vector3.type";

export type ObjectProperties = {
    translation: Vector3,
    scale: Vector3,
    rotation: Vector3,
}

export type RenderMode = "Raster" | "TriangleWireframe" | "QuadWireframe"