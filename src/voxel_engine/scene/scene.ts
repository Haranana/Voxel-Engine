import { Camera } from "../scene-objects/camera/camera";
import { SceneObject } from "../scene-objects/sceneObject";
import { VoxelObject } from "../scene-objects/voxel/voxel-object";
import { VoxelEngineEvent } from "../events/event"
import { Gizmo } from "../scene-objects/gizmo/gizmo-object";

export type SelectedVoxelObjectRenderOptions = {
    borderGrid: boolean,
    borderOutline: boolean,    
    voxelObject: boolean,
    voxelObjectGrid: boolean,
}

export type SceneGizmosRenderOptions = {
    cameraControllGizmo: boolean,
    objectMoveGizmo: boolean,
    objectResizeGizmo: boolean,
    objectRotateGizmo: boolean,
};

export class Scene{

    readonly objects: Map<number, SceneObject> = new Map<number, SceneObject>();      
    seletedVoxelObjectRenderOptions: SelectedVoxelObjectRenderOptions = {
        borderGrid: true,
        borderOutline: true,    
        voxelObject: true,
        voxelObjectGrid: true,
    }

    sceneGizmosRenderOptions: SceneGizmosRenderOptions = {
        cameraControllGizmo: true,
        objectMoveGizmo: false,
        objectResizeGizmo: false,
        objectRotateGizmo: false,
    }
    
    //#selectedSceneObjectId: number | null = null;
    #activeVoxelObjectId: number | null = null;
    #activeCameraId: number | null = null; 
    #nextSceneObjectId: number = 0;

    #notifyOfObjectEnabledChange(){
        this.objectEnabledChangeEvent.emit()
    }
    objectEnabledChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfObjectListChanged(){
        this.objectListChangedEvent.emit();
    }
    objectListChangedEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfObjectAdded(){
        this.objectAddedEvent.emit();
    }
    objectAddedEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfObjectRemoved(){
        this.objectRemovedEvent.emit();
    }
    objectRemovedEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfChangedActiveVo(){
        //unsubscribe from last active object events
        if(this.#unsubscribeActiveVoSelectedAreaChangeEvent){
            this.#unsubscribeActiveVoSelectedAreaChangeEvent();
            this.#unsubscribeActiveVoSelectedAreaChangeEvent = null;
        }
        if(this.#unsubscribeActiveVoVoxelsChanged){
            this.#unsubscribeActiveVoVoxelsChanged();
            this.#unsubscribeActiveVoVoxelsChanged = null;
        }
        if(this.#unsubscribeActiveVoTransformChangeEvent){
            this.#unsubscribeActiveVoTransformChangeEvent();
            this.#unsubscribeActiveVoTransformChangeEvent = null;
        }
        if(this.#unsubscribeActiveVoSizeChangeEvent){
            this.#unsubscribeActiveVoSizeChangeEvent();
            this.#unsubscribeActiveVoSizeChangeEvent = null;
        }                        

        //if there's new active object subscribe to its events
        const activeVo = this.getActiveVoxelObject();
        if(activeVo){
            this.#unsubscribeActiveVoSelectedAreaChangeEvent = 
            activeVo.selectedAreaChangeEvent.subscribe(this.#notifyOfActiveVoSelectedAreaChanged);

            this.#unsubscribeActiveVoVoxelsChanged = 
            activeVo.voxelsChangeEvent.subscribe(this.#notifyOfActiveVoVoxelsChanged);
            
            this.#unsubscribeActiveVoTransformChangeEvent = 
            activeVo.transformChangeEvent.subscribe(this.#notifyOfActiveVoTransformChanged);
            
            this.#unsubscribeActiveVoSizeChangeEvent = 
            activeVo.sizeChangeEvent.subscribe(this.#notifyOfActiveVoSizeChanged);            
        }

        this.activeVoChanged.emit();
    }
    activeVoChanged: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfChangedActiveCamera(){
        this.activeCameraChanged.emit();
    }
    activeCameraChanged: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfActiveVoSelectedAreaChanged = () => {
        this.activeVoSelectedAreaChangeEvent.emit();
    }
    activeVoSelectedAreaChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();
    #unsubscribeActiveVoSelectedAreaChangeEvent: (()=>void) | null = null;

    #notifyOfActiveVoVoxelsChanged = () => {
        this.activeVoVoxelsChangeEvent.emit();
    }
    activeVoVoxelsChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();
    #unsubscribeActiveVoVoxelsChanged: (()=>void) | null = null;

    #notifyOfActiveVoTransformChanged = () => {
        this.activeVoTransformChangeEvent.emit();
    }
    activeVoTransformChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();
    #unsubscribeActiveVoTransformChangeEvent: (()=>void) | null = null;

    #notifyOfActiveVoSizeChanged = () => {
        this.activeVoSizeChangeEvent.emit();
    }
    activeVoSizeChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();
    #unsubscribeActiveVoSizeChangeEvent: (()=>void) | null = null;


    toggleSelectedObjectBorderGrid(){
        this.seletedVoxelObjectRenderOptions.borderGrid = !this.seletedVoxelObjectRenderOptions.borderGrid;
    }

    toggleSelectedObjectBorderOutline(){
        this.seletedVoxelObjectRenderOptions.borderOutline = !this.seletedVoxelObjectRenderOptions.borderOutline;
    }

    toggleSelectedObjectEnabled(){
        this.seletedVoxelObjectRenderOptions.voxelObject = !this.seletedVoxelObjectRenderOptions.voxelObject;
    }

    toggleSelectedObjectWireframe(){
        this.seletedVoxelObjectRenderOptions.voxelObjectGrid = !this.seletedVoxelObjectRenderOptions.voxelObjectGrid;
    }

    toggleCameraControllGizmo(){
        this.sceneGizmosRenderOptions.cameraControllGizmo = !this.sceneGizmosRenderOptions.cameraControllGizmo;
    }

    toggleObjectMoveGizmo(){
        this.sceneGizmosRenderOptions.objectMoveGizmo = !this.sceneGizmosRenderOptions.objectMoveGizmo;
    }

    toggleObjectResizeGizmo(){
        this.sceneGizmosRenderOptions.objectResizeGizmo = !this.sceneGizmosRenderOptions.objectResizeGizmo;
    }

    toggleObjectRotateGizmo(){
        this.sceneGizmosRenderOptions.objectRotateGizmo = !this.sceneGizmosRenderOptions.objectRotateGizmo;
    }

    getActiveCamera(): Camera | null{
        if(this.#activeCameraId != null){
            const objectWithActiveCameraId : SceneObject | undefined = this.objects.get(this.#activeCameraId);
            if(objectWithActiveCameraId instanceof Camera){
                return objectWithActiveCameraId;
            }            
        }
        return null;
    }

    getActiveVoxelObject(): VoxelObject | null {
        if(this.#activeVoxelObjectId != null){
            const objectWithSelectedObjectId : SceneObject | undefined = this.objects.get(this.#activeVoxelObjectId);
            if(objectWithSelectedObjectId instanceof VoxelObject){
                return objectWithSelectedObjectId;
            }            
        }
        return null;
    }

    //returns copy
    getSeletedVoxelObjectRenderOptions(): SelectedVoxelObjectRenderOptions{
        return {...this.seletedVoxelObjectRenderOptions}
    }

    /*
    getSelectedSceneObject(): SceneObject | null{
        if(this.#selectedSceneObjectId != null){
            const objectWithSelectedObjectId : SceneObject | undefined = this.objects.get(this.#selectedSceneObjectId);
            if(objectWithSelectedObjectId instanceof SceneObject){
                return objectWithSelectedObjectId;
            }            
        }
        return null;
    }
    */

    setActiveCameraId(newId: number) : boolean{
        if(this.objects.get(newId) instanceof Camera){
            const oldId = this.#activeCameraId;
            this.#activeCameraId = newId;
            if(oldId!==newId) this.#notifyOfChangedActiveCamera();            
            return true;
        }
        return false;
    }

    setActiveVoxelObjectId(newId: number) : boolean{
        if(this.objects.get(newId) instanceof VoxelObject){
            const oldId = this.#activeVoxelObjectId;
            this.#activeVoxelObjectId = newId;
            if(oldId!==newId) this.#notifyOfChangedActiveVo();
            return true;
        }
        return false;
    }

    /*
    setSelectedSceneObjectId(newId: number) : boolean{
        if(this.objects.has(newId)){
            const oldId = this.#selectedVoxelObjectId;
            this.#selectedSceneObjectId = newId;
            if(oldId!==newId) this.#notifyOfChangedSelectedSo();
            return true;
        }
        return false;
    }
    */

    getObjectsOfType<T extends SceneObject>(objType: abstract new (...args: any[]) => T): T[]{
        const out: T[] = [];
        this.objects.forEach((obj)=>{
            if(obj instanceof objType) out.push(obj);
        });
        return out;
    }

    getObjectById(sceneId: number) : SceneObject | undefined{
        return this.objects.get(sceneId);
    }

    //adds object to the scene and appoints scene id to it
    //object cannot be added if it already has scene id
    addObject(newObject: SceneObject): boolean{
        if(newObject.sceneId != null) return false;
        this.objects.set(this.#nextSceneObjectId , newObject);
        newObject.sceneId = this.#nextSceneObjectId;
        this.#nextSceneObjectId++;

        this.#notifyOfObjectAdded();
        this.#notifyOfObjectListChanged();

        if(newObject instanceof VoxelObject && this.#activeVoxelObjectId == null ){
            this.#activeVoxelObjectId = newObject.sceneId;
            this.#notifyOfChangedActiveVo();
        }
        if(newObject instanceof Camera && this.#activeCameraId == null){
            this.#activeCameraId = newObject.sceneId;
            this.#notifyOfChangedActiveCamera();
        }
        /*
        if(this.#selectedSceneObjectId == null){
            this.#selectedSceneObjectId = newObject.sceneId;
            this.#notifyOfChangedSelectedSo();
        }
        */
        return true;
    }

    removeObject(id: number): boolean{
        const obj = this.objects.get(id);
        if(!obj) return false;
        obj.sceneId = null;
        this.objects.delete(id);

        this.#notifyOfObjectRemoved();
        this.#notifyOfObjectListChanged();
        
        if(this.#activeCameraId == id){
            this.#activeCameraId = null;
            this.#notifyOfChangedActiveCamera();
        }
        /*
        if(this.#selectedSceneObjectId == id){
            this.#selectedSceneObjectId = null;    
            this.#notifyOfChangedSelectedSo();        
        }
        */
        if(this.#activeVoxelObjectId == id){
            this.#activeVoxelObjectId = null;
            this.#notifyOfChangedActiveVo();
        }
        return true;
    }

    isVoxelObjectSelectedById(id: number): boolean{
        return id === this.#activeVoxelObjectId;
    }

    isVoxelObjectSelected(vo: VoxelObject): boolean{
        return vo.sceneId!=null && vo.sceneId===this.#activeVoxelObjectId;
    }

    isCameraActiveById(id: number): boolean{
        return id === this.#activeCameraId;
    }

    isCameraActive(c: Camera): boolean{
        return c.sceneId!=null && c.sceneId===this.#activeCameraId;
    }
    
    toggleObjectEnabled(id: number): boolean{
        const obj = this.objects.get(id);
        if(!obj) return false;
        obj.enabled = !obj.enabled;
        this.#notifyOfObjectEnabledChange();
        return true;
    }
}