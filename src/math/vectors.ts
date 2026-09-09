import { Vector2 } from "./vector2.type";
import { Vector3 } from "./vector3.type";
import { Vector4 } from "./vector4.type";

export const Vectors = {
    vector2To3(v: Vector2): Vector3{
        return new Vector3(v.x,v.y,0);
    },
    vector2To4(v: Vector2): Vector4{
        return new Vector4(v.x,v.y,0,1);
    },
    vector3To2(v: Vector3): Vector2{
        return new Vector2(v.x,v.y);
    },
    vector3To4(v: Vector3): Vector4{
        return new Vector4(v.x,v.y,v.z,1);
    },
    vector4To2(v: Vector4): Vector2{
        return new Vector2(v.x,v.y);
    },
    vector4To3(v: Vector4): Vector3{
        return new Vector3(v.x,v.y,v.z);
    },                   
}