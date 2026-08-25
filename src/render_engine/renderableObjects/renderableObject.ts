import { Vector2 } from "../../math/vector2.type";
import { Vector3 } from "../../math/vector3.type";
import type { Mesh } from "../meshes/Mesh";
import type { Shader } from "../shaders/shader";

export class RenderableObject {
    useSecondaryDepthTexture: boolean = false;
    mesh: Mesh | null = null;
    material?: Material;
    collider: Collider | null = null; 
    worldTransform: WorldTransform | null = null;
    screenTransform: ScreenTransform | null = null;
    name: string | null = null

    copy(){

        const out = new RenderableObject();
        out.mesh = this.mesh;
        if (this.material) {
            out.material = {
                ...this.material,
            };
        }

        out.collider = this.collider;
        out.worldTransform = this.worldTransform? {...this.worldTransform} : null;
        out.screenTransform = this.screenTransform? {...this.screenTransform} : null;
        
        return out;
    }    
}

/*
export type VertexAttributes = {
    location: number,
    offset: number,
    format: GPUVertexFormat,
}*/

//to be implemented when starting to work on shading
export type Material = {
    //renderTechnique: RenderTechniqueType,
    shader: Shader;
}

//to be implemented when starting to work on mesh hit detection
export type Collider = {

}

export type WorldTransform = {
    translation: Vector3,
    scale: Vector3,
    rotation: Vector3, //in degrees, in future it would probably be better to store radians
}

export type ScreenTransform = {
    anchor: Vector2,
    scale: Vector3,
    rotation: Vector3, //in degrees, in future it would probably be better to store radians
}

