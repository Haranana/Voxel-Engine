import { Vector2 } from "../../math/vector2.type";
import { Vector3 } from "../../math/vector3.type";
import type { Mesh } from "../meshes/Mesh";
import type { Shader } from "../shaders/shader";

export class RenderableObject {
    //refers to secondary depth texture that also uses idTexture
    //in this case used for gizmos, in future this should probably be remade somehow
    useSecondaryDepthTexture: boolean = false; 

    /*

    */
    mesh: Mesh | null = null;

    /*
        Shader and parameters relating to shading and lighting
    */
    material?: Material;

    /*
        Not implemented, should stay as null for now
    */
    collider: Collider | null = null; 

    /*
        Transforms differ with how they store object position
        ScreenTransform uses ndc 2d vector - anchor
        WorldTransform uses world space 3d vector - translation
        whether worldTransform or screenTransform is used depends on shaderResources declared in shader 
    */
    worldTransform: WorldTransform | null = null;
    screenTransform: ScreenTransform | null = null;

    /*
        Used only for debug, scene uses its own id system 
    */
    name: string | null = null

    //incorrect, to fix
    copy(){
        const out = new RenderableObject();
        out.mesh = this.mesh;
        if (this.material) {
            out.material = {
                ...this.material,
            };
        }

        out.useSecondaryDepthTexture = this.useSecondaryDepthTexture;
        out.collider = this.collider;
        out.worldTransform = this.worldTransform? {...this.worldTransform} : null;
        out.screenTransform = this.screenTransform? {...this.screenTransform} : null;
        
        return out;
    }    
}


export type Material = {
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

