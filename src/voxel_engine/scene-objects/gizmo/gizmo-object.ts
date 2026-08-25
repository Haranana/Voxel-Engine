import { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import type { Mesh } from "../../../render_engine/meshes/Mesh";
import type { RenderableObject } from "../../../render_engine/renderableObjects/renderableObject";
import { SceneObject, type ScreenOverlayTransform, type WorldObjectTransform } from "../sceneObject";

export type GizmoType = "world" | "screen";

export class Gizmo extends SceneObject{
    screenTransform: ScreenOverlayTransform | null = {
        anchor: new Vector2(0,0), //refers to position in NDC
        scale: new Vector3(1,1,1),
        rotation: new Vector3(1,1,1),
    }
    worldTransform: WorldObjectTransform | null = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(1,1,1),
    }
    
    
    gizmoType: GizmoType = "world";
    mesh: Mesh | null = null;
    gizmoRo: RenderableObject | null = null;

    constructor(name: string = "gizmo"){
        super(name);
    }
}    