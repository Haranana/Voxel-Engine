import { RenderableObject } from "../../render_engine/renderableObjects/renderableObject";
import { screenObjectShader, worldObjectGridShader, worldObjectShader } from "../../render_engine/shaders/base-shaders";
import { Shader } from "../../render_engine/shaders/shader";
import { CameraShaderResources, GizmoCameraShaderResources, ScreenObjectShaderResources, ViewportShaderResources, WorldObjectShaderResources } from "../../render_engine/shaders/shader-resource";
import type { Gizmo } from "./gizmo/gizmo-object";
import { generateVoBorderGridMesh, generateVoBorderOutlineMesh, generateVoGridMesh, generateVoMesh, generateVoSelectedAreaMesh} from "./voxel/voxel-mesh-generator";
import type { SelectedAreaType, VoxelObject } from "./voxel/voxel-object";

// class with various static methods for creating and rebuilding RenderableObject of given SceneObject,
//  such as VoxelObject or Gizmo
export class RenderableObjectManager{
    static createVoRo(vo: VoxelObject): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
        [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
        out.mesh = generateVoMesh(vo);
        out.material = {
            shader
        };
        out.collider = null; 
        out.worldTransform = vo.transform;
        out.screenTransform = null;
        out.name = vo.name ;
        return out;
    }

    //fills any null field of renderableObject and synchronises transform beetwen vObj and rObj
    static rebuildVoRo(vo: VoxelObject, ro: RenderableObject): void{
        ro.worldTransform = {...vo.transform};
        
        if(!ro.material || !ro.material.shader){            
            const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
            ro.material = {shader};
        }

        if(!ro.mesh){
            ro.mesh = generateVoMesh(vo);
        }
        ro.name = vo.name;
        ro.collider = null; 
        ro.screenTransform = null;
    }

    static createVoGridRo(vo: VoxelObject): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
        [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
        out.mesh = generateVoGridMesh(vo);
        out.material = {
            shader
        };
        out.collider = null; 
        out.worldTransform = vo.transform;
        out.screenTransform = null;
        out.name = "grid" + "(" + vo.name + ")" ;
        return out;
    }

    static rebuildVoGridRo(vo: VoxelObject, ro: RenderableObject): void{
        ro.worldTransform = {...vo.transform};
        
        if(!ro.material || !ro.material.shader){            
            const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
            ro.material = {shader};
        }

        if(!ro.mesh){
            ro.mesh = generateVoGridMesh(vo);
        }
        ro.name = "grid" + "(" + vo.name + ")" ;
        ro.collider = null; 
        ro.screenTransform = null;
    }

    static createVoBorderGridRo(vo: VoxelObject): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
        [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
        out.mesh = generateVoBorderGridMesh(vo);
        out.material = {
            shader
        };
        out.collider = null; 
        out.worldTransform = vo.transform;
        out.screenTransform = null;
        out.name = "borderGrid" + "(" + vo.name + ")" ;
        return out;
    }

    static rebuildVoBorderGridRo(vo: VoxelObject, ro: RenderableObject): void{
        ro.worldTransform = {...vo.transform};
        
        if(!ro.material || !ro.material.shader){            
            const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
            ro.material = {shader};
        }

        if(!ro.mesh){
            ro.mesh = generateVoBorderGridMesh(vo);
        }
        ro.name = "borderGrid" + "(" + vo.name + ")" ;
        ro.collider = null; 
        ro.screenTransform = null;
    }

    static createVoBorderOutlineRo(vo: VoxelObject): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
        [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
        out.mesh = generateVoBorderOutlineMesh(vo);
        out.material = {
            shader
        };
        out.collider = null; 
        out.worldTransform = vo.transform;
        out.screenTransform = null;
        out.name = "borderOutline" + "(" + vo.name + ")" ;
        return out;
    }

    static rebuildVoBorderOutlineRo(vo: VoxelObject, ro: RenderableObject): void{
        ro.worldTransform = {...vo.transform};
        
        if(!ro.material || !ro.material.shader){            
            const shader = new Shader(worldObjectGridShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
            ro.material = {shader};
        }

        if(!ro.mesh){
            ro.mesh = generateVoBorderOutlineMesh(vo);
        }
        ro.name = "borderOutline" + "(" + vo.name + ")" ;
        ro.collider = null; 
        ro.screenTransform = null;
    }

    static createVoSelectedAreaRo(vo: VoxelObject, areaType: SelectedAreaType): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
        [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
        const selectedArea = vo.getSelectedArea(areaType);
        out.mesh = generateVoSelectedAreaMesh(vo, selectedArea);
        out.material = {
            shader
        };
        out.collider = null; 
        out.worldTransform = vo.transform;
        out.screenTransform = null;
        out.name = "selectedArea" + "(" + vo.name + ")" ;

        return out;
    }

    static rebuildVoSelectedAreaRo(vo: VoxelObject, areaType: SelectedAreaType, ro: RenderableObject): void{
        ro.worldTransform = {...vo.transform};
        
        if(!ro.material || !ro.material.shader){            
            const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
            ro.material = {shader};
        }

        const selectedArea = vo.getSelectedArea(areaType);
        if(!ro.mesh){
            ro.mesh = generateVoSelectedAreaMesh(vo, selectedArea);
        }
        ro.name = "selectedArea" + "(" + vo.name + ")" ;
        ro.collider = null; 
        ro.screenTransform = null;
    }

    //assumes that gizmo mesh never has to modified
    static createGizmoRo(gizmo: Gizmo): RenderableObject{
        const out: RenderableObject = new RenderableObject();
        if(gizmo.gizmoType === "world"){ 
            const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2), new GizmoCameraShaderResources(3)]);
            out.material = {shader};
        }else if(gizmo.gizmoType === "screen"){
            const shader = new Shader(screenObjectShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new ScreenObjectShaderResources(2), new GizmoCameraShaderResources(3)]);
            out.material = {shader};
        }
        out.mesh = gizmo.mesh;
        out.collider = null; 
        out.screenTransform = gizmo.screenTransform;
        out.worldTransform = gizmo.worldTransform;
        out.name = gizmo.name;

        return out;
    }

    static rebuildGizmoRo(gizmo: Gizmo, ro: RenderableObject): void{
        ro.mesh = gizmo.mesh;                
        if(gizmo.gizmoType === "world"){         
            if(!ro.material || !ro.material.shader){
                const shader = new Shader(worldObjectShader(), "vertexShader", "fragmentShader", 
                [new ViewportShaderResources(0) ,new CameraShaderResources(1),new WorldObjectShaderResources(2)]);
                ro.material = {shader};
            }
            ro.worldTransform = gizmo.worldTransform? {...gizmo.worldTransform} : null;
            
        }else if(gizmo.gizmoType === "screen"){
            if(!ro.material || !ro.material.shader){
            const shader = new Shader(screenObjectShader(), "vertexShader", "fragmentShader", 
            [new ViewportShaderResources(0) ,new CameraShaderResources(1),new ScreenObjectShaderResources(2)]);
            ro.material = {shader};
            }
            ro.screenTransform = gizmo.screenTransform? {...gizmo.screenTransform} : null;                
        }            
        ro.name = gizmo.name;
        ro.collider = null; 
        ro.useSecondaryDepthTexture = true;
    }
}