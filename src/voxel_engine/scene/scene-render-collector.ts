import type { RenderableObject } from "../../render_engine/renderableObjects/renderableObject";
import type { Camera } from "../scene-objects/camera/camera";
import type { SceneObject } from "../scene-objects/sceneObject";
import { VoxelObject } from "../scene-objects/voxel/voxel-object";
import type { Scene } from "./scene";
import { SceneGizmos } from "./scene-gizmos";


//returns array of RenderableObjects to render in each frame based on scene and render options
export class SceneRenderCollector{
    public static collect(scene: Scene, camera: Camera): RenderableObject[]{
        const out: RenderableObject[] = [];
        
        const isSelectedVoxelObject = (obj: SceneObject) =>{
            if(!(obj instanceof VoxelObject)) return false;
            if(!scene.getActiveVoxelObject()) return false;
            if(scene.getActiveVoxelObject()!.sceneId!=obj.sceneId) return false;
            return true;
        }

        scene.getObjectsOfType(VoxelObject).forEach((obj)=>{              
            if( !isSelectedVoxelObject(obj) || !scene.seletedVoxelObjectRenderOptions.voxelObject || !obj.enabled){              
                    return;
            }      
            const objToAdd = obj.getObjectRo();
                   
            out.push(objToAdd);
        });
        
        const selectedVo: VoxelObject | null = scene.getActiveVoxelObject(); ;
        const selectedRo: RenderableObject | null = selectedVo? selectedVo.getObjectRo() : null;

        let loadedObjs = ""

        if(selectedVo && selectedRo){

            if(selectedVo.enabled){
                if(scene.seletedVoxelObjectRenderOptions.voxelObjectGrid){
                    const newRenderableObject = selectedVo.getObjectGridRo();
                    
                    out.push(newRenderableObject);
                }

                if(selectedVo.staticSelectedArea.voxels.size>0){
                    
                    const selectedObjectSelectedArea = selectedVo.getStaticSelectedAreaRo();
                    out.push(selectedObjectSelectedArea);
                }
                if(selectedVo.dynamicSelectedArea.voxels.size>0){
                    const selectedObjectSelectedArea = selectedVo.getDynamicSelectedAreaRo();
                    
                    out.push(selectedObjectSelectedArea);
                }                
            }     
                   
            if(scene.seletedVoxelObjectRenderOptions.borderGrid){
                const newRenderableObject = selectedVo.getBorderGridRo();
                
                out.push(newRenderableObject);
            }

            if(scene.seletedVoxelObjectRenderOptions.borderOutline){
                const newRenderableObject = selectedVo.getBorderOutlineRo();
                
                out.push(newRenderableObject);
            }



            if(scene.sceneGizmosRenderOptions.cameraControllGizmo){
                const newRenderableObject = SceneGizmos.getCameraControllGizmoRo(camera);
                out.push(newRenderableObject);
            }else{
            }
            if(scene.sceneGizmosRenderOptions.objectMoveGizmo){
                const newRenderableObject = SceneGizmos.getMoveRoGizmoRo(selectedRo);
                out.push(newRenderableObject);
            }
            if(scene.sceneGizmosRenderOptions.objectResizeGizmo){
                const newRenderableObject = SceneGizmos.getResizeRoGizmoRo(selectedRo);
                out.push(newRenderableObject);
            }
            if(scene.sceneGizmosRenderOptions.objectRotateGizmo){
                const newRenderableObject = SceneGizmos.getRotateRoGizmoRo(selectedRo);
                out.push(newRenderableObject);
            }

            loadedObjs = ""; out.forEach(obj => {
                loadedObjs+=obj.name+" ,";
            }); 
            

        }             

        return out;
    }
}