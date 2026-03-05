import { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes";

export class RenderableObject{
    transform: ObjectProperties = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    };

    indexes: number[] = [];
    vertices: Vector3[] = []
}