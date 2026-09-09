import { clamp } from "../../../math/utils";
import { Vector3 } from "../../../math/vector3.type";
import { Vector4 } from "../../../math/vector4.type";
import { RenderableObject } from "../../../render_engine/renderableObjects/renderableObject";
import { copyVoxel, copyVoxelArray, type Voxel, type VoxelArray } from "./voxel";
import { getEmptyVoxelArray } from "./voxel-array-generator";
import { RenderableObjectManager } from "../renderable-object-manager";
import { SceneObject, type WorldObjectTransform } from "../sceneObject";
import type { Color } from "react-color";
import { VoxelEngineEvent } from "../../events/event";
import { VoxelObjectSelectedArea } from "./voxel-object-selected-area";

export type FaceDirection = 
| "PosX"
| "NegX"
| "PosY"
| "NegY"
| "PosZ"
| "NegZ"

export function faceDirectionToVector(dir: FaceDirection){
    switch(dir){
        case "PosX":
            return new Vector3(1,0,0);
        case "NegX":
            return new Vector3(-1,0,0);
        case "PosY":
            return new Vector3(0,1,0);
        case "NegY":
            return new Vector3(0,-1,0);
        case "PosZ":
            return new Vector3(0,0,1);
        case "NegZ":
            return new Vector3(0,0,-1);
    }
}

export function vectorToFaceDirection(v: Vector3){
    if(v.equals(new Vector3(1,0,0))){
        return "PosX";
    }else if(v.equals(new Vector3(-1,0,0))){
        return "NegX";
    }else if(v.equals(new Vector3(0,1,0))){
        return "PosY";
    }else if(v.equals(new Vector3(0,-1,0))){
        return "NegY";
    }else if(v.equals(new Vector3(0,0,1))){
        return "PosZ";
    }else{
        return "NegZ";
    }
}

export type SelectedAreaType = "static" | "dynamic";

// (0,0,0) of model space should be middle of the object
// for now without any chunk system or any other kind of optimization
// any cell inside VoxelObject may have object of type Voxel or be null
export class VoxelObject extends SceneObject{

    transform: WorldObjectTransform = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0),
    }
    
    //dictates hard borders of voxel object
    static readonly maxSize: Vector3 = new Vector3(256,256,256);
    static readonly minSize: Vector3 = new Vector3(2,2,2);

    //size of whole voxelObject
    size : Vector3 = new Vector3(0,0,0);
    
    //how much units in worldSpace should one voxel take in each dimension
    #voxelSize = 50;

    //for now all voxels are stored simply as 3D array in VoxelObject
    //in fututre this will be replaced by more sophisticated methods
    voxels : VoxelArray = [[[]]];

    selectedVoxelsAlpha = 160;
    selectedVoxelsDefaultColor: Vector4 = new Vector4(160, 130, 210, this.selectedVoxelsAlpha)
    selectedVoxelColor: Vector4 = this.selectedVoxelsDefaultColor.copy();

    //selected voxels are of type string to ensure uniqueness by value
    //use Vector3.toString() and Vector3.fromString() for conversion
    //selectedVoxels: Set<string> = new Set();

    //refers to selected area which is placed only on actions and doesn't dissapear on cursor or camera move
    staticSelectedArea = new VoxelObjectSelectedArea();

    //refers to selected area used in selection sessions
    dynamicSelectedArea = new VoxelObjectSelectedArea();

    constructor(name: string , size: Vector3){
        super(name);
        this.size = size;        
        this.voxels = Array.from({ length: size.x }, () =>
            Array.from({ length: size.y }, () =>
                Array.from({ length: size.z }, () => null)
            )
        );

        this.#objectRo = RenderableObjectManager.createVoRo(this);
        this.#objectGridRo = RenderableObjectManager.createVoBorderGridRo(this);
        this.#staticSelectedAreaRo = RenderableObjectManager.createVoSelectedAreaRo(this, "static");
        this.#dynamicSelectedAreaRo = RenderableObjectManager.createVoSelectedAreaRo(this, "dynamic");
        this.#borderGridRo = RenderableObjectManager.createVoBorderGridRo(this);
        this.#borderOutlineRo = RenderableObjectManager.createVoBorderOutlineRo(this);
    }

    //managing renderable objects

    //todo: probably should have different notifies for different selected areas
    #notifyOfSelectedAreaChange(){
        this.#staticSelectedAreaRo.mesh = null;
        this.#dynamicSelectedAreaRo.mesh = null;
        this.#setStaticSelectedAreaRoToRebuild();
        this.#setDynamicSelectedAreaRoToRebuild();
        this.selectedAreaChangeEvent.emit();
    }
    selectedAreaChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfVoxelsChange(){
        this.#objectRo.mesh = null;
        this.#objectGridRo.mesh = null;
        this.#setObjectRoToRebuild();
        this.#setObjectGridRoToRebuild(); 
        this.voxelsChangeEvent.emit();
    }
    voxelsChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfTransformChange(){
        this.#setObjectRoToRebuild();
        this.#setObjectGridRoToRebuild();
        this.#setStaticSelectedAreaRoToRebuild();
        this.#setDynamicSelectedAreaRoToRebuild();
        this.#setBorderOutlineRoToRebuild();
        this.#setBorderGridToRebuild();
        this.transformChangeEvent.emit();
    }
    transformChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #notifyOfSizeChange(){
        this.#borderGridRo.mesh = null;
        this.#borderOutlineRo.mesh = null;
        this.#setBorderOutlineRoToRebuild();
        this.#setBorderGridToRebuild();
        this.sizeChangeEvent.emit();
    }
    sizeChangeEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();

    #objectRo: RenderableObject;
    #objectRoDirtyFlag: boolean = false;
    getObjectRo(): RenderableObject{
        if(this.#shouldRebuildObjectRo()){
            this.#rebuildObjectRo();
        }
        return this.#objectRo;
    }
    #shouldRebuildObjectRo(): boolean{
        return this.#objectRoDirtyFlag;
    }
    #setObjectRoToRebuild(){
        this.#objectRoDirtyFlag = true;
    }
    #rebuildObjectRo(){
        RenderableObjectManager.rebuildVoRo(this, this.#objectRo);
    }

    #objectGridRo: RenderableObject;
    objectGridColor: Vector4 = new Vector4(100,100,100,255);
    #objectGridRoDirty: boolean = false;
    getObjectGridRo(): RenderableObject{
        if(this.#shouldRebuildObjectGridRo()){
            this.#rebuildObjectGrid();
        }
        return this.#objectGridRo;
    }
    #shouldRebuildObjectGridRo(): boolean{
        return this.#objectGridRoDirty
    }
    #setObjectGridRoToRebuild(){
        this.#objectGridRoDirty = true;
    }
    #rebuildObjectGrid(){
        RenderableObjectManager.rebuildVoGridRo(this, this.#objectGridRo);
    }

    //if currently selectedAreaRo is a result of selectMode.Color it stores this color for sake of optimization
    #selectedColor: Vector4 | null = null;
    #selectedByColorVoxels: Set<Vector3> | null = null

    #staticSelectedAreaRo: RenderableObject;
    #dynamicSelectedAreaRo: RenderableObject;
    #staticSelectedAreaRoDirty: boolean = false;
    #dynamicSelectedAreaRoDirty: boolean = false;
    getStaticSelectedAreaRo() : RenderableObject{
        if(this.#shouldRebuildStaticSelectedAreaRo()){
            this.#rebuildStaticSelectedAreaRo();
        }
        return this.#staticSelectedAreaRo;
    }
    #shouldRebuildStaticSelectedAreaRo(): boolean{
        return this.#dynamicSelectedAreaRoDirty
    }
    #setStaticSelectedAreaRoToRebuild(){
        this.#dynamicSelectedAreaRoDirty = true;
    }
    #rebuildStaticSelectedAreaRo(){
        RenderableObjectManager.rebuildVoSelectedAreaRo(this, "static",this.#staticSelectedAreaRo);
    }

    getDynamicSelectedAreaRo() : RenderableObject{
        if(this.#shouldRebuildDynamicSelectedAreaRo()){
            this.#rebuildDynamicSelectedAreaRo();
        }
        return this.#dynamicSelectedAreaRo;
    }    
    #shouldRebuildDynamicSelectedAreaRo(): boolean{
        return this.#dynamicSelectedAreaRoDirty
    }
    #setDynamicSelectedAreaRoToRebuild(){
        this.#dynamicSelectedAreaRoDirty = true;
    }
    #rebuildDynamicSelectedAreaRo(){
        RenderableObjectManager.rebuildVoSelectedAreaRo(this, "dynamic", this.#dynamicSelectedAreaRo);
    }    

    borderColor: Vector4 = new Vector4(160, 130, 210, 255);

    #borderOutlineRo: RenderableObject;
    #borderOutlineRoDirty: boolean = false;
    getBorderOutlineRo(): RenderableObject{
       if(this.#shouldRebuildBorderOutlineRo()){
        this.#rebuildBorderOutlineRo();
       }
       return this.#borderOutlineRo;
    }
    #shouldRebuildBorderOutlineRo(): boolean{
        return this.#borderOutlineRoDirty;
    }
    #setBorderOutlineRoToRebuild(){
        this.#borderOutlineRoDirty = true;
    }
    #rebuildBorderOutlineRo(): void{
        RenderableObjectManager.rebuildVoBorderOutlineRo(this, this.#borderOutlineRo);
    }
    

    #borderGridRo: RenderableObject;
    #borderGridRoDirty: boolean = false;
    getBorderGridRo(): RenderableObject{
       if(this.#shouldRebuildBorderGrid()){
        this.#rebuildBorderGridRo();
       }
       return this.#borderGridRo;
    }
    #shouldRebuildBorderGrid(): boolean{
        return this.#borderGridRoDirty;
    }
    #setBorderGridToRebuild(){
        this.#borderGridRoDirty = true;
    }
    #rebuildBorderGridRo(): void{
        RenderableObjectManager.rebuildVoBorderGridRo(this, this.#borderGridRo);
    }

    // Ghost voxels are voxels which are rendered instead of actual voxels in given position
    // but do not take place inside the grid
    // used for moving action
    ghostVoxels: Map<string, Voxel> = new Map();

    // Adds voxel to ghost voxels map if given id is correct grid coordinate
    // returns true if voxel was added, false otherwise 
    addGhostVoxel(gridCoord: Vector3, voxel: Voxel): boolean{
        if(this.voxelExists(gridCoord)){
            this.ghostVoxels.set(gridCoord.toString(), {...voxel})
            this.#notifyOfVoxelsChange();
            return true;
        }
        return false;
    }

    // Clears ghost voxels map
    // returns size of ghost voxels map before clearing
    clearGhostVoxels(): number{
        const out = this.ghostVoxels.size;
        this.ghostVoxels.clear();
        if(out>0) this.#notifyOfVoxelsChange();
        return out;
    }

    // Copies each voxel in given selected area set to ghost voxels map
    // returns amount of copied voxels;
    copySelectedAreaToGhostVoxels(areaType: SelectedAreaType){
        const selectedArea = this.getSelectedArea(areaType);
        let out = 0;
        selectedArea.voxels.forEach((v)=>{
            const gridCoord = Vector3.fromString(v); 
            if( this.addGhostVoxel(gridCoord , this.getVoxel(gridCoord)!) ) out++;
        });
        if(out > 0){
            this.#notifyOfVoxelsChange();
        }
        return out;
    }

    // Copies each voxel in ghost voxels map and replaces grid voxel of same id with it
    // returns amount of copied voxels
    copyGhostVoxelsToGrid(){
        let out = 0;
        this.ghostVoxels.forEach((voxel, gridPosition)=>{
            if(this.setVoxel(Vector3.fromString(gridPosition) , voxel)){
                out++;
            }
        })
        if(out>0){
            this.#notifyOfVoxelsChange();
        }
        return out;
    }

    //receives point in this object model space
    //returns id of possible voxel in this object
    //whether any voxel exists under this id is unkown
    //assumes that (0,0,0) is in the middle of the object
    pointCoordinatesToVoxelId(v: Vector3): Vector3 {
        const xCord = Math.floor(v.x / this.#voxelSize) + Math.floor(this.size.x / 2);
        const yCord = Math.floor(v.y / this.#voxelSize) + Math.floor(this.size.y / 2);
        const zCord = Math.floor(v.z / this.#voxelSize) + Math.floor(this.size.z / 2);

        return new Vector3(xCord, yCord, zCord);
    }

    // Returns middle of voxel of given id 
    // Function doesn't check whether voxel of given id actually exists in this voxel object
    voxelIdToModelSpace(v: Vector3): Vector3{
        const objectStart : Vector3 = new Vector3(-this.size.x/2 , -this.size.y/2, -this.size.z/2) 
        const voxelSize = this.getVoxelSize();
        const voxelStartPosition = new Vector3( (objectStart.x + v.x)*voxelSize , (objectStart.y+v.y)*voxelSize, (objectStart.z+v.z)*voxelSize);
        const voxelMiddlePosition = new Vector3(voxelStartPosition.x + voxelSize/2, voxelStartPosition.y + voxelSize/2, voxelStartPosition.z + voxelSize/2);
        return voxelMiddlePosition;
    }

    //receives voxel id
    //returns voxel copy or null if id is incorrect
    getVoxel(v: Vector3) : Voxel | null{
        const x = v.x;
        const y = v.y;
        const z = v.z;
        //console.log(`[getVoxel] request for voxel (${x},${y},${z}) | for object of size: (${this.size.x},${this.size.y},${this.size.z})`);

        if (
            x < 0 || x >= this.size.x ||
            y < 0 || y >= this.size.y ||
            z < 0 || z >= this.size.z
        ) {
            return null;
        }

        const chosenVoxel = this.voxels[x][y][z];
        return chosenVoxel ? copyVoxel(chosenVoxel) : null;
       
    }

    setVoxel(pos: Vector3, newVoxel: Voxel | null){
        try{
            this.voxels[pos.x][pos.y][pos.z] = newVoxel;
            this.#notifyOfVoxelsChange();
            return true;
        }catch(e: any){
            return false;
        }
    }

    setVoxels(voxels: VoxelArray){
        const size: Vector3 = new Vector3(voxels.length, voxels[0].length, voxels[0][0].length);
        this.voxels = voxels;    
        const sizeModified = this.size!==size;
        this.size = size;


        this.#notifyOfVoxelsChange();
        if(sizeModified){
            this.#notifyOfSizeChange();
        }

    }

    removeVoxel(pos: Vector3){
        try{
            this.voxels[pos.x][pos.y][pos.z] = null;
            this.#notifyOfVoxelsChange();
            return true;
        }catch(e: any){
            return false;
        }
    }


    //clears voxels set of all selected areas
    //returns sum of sizes of selected voxels sets before clearing
    resetAllSelects(){
        return this.resetSelect("static") + this.resetSelect("dynamic");        
    }

    copyDynamicSelectedToStatic(){
        this.staticSelectedArea.clearVoxelsSet();
        const copiedVoxels: Vector3[] = [];
        this.dynamicSelectedArea.voxels.forEach(v=>{
            copiedVoxels.push(Vector3.fromString(v));
        });
        this.selectVoxelArray(copiedVoxels, "static");
    }

    //clear set of selected voxels of given selected area
    //returns size of selected voxels set before clearing
    resetSelect(areaType: SelectedAreaType){
        const clearedVoxels = this.getSelectedArea(areaType).clearVoxelsSet();
        if(clearedVoxels>0){
            this.#notifyOfSelectedAreaChange();
        }

        this.#selectedByColorVoxels = null;
        this.#selectedColor = null;

        return clearedVoxels;
    }

    //adds voxel of given coordinates to set of selected voxels
    //returns true if successfuly added
    //returns false if voxel doesn't exist or if voxel was already selected
    //allowEmpty - true if both empty and non-empty voxels can be selected, 
    //only non-empty ones can be selected if false
    selectVoxel(v: Vector3, areaType: SelectedAreaType, allowEmpty: boolean = true): boolean{
        if(this.voxelExists(v) && (allowEmpty || this.isVoxelNonEmpty(v))){
            if(areaType==="dynamic"){
                this.resetSelect(areaType);
            }            
            const voxelSelected =  this.getSelectedArea(areaType).addVoxel(v);                        
            if(voxelSelected) this.#notifyOfSelectedAreaChange();
            return true;            
        }else{
            return false;
        }
    }

    //adds array of voxels of given coordinates to set of selected voxels
    //returns amount of voxels added    
    selectVoxelArray(voxels: Vector3[], areaType: SelectedAreaType): boolean{
        const existingVoxels: Vector3[] = [];
        voxels.forEach(v=>{
            if(this.voxelExists(v)){
                existingVoxels.push(v);
            }
        })

    
        if(areaType==="dynamic"){
            this.resetSelect(areaType);
        }            
        const voxelsSelected: number =  this.getSelectedArea(areaType).addVoxels(existingVoxels);                        
        if(voxelsSelected>0) this.#notifyOfSelectedAreaChange();
        return true;            
       
    }

    //adds voxels of the same face as starting voxel of given coordinates
    //emptyVoxels = true : selects only empty voxels, otherwise only non-empty
    //returns true if successfuly added or if all voxels were already selected
    //returns false if starting voxel doesn't exist
    selectFace(v: Vector3, dir: FaceDirection, areaType: SelectedAreaType, emptyVoxels: boolean = false): boolean{
        if(!this.voxelExists(v)) {
            return false;
        }
        if(areaType==="dynamic"){
            this.resetSelect(areaType);
        }        
        this.#selectFaceRecursion(v, dir, emptyVoxels, areaType);
        this.#notifyOfSelectedAreaChange();
        return true;
    }

    #blockingVoxelCoords(v: Vector3, dir: FaceDirection): Vector3{
        switch(dir){
            case "PosX":
                return v.copy().addVector(new Vector3(1,0,0)); 
            case "NegX":
                return v.copy().addVector(new Vector3(-1,0,0)); 
            case "PosY":
                return v.copy().addVector(new Vector3(0,1,0)); 
            case "NegY":
                return v.copy().addVector(new Vector3(0,-1,0)); 
            case "PosZ":
                return v.copy().addVector(new Vector3(0,0,1)); 
            case "NegZ":
                return v.copy().addVector(new Vector3(0,0,-1));                                                                                
        }
    }

    #voxelBehindId(v: Vector3, dir: FaceDirection): Vector3{
        switch(dir){
            case "PosX":
                return v.copy().addVector(new Vector3(-1,0,0)); 
            case "NegX":
                return v.copy().addVector(new Vector3(1,0,0)); 
            case "PosY":
                return v.copy().addVector(new Vector3(0,-1,0)); 
            case "NegY":
                return v.copy().addVector(new Vector3(0,1,0)); 
            case "PosZ":
                return v.copy().addVector(new Vector3(0,0,-1)); 
            case "NegZ":
                return v.copy().addVector(new Vector3(0,0,1));                                                                                
        }
    }

    #voxelDirNeighborsCoords(v: Vector3, dir: FaceDirection): Vector3[]{
        if(dir == "PosX" || dir=="NegX"){
            return [
                new Vector3(v.x,v.y+1,v.z),
                new Vector3(v.x,v.y-1,v.z),
                new Vector3(v.x,v.y,v.z+1),
                new Vector3(v.x,v.y,v.z-1),                
            ]
        }else if(dir == "PosY" || dir == "NegY"){
            return [
                new Vector3(v.x+1,v.y,v.z),
                new Vector3(v.x-1,v.y,v.z),
                new Vector3(v.x,v.y,v.z+1),
                new Vector3(v.x,v.y,v.z-1),                
            ]
        }else{
            return [
                new Vector3(v.x+1,v.y,v.z),
                new Vector3(v.x-1,v.y,v.z),
                new Vector3(v.x,v.y+1,v.z),
                new Vector3(v.x,v.y-1,v.z),                
            ]
        }
    }

    #voxelNeighborsCoords(v: Vector3): Vector3[]{        
            return [
                new Vector3(v.x,v.y+1,v.z),
                new Vector3(v.x,v.y-1,v.z),
                new Vector3(v.x,v.y,v.z+1),
                new Vector3(v.x,v.y,v.z-1),                                
                new Vector3(v.x+1,v.y,v.z),
                new Vector3(v.x-1,v.y,v.z),
                new Vector3(v.x,v.y,v.z+1),
                new Vector3(v.x,v.y,v.z-1),                                        
                new Vector3(v.x+1,v.y,v.z),
                new Vector3(v.x-1,v.y,v.z),
                new Vector3(v.x,v.y+1,v.z),
                new Vector3(v.x,v.y-1,v.z),                
            ]
    }
    
    #selectFaceRecursion(v: Vector3, dir: FaceDirection, emptyVoxels: boolean, areaType: SelectedAreaType){
        //console.log(`[selectFaceRecursion] iteration: ${v} -`)
        const possiblyBlockingVoxelCoords = this.#blockingVoxelCoords(v , dir);
        const voxelBehind = this.#voxelBehindId(v,dir);
        const shouldSkipThisVoxel = emptyVoxels? (!this.voxelExists(v) ||  this.isVoxelNonEmpty(v) || this.getSelectedArea(areaType).hasVoxel(v) || (this.voxelExists(voxelBehind) && this.isVoxelEmpty(voxelBehind)))
        : !this.voxelExists(v) || this.isVoxelEmpty(v) || this.getSelectedArea(areaType).hasVoxel(v);

        if(shouldSkipThisVoxel) return;
        //console.log(`[selectFaceRecursion] iteration: ${v} +`)
        
        const isCurrentVoxelOnSurface = this.isVoxelEmpty(possiblyBlockingVoxelCoords) || !this.voxelExists(possiblyBlockingVoxelCoords);
        //console.log(`isCurrentVoxelOnSurface: ${isCurrentVoxelOnSurface } | for blocking voxel: ${possiblyBlockingVoxelCoords}`)
        if(!isCurrentVoxelOnSurface) return;

        const selectedVoxel = v;
        this.getSelectedArea(areaType).addVoxel(selectedVoxel)

        this.#voxelDirNeighborsCoords(v, dir).forEach((vs)=>{
            this.#selectFaceRecursion(vs, dir, emptyVoxels, areaType);
        });
    }

    selectCube(vStart: Vector3, vEnd: Vector3, areaType: SelectedAreaType, allowEmpty: boolean = true): boolean{
        if(!this.voxelExists(vStart)) return false;
        if(areaType==="dynamic"){
            this.resetSelect(areaType);
        }

        
        const clampedEnd = new Vector3(clamp({value: vEnd.x, min: 0 ,max: this.size.x-1 }), 
                                clamp({value: vEnd.y, min: 0 ,max: this.size.y-1 }),
                                clamp({value: vEnd.z, min: 0 ,max: this.size.z-1}));
       
        const correctedVStart = new Vector3(Math.min(vStart.x, clampedEnd.x),
                                            Math.min(vStart.y, clampedEnd.y),
                                            Math.min(vStart.z, clampedEnd.z));
        const correctedVEnd = new Vector3(Math.max(vStart.x, clampedEnd.x),
                                            Math.max(vStart.y, clampedEnd.y),
                                            Math.max(vStart.z, clampedEnd.z));      
                                            
        const voxelsToSelect: Vector3[] = []                                        

        for(let x: number = correctedVStart.x; x <= correctedVEnd.x; x++){
            for(let y: number = correctedVStart.y; y <= correctedVEnd.y; y++){
                for(let z: number = correctedVStart.z; z <= correctedVEnd.z; z++){
                    const v = new Vector3(x,y,z);
                    if(allowEmpty || this.isVoxelNonEmpty(v))
                    voxelsToSelect.push(new Vector3(x,y,z));
                }
            }
        }

        const selectedVoxels = this.getSelectedArea(areaType).addVoxels(voxelsToSelect);
        if(selectedVoxels>0) this.#notifyOfSelectedAreaChange();
        return true;
    }

    selectConnected(v: Vector3, areaType: SelectedAreaType): boolean{
        if(!this.voxelExists(v)) {
            return false;
        }
        if(areaType==="dynamic"){
            this.resetSelect(areaType);
        }
        if(this.isVoxelNonEmpty(v)) this.#selectConntectedRecursion(v, areaType);
        this.#notifyOfSelectedAreaChange();   
        return true;
    }

    #selectConntectedRecursion(v: Vector3, areaType: SelectedAreaType){
        this.getSelectedArea(areaType).addVoxel(v)
        this.#voxelNeighborsCoords(v).forEach((vs)=>{
            if(!this.getSelectedArea(areaType).hasVoxel(vs) && this.voxelExists(vs) && this.isVoxelNonEmpty(vs)){
                this.#selectConntectedRecursion(vs, areaType);
            }
        });                                                                           
    }

    selectByColor(v: Vector3, areaType: SelectedAreaType): boolean{
        if(!this.voxelExists(v)) {
            return false;
        }

        if(this.isVoxelNonEmpty(v)){
            const c = this.getVoxel(v)!.color;        
            let cacheVoxels = false;
            //if previous selection was by color of the same color than load cached voxel set
            if(this.#selectedColor && this.#selectedColor.equals(c) && this.#selectedByColorVoxels){ 
                this.resetSelect(areaType);    
                return true;            
            }else{ //else prepare to cache newly made voxel set
                this.#selectedByColorVoxels = new Set();
                cacheVoxels = true;
                this.#selectedColor = c;
            }
            
            this.resetSelect(areaType);
            
            for(let x = 0; x < this.size.x; x++){
                for(let y = 0; y < this.size.y; y++){
                    for(let z = 0; z < this.size.z; z++){
                        const vId = new Vector3(x,y,z);
                        const v = this.getVoxel(vId);                        
                        if(v && v.color.equals(c)){
                            this.getSelectedArea(areaType).addVoxel(vId);
                            if(cacheVoxels){
                                this.selectByColor
                            }
                        }
                    }
                }
            }
        }else{ //if pointed voxel doesn't exist  then reset it
            this.resetSelect(areaType);
        }

        this.#notifyOfSelectedAreaChange();
        return true;
    }

    emptySelectedAreaVoxels(areaType: SelectedAreaType): number{
        let modifiedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            if(this.isVoxelNonEmpty(voxel)){
                this.removeVoxel(voxel);
                modifiedVoxels++;
            }
        });     
        return modifiedVoxels;
    }

    fillSelectedAreaVoxels(color: Vector4, areaType: SelectedAreaType): number{
        let modifiedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            if(this.isVoxelEmpty(voxel)){
                this.setVoxel(voxel, {color});
                modifiedVoxels++;
            }
        });     
        return modifiedVoxels;
    }

    reverseSelectedAreaVoxels(color: Vector4, areaType: SelectedAreaType): number{
        let modifiedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            if(this.isVoxelEmpty(voxel)){
                this.setVoxel(voxel, {color});
                modifiedVoxels++;
            }else if(this.isVoxelNonEmpty(voxel)){
                this.removeVoxel(voxel);
                modifiedVoxels++;
            }
        });     
        return modifiedVoxels;
    }

    //reset selected voxels and selects every empty voxel in object
    //returns number of newly selected voxels
    selectEmptyVoxels(areaType: SelectedAreaType): number{
        this.resetSelect(areaType);

        let selectedVoxelsNumber = 0;
        for(let x: number = 0; x <= this.size.x; x++){
            for(let y: number = 0; y <= this.size.y; y++){
                for(let z: number = 0; z <= this.size.z; z++){
                    const v = new Vector3(x,y,z);
                    if(this.isVoxelEmpty(v)){
                        selectedVoxelsNumber++;     
                        this.getSelectedArea(areaType).addVoxel(v);
                    }       
                }
            }
        }

        if(selectedVoxelsNumber>0) {
            this.#notifyOfSelectedAreaChange();
        }
        return selectedVoxelsNumber;
    }

    selectAllVoxels(areaType: SelectedAreaType): number{
        let selectedVoxelsNumber = 0;
        for(let x: number = 0; x <= this.size.x; x++){
            for(let y: number = 0; y <= this.size.y; y++){
                for(let z: number = 0; z <= this.size.z; z++){
                    const v = new Vector3(x,y,z);
                    if(this.voxelExists(v)){
                        selectedVoxelsNumber++;     
                        this.getSelectedArea(areaType).addVoxel(v);
                    }       
                }
            }
        }

        if(selectedVoxelsNumber>0) this.#notifyOfSelectedAreaChange();
        return selectedVoxelsNumber;
    }

    //reset selected voxels and selects every non-empty voxel in object
    //returns number of newly selected voxels
    selectNonEmptyVoxels(areaType: SelectedAreaType){
        this.resetSelect(areaType);

        let selectedVoxelsNumber = 0;
        for(let x: number = 0; x <= this.size.x; x++){
            for(let y: number = 0; y <= this.size.y; y++){
                for(let z: number = 0; z <= this.size.z; z++){
                    const v = new Vector3(x,y,z);
                    if(this.isVoxelNonEmpty(v)){
                        selectedVoxelsNumber++;     
                        this.getSelectedArea(areaType).addVoxel(v);  
                    }       
                }
            }
        }

        if(selectedVoxelsNumber>0) {
            this.#notifyOfSelectedAreaChange();
        }
        return selectedVoxelsNumber;
    }

    //adds voxel to every coord stored in selectedVoxels if the voxel they point at is empty
    //returns number of added voxels
    addSelectedVoxels(color: Vector4, areaType: SelectedAreaType) : number{
        let addedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            if(this.isVoxelEmpty(voxel)){
                this.setVoxel(voxel, {color});
                addedVoxels++;
            }
        });     
        return addedVoxels;
    }

    //fills every empty voxel with voxel of given color
    //removes every non-empty voxel
    //returns number of modified voxels
    reverseSelectedVoxels(color: Vector4, areaType: SelectedAreaType): number{
        let modifiedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            if(this.isVoxelEmpty(voxel)){
                this.setVoxel(voxel, {color});
                modifiedVoxels++;
            }else if(this.isVoxelNonEmpty(voxel)){
                this.removeVoxel(voxel);
                modifiedVoxels++;
            }
        });     
        return modifiedVoxels;
    }

    //nulls every voxel which id is stored in selectedVoxels
    //returns number of nulled voxels which were prevoiusly non-empty
    removeSelectedVoxels(areaType: SelectedAreaType) : number{
        let removedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxel = Vector3.fromString(v);
            this.removeVoxel(voxel);
            removedVoxels++;
        });
        return removedVoxels;
    }

    //rotations currently work only when full object is selected because they create fresh object and fill it only with rotated voxels
    //todo: FIX!
    rotateSelectedVoxelsByX(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        const maxY = this.size.y-1;
        const outVoxels = getEmptyVoxelArray(this.size);
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxelPosititon = Vector3.fromString(v);
            const voxel: Voxel | null = this.getVoxel(voxelPosititon);
            const newVoxelPosition = new Vector3(voxelPosititon.x, voxelPosititon.z, maxY - voxelPosititon.y);
            if(this.voxelExists(newVoxelPosition)){
                if(voxel){
                    outVoxels[newVoxelPosition.x][newVoxelPosition.y][newVoxelPosition.z] = copyVoxel(voxel)
                }
            }
            modifiedVoxels++;
        });
        this.voxels = outVoxels;

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    rotateSelectedVoxelsInSelectedAreaByX(areaType: SelectedAreaType): number {
        let modifiedVoxels = 0;

        let minY = Infinity;
        let maxY = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (const vStr of this.getSelectedArea(areaType).voxels) {
            const v = Vector3.fromString(vStr);

            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
            if (v.z < minZ) minZ = v.z;
            if (v.z > maxZ) maxZ = v.z;
        }

        const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);
        const newSelectedVoxels: Set<string> = new Set();

        this.getSelectedArea(areaType).voxels.forEach((vStr) => {
            const v = Vector3.fromString(vStr);

            const voxelPosition = new Vector3(v.x, v.y, v.z);

            const flippedVoxelPosition = new Vector3(
                v.x,
                minY + (v.z - minZ),
                maxZ - (v.y - minY)
            );

            const voxel = this.getVoxel(voxelPosition);

            newVoxelArray
                [flippedVoxelPosition.x]
                [flippedVoxelPosition.y]
                [flippedVoxelPosition.z] = voxel ? copyVoxel(voxel) : voxel;

            newSelectedVoxels.add(flippedVoxelPosition.toString());

            modifiedVoxels++;
        });

        this.voxels = newVoxelArray;
        this.getSelectedArea(areaType).voxels = newSelectedVoxels;

        this.#notifyOfSelectedAreaChange();
        this.#notifyOfVoxelsChange();

        return modifiedVoxels;
    }    

rotateSelectedVoxelsInSelectedAreaByY(areaType: SelectedAreaType): number {
    let modifiedVoxels = 0;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const vStr of this.getSelectedArea(areaType).voxels) {
        const v = Vector3.fromString(vStr);

        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.z < minZ) minZ = v.z;
        if (v.z > maxZ) maxZ = v.z;
    }

    const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);
    const newSelectedVoxels: Set<string> = new Set();

    this.getSelectedArea(areaType).voxels.forEach((vStr) => {
        const v = Vector3.fromString(vStr);

        const voxelPosition = new Vector3(v.x, v.y, v.z);

        const newVoxelPosition = new Vector3(
            maxX - (v.z - minZ),
            v.y,
            minZ + (v.x - minX)
        );

        const voxel = this.getVoxel(voxelPosition);

        newVoxelArray
            [newVoxelPosition.x]
            [newVoxelPosition.y]
            [newVoxelPosition.z] = voxel ? copyVoxel(voxel) : voxel;

        newSelectedVoxels.add(newVoxelPosition.toString());

        modifiedVoxels++;
    });

    this.voxels = newVoxelArray;
    this.getSelectedArea(areaType).voxels = newSelectedVoxels;

    this.#notifyOfSelectedAreaChange();
    this.#notifyOfVoxelsChange();

    return modifiedVoxels;
}

rotateSelectedVoxelsInSelectedAreaByZ(areaType: SelectedAreaType): number {
    let modifiedVoxels = 0;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const vStr of this.getSelectedArea(areaType).voxels) {
        const v = Vector3.fromString(vStr);

        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
    }

    const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);
    const newSelectedVoxels: Set<string> = new Set();

    this.getSelectedArea(areaType).voxels.forEach((vStr) => {
        const v = Vector3.fromString(vStr);

        const voxelPosition = new Vector3(v.x, v.y, v.z);

        const newVoxelPosition = new Vector3(
            minX + (v.y - minY),
            maxY - (v.x - minX),
            v.z
        );

        const voxel = this.getVoxel(voxelPosition);

        newVoxelArray
            [newVoxelPosition.x]
            [newVoxelPosition.y]
            [newVoxelPosition.z] = voxel ? copyVoxel(voxel) : voxel;

        newSelectedVoxels.add(newVoxelPosition.toString());

        modifiedVoxels++;
    });

    this.voxels = newVoxelArray;
    this.getSelectedArea(areaType).voxels = newSelectedVoxels;

    this.#notifyOfSelectedAreaChange();
    this.#notifyOfVoxelsChange();

    return modifiedVoxels;
}
    
    rotateSelectedVoxelsByY(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        const maxZ = this.size.z-1;
        const outVoxels = getEmptyVoxelArray(this.size);
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxelPosititon = Vector3.fromString(v);
            const voxel: Voxel | null = this.getVoxel(voxelPosititon);
            const newVoxelPosition = new Vector3(maxZ - voxelPosititon.z, voxelPosititon.y, voxelPosititon.x);
            if(this.voxelExists(newVoxelPosition)){
                if(voxel){
                    outVoxels[newVoxelPosition.x][newVoxelPosition.y][newVoxelPosition.z] = copyVoxel(voxel)
                }
            }
            modifiedVoxels++;
        });
        this.voxels = outVoxels;

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;  
    }

    rotateSelectedVoxelsByZ(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        const maxX = this.size.x-1;
        const outVoxels = getEmptyVoxelArray(this.size);
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            const voxelPosititon = Vector3.fromString(v);
            const voxel: Voxel | null = this.getVoxel(voxelPosititon);
            const newVoxelPosition = new Vector3(voxelPosititon.y, maxX - voxelPosititon.x, voxelPosititon.z);
            if(this.voxelExists(newVoxelPosition)){
                if(voxel){
                    outVoxels[newVoxelPosition.x][newVoxelPosition.y][newVoxelPosition.z] = copyVoxel(voxel);
                }
            }
            modifiedVoxels++;
        });
        this.voxels = outVoxels;

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    flipSelectedVoxelsInSelectedAreaByX(areaType: SelectedAreaType){
        let modifiedVoxels = 0;

        let minX = Infinity;
        let maxX = -Infinity;
        for (const vStr of this.getSelectedArea(areaType).voxels) {
            const v = Vector3.fromString(vStr);
            if(v.x > maxX) maxX = v.x;
            if(v.x < minX) minX = v.x;
        }

        const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);    
        const newSelectedVoxels: Set<string> = new Set();          
        this.getSelectedArea(areaType).voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr);
            const voxelPosition = new Vector3(v.x,v.y,v.z);
            const flippedVoxelPosition = new Vector3(minX + maxX - v.x ,v.y,v.z);      
            const voxel = this.getVoxel(voxelPosition);
            newVoxelArray[flippedVoxelPosition.x][flippedVoxelPosition.y][flippedVoxelPosition.z] =voxel?copyVoxel(voxel):voxel
            newSelectedVoxels.add(flippedVoxelPosition.toString());
            modifiedVoxels++;
        });
        this.voxels = newVoxelArray;
        this.getSelectedArea(areaType).voxels = newSelectedVoxels;

        this.#notifyOfSelectedAreaChange();
        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    flipSelectedVoxelsInSelectedAreaByY(areaType: SelectedAreaType){
        let modifiedVoxels = 0;

        let minY = Infinity;
        let maxY = -Infinity;
        for (const vStr of this.getSelectedArea(areaType).voxels) {
            const v = Vector3.fromString(vStr);
            if(v.y > maxY) maxY = v.y;
            if(v.y < minY) minY = v.y;
        }

        const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);     
        const newSelectedVoxels: Set<string> = new Set();        
        this.getSelectedArea(areaType).voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr);
            const voxelPosition = new Vector3(v.x,v.y,v.z);
            const flippedVoxelPosition = new Vector3(v.x ,minY + maxY - v.y,v.z);      
            const voxel = this.getVoxel(voxelPosition);
            newVoxelArray[flippedVoxelPosition.x][flippedVoxelPosition.y][flippedVoxelPosition.z] =voxel?copyVoxel(voxel):voxel
            newSelectedVoxels.add(flippedVoxelPosition.toString());
            modifiedVoxels++;
        });
        this.voxels = newVoxelArray;
        this.getSelectedArea(areaType).voxels = newSelectedVoxels;

        this.#notifyOfSelectedAreaChange();
        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }
    
    flipSelectedVoxelsInSelectedAreaByZ(areaType: SelectedAreaType){
        let modifiedVoxels = 0;

        let minZ = Infinity;
        let maxZ = -Infinity;
        for (const vStr of this.getSelectedArea(areaType).voxels) {
            const v = Vector3.fromString(vStr);
            if(v.z > maxZ) maxZ = v.z;
            if(v.z < minZ) minZ = v.z;
        }

        const newVoxelArray: VoxelArray = copyVoxelArray(this.voxels);     
        const newSelectedVoxels: Set<string> = new Set();
        this.getSelectedArea(areaType).voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr);
            const voxelPosition = new Vector3(v.x,v.y,v.z);
            const flippedVoxelPosition = new Vector3(v.x ,v.y,minZ + maxZ - v.z);      
            const voxel = this.getVoxel(voxelPosition);
            newVoxelArray[flippedVoxelPosition.x][flippedVoxelPosition.y][flippedVoxelPosition.z] =voxel?copyVoxel(voxel):voxel
            newSelectedVoxels.add(flippedVoxelPosition.toString());
            modifiedVoxels++;
        });
        this.voxels = newVoxelArray;
        this.getSelectedArea(areaType).voxels = newSelectedVoxels;

        this.#notifyOfSelectedAreaChange();
        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }    

    flipSelectedVoxelsByX(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        for(let x = 0; x < Math.floor(this.size.x/2); x++){
            for(let y = 0; y < this.size.y; y++){
                for(let z = 0; z < this.size.z; z++){
                    if(this.getSelectedArea(areaType).hasVoxel(new Vector3(x,y,z))){
                        const voxelPosition = new Vector3(x,y,z);
                        const flippedVoxelPosition = new Vector3(this.size.x - 1 - x ,y,z);
                        if(!voxelPosition.equals(flippedVoxelPosition)){
                            this.swapVoxels(voxelPosition , flippedVoxelPosition);
                            modifiedVoxels++;
                        }
                    }
                }   
            }   
        }

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    flipSelectedVoxelsByY(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        for(let x = 0; x < this.size.x; x++){
            for(let y = 0; y < Math.floor(this.size.y/2); y++){
                for(let z = 0; z < this.size.z; z++){
                    if(this.getSelectedArea(areaType).hasVoxel(new Vector3(x,y,z))){
                        const voxelPosition = new Vector3(x,y,z);
                        const flippedVoxelPosition = new Vector3(x ,this.size.y - 1 -y,z);
                        if(!voxelPosition.equals(flippedVoxelPosition)){
                            this.swapVoxels(voxelPosition , flippedVoxelPosition);
                            modifiedVoxels++;
                        }
                    }
                }   
            }   
        }

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    flipSelectedVoxelsByZ(areaType: SelectedAreaType): number{
        let modifiedVoxels = 0;
        for(let x = 0; x < this.size.x; x++){
            for(let y = 0; y < this.size.y; y++){
                for(let z = 0; z < Math.floor(this.size.z/2); z++){
                    if(this.getSelectedArea(areaType).hasVoxel(new Vector3(x,y,z))){
                        const voxelPosition = new Vector3(x,y,z);
                        const flippedVoxelPosition = new Vector3(x ,y,this.size.z - 1 -z);
                        if(!voxelPosition.equals(flippedVoxelPosition)){
                            this.swapVoxels(voxelPosition , flippedVoxelPosition);
                            modifiedVoxels++;
                        }
                    }
                }   
            }   
        }

        this.#notifyOfVoxelsChange();
        return modifiedVoxels;
    }

    //swaps values beetwen 2 voxels
    //returns false if id of any voxels was incorrect, true otherwise
    swapVoxels(pos1: Vector3, pos2: Vector3 ): boolean{
        if(!this.voxelExists(pos1) || !this.voxelExists(pos2)) return false;
        const voxel1: Voxel | null = this.isVoxelEmpty(pos1)? null : copyVoxel(this.getVoxel(pos1)!);
        const voxel2: Voxel | null = this.isVoxelEmpty(pos2)? null : copyVoxel(this.getVoxel(pos2)!);;
        
        voxel2==null? this.removeVoxel(pos1) : this.setVoxel(pos1, voxel2);
        voxel1==null? this.removeVoxel(pos2) : this.setVoxel(pos2, voxel1);

        return true;
    }

    //changes color of every non-empty voxel which id is stored in selectedVoxels
    //returns number of modified voxels
    paintSelectedVoxels(newColor: Vector4, areaType: SelectedAreaType) : number{
        let modifiedVoxels: number = 0;
        this.getSelectedArea(areaType).voxels.forEach(v=>{
            if(this.isVoxelNonEmpty(Vector3.fromString(v))){
                const voxel = Vector3.fromString(v);
                this.setVoxel(voxel, {color: newColor});
                modifiedVoxels++;
            }
        });
        if(modifiedVoxels>0){


            this.#notifyOfVoxelsChange();
        }
        return modifiedVoxels;
    }

    //receives point in this object model space
    //return copy of voxel in those coordinates or null if there's none
    getVoxelFromModelSpacePoint(v: Vector3) : Voxel | null{
        return this.getVoxel(this.pointCoordinatesToVoxelId(v));
    }

    //changes size of voxel object, according to argument newSize, 
    //clamped beetwen 0 and private parameter maxSize
    //returns new size of voxel object
    resize(newSize: Vector3) : Vector3{
        const clampedNewSize = new Vector3(
            clamp({value: newSize.x , min: VoxelObject.minSize.x , max: VoxelObject.maxSize.x}),
            clamp({value: newSize.y , min: VoxelObject.minSize.y , max: VoxelObject.maxSize.y}),
            clamp({value: newSize.z , min: VoxelObject.minSize.z , max: VoxelObject.maxSize.z})
        );

        if(!clampedNewSize.equals(this.size)){
            
            const newVoxels: (Voxel | null)[][][] = Array.from({ length: clampedNewSize.x }, () =>
                Array.from({ length: clampedNewSize.y }, () =>
                    Array.from({ length: clampedNewSize.z }, () => null)
                )
            );

            for(let x = 0; x < Math.min(this.size.x, clampedNewSize.x); x++){
                for(let y = 0; y < Math.min(this.size.y, clampedNewSize.y); y++){
                    for(let z = 0; z < Math.min(this.size.z, clampedNewSize.z); z++){
                        newVoxels[x][y][z] = this.voxels[x][y][z];
                    }
                }
            }

            //static selected area stays, dynamic is refreshed
            this.resetSelect("dynamic");
            let selectedAreaChanged = false;
            const newStaticSelectedVoxels = new Set<string>();
            this.getSelectedArea("static").voxels.forEach(vStr =>{
                const v = Vector3.fromString(vStr)
                if(v.x < clampedNewSize.x && v.y < clampedNewSize.y && v.z < clampedNewSize.z){
                    newStaticSelectedVoxels.add(vStr);
                }else{
                    selectedAreaChanged = true;
                }
            })

            this.size = clampedNewSize;
            this.voxels = newVoxels;
            this.staticSelectedArea.voxels = newStaticSelectedVoxels;
            
            //console.log(`[resize] resizing object to: ${this.size}`);
            this.#notifyOfVoxelsChange();
            this.#notifyOfSizeChange();
            if(selectedAreaChanged) this.#notifyOfSelectedAreaChange();
        }
        return this.size;
    }

    copy() : VoxelObject{
        const out: VoxelObject = new VoxelObject(this.name, this.size);
        out.voxels = this.voxels.map(layer =>
            layer.map(row =>
                row.map(voxel => voxel ? { ...voxel } : null)
            )
        );
        out.#voxelSize = this.#voxelSize;
        out.#notifyOfVoxelsChange();
        out.#notifyOfSizeChange();      
        out.selectedVoxelColor = this.selectedVoxelColor.copy();
        return out;
    }

    voxelExists(v: Vector3): boolean{
        return (v.x >= 0 && v.x < this.size.x && v.y >= 0 && v.y < this.size.y && v.z >= 0 && v.z <this.size.z);
    }

    //returns true if voxel of given coords exists and is non-null
    //returns false either if it's null or doesn't exist
    isVoxelNonEmpty(v: Vector3){
        return this.getVoxel(v)? true : false;
    }

    //returns true if voxel of given coords exists and is null
    //returns false either if it's not a null or doesn't exist
    isVoxelEmpty(v: Vector3){
        if(!this.voxelExists(v)) return false;
        const voxel = this.getVoxel(v);
        return voxel? false : true;
    }

    setSelectedVoxelsColor(v: Vector3){
        this.selectedVoxelColor = new Vector4(v.x, v.y, v.z, this.selectedVoxelsAlpha);
    }

    setVoxelSize(n: number){
        this.#voxelSize = n;

        this.#notifyOfVoxelsChange();
        this.#notifyOfSizeChange();
    }

    getVoxelSize(){
        return this.#voxelSize
    }

    getAllNonEmptyVoxels(): Voxel[]{
        const out = [];
        for(let x = 0; x < this.size.x; x++){
            for(let y = 0; y < this.size.y; y++){
                for(let z = 0; z < this.size.z; z++){
                    const v = this.getVoxel(new Vector3(x,y,z));
                    if(v){
                        out.push(v);
                    }
                }
            }
        }
        return out;
    }

    getSelectedArea(type: SelectedAreaType): VoxelObjectSelectedArea{
        return type==="static"? this.staticSelectedArea : this.dynamicSelectedArea;
    }

    getSelectedVoxelsCount(): number{
        const staticVoxelSet = this.staticSelectedArea.voxels;
        const dynamicVoxelSet = this.dynamicSelectedArea.voxels;
        const union = new Set(staticVoxelSet);
        for (const value of dynamicVoxelSet) {
            union.add(value);
        }
        return union.size;
    }

    /*
        If it's possible move each voxel in grid and selectedArea of given type in given direction
        delta should be in voxels
        eg. delta: Vector3(12,4,-2) means that each voxels will be move 12 voxels right, 4 voxels down and 2 voxels back
        returns true if such move is possible - each voxel would be moved to position withing voxel object
        returns false otherwise 
    */
    moveSelectedVoxelsAndArea(type: SelectedAreaType, delta: Vector3, axis?: "X" | "Y" | "Z" ): boolean{
        let out = true;
        const selectedArea = this.getSelectedArea(type);
        let refinedDelta = new Vector3(0,0,0);
        if(axis){
            refinedDelta = axis === 'X'? new Vector3(delta.x, 0,0) : axis === 'Y'? new Vector3(0,delta.y,0) : new Vector3(0,0,delta.z); 
        }else{
            refinedDelta = delta; 
        }

        selectedArea.voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr).addVector(refinedDelta);
            if(!this.voxelExists(v)){
                out = false;
            }
        })

        if(out){
            const newSelectedAreaVoxels = new Set<string>();
            selectedArea.voxels.forEach((vStr)=>{
                const v = Vector3.fromString(vStr)
                const vMoved = v.addVector(refinedDelta);
                const voxel = this.getVoxel(v);
                this.setVoxel(v, null);
                this.setVoxel(vMoved, voxel);
                newSelectedAreaVoxels.add(vMoved.toString());             
            })            

            if(selectedArea.voxels.size>0){
                selectedArea.voxels = newSelectedAreaVoxels;                
                this.#notifyOfSelectedAreaChange();
                this.#notifyOfVoxelsChange();
            }
        }

        return out;
    }

    moveSelectedArea(type: SelectedAreaType, delta: Vector3, axis?: "X" | "Y" | "Z"): boolean{
        let out = true;
        const selectedArea = this.getSelectedArea(type);
        let refinedDelta = new Vector3(0,0,0);
        if(axis){
            refinedDelta = axis === 'X'? new Vector3(delta.x, 0,0) : axis === 'Y'? new Vector3(0,delta.y,0) : new Vector3(0,0,delta.z); 
        }else{
            refinedDelta = delta; 
        }

        selectedArea.voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr).addVector(refinedDelta);
            if(!this.voxelExists(v)){
                out = false;
            }
        })

        if(out){
            const newSelectedAreaVoxels = new Set<string>();
            selectedArea.voxels.forEach((vStr)=>{
                const v = Vector3.fromString(vStr)
                const vMoved = v.addVector(refinedDelta);
                newSelectedAreaVoxels.add(vMoved.toString());             
            })            

            if(selectedArea.voxels.size>0){
                selectedArea.voxels = newSelectedAreaVoxels;                
                this.#notifyOfSelectedAreaChange();
            }
        }

        return out;        
    }

    moveGhostVoxels(delta: Vector3, axis?: "X" | "Y" | "Z"): boolean{
        let out = true;
        let refinedDelta = new Vector3(0,0,0);
        if(axis){
            refinedDelta = axis === 'X'? new Vector3(delta.x, 0,0) : axis === 'Y'? new Vector3(0,delta.y,0) : new Vector3(0,0,delta.z); 
        }else{
            refinedDelta = delta; 
        }

        this.ghostVoxels.forEach((_, gridPosStr)=>{
            const gridPosMoved = Vector3.fromString(gridPosStr).addVector(refinedDelta);
            if(!this.voxelExists(gridPosMoved)){
                out = false;
            }
        })

        if(out){
            const newGhostVoxels = new Map<string, Voxel>();
            this.ghostVoxels.forEach((v, gridPosStr)=>{
                //const v = Vector3.fromString(vStr)
                const gridPosMoved = Vector3.fromString(gridPosStr).addVector(refinedDelta);
                newGhostVoxels.set(gridPosMoved.toString(), {...v});         
            })            

            this.ghostVoxels = newGhostVoxels;
            if(newGhostVoxels.size>0){                                                
                this.#notifyOfVoxelsChange();
            }
        }

        return out;
    }

    /*
        Returns middle of selected area in voxel grid id
        middle is calculated as floor of the half beetwen min and max id in voxels (center of bounding box)
        if no voxels are selected in given area returns null
    */
    getSelectedAreaMiddle(type: SelectedAreaType): Vector3 | null{
        const selectedArea = this.getSelectedArea(type);
        if(selectedArea.voxels.size === 0 ) return null;

        const out = new Vector3(0,0,0);
        
        const min = new Vector3(this.size.x,this.size.y,this.size.z);
        const max = new Vector3(0,0,0);

        selectedArea.voxels.forEach((vStr)=>{
            const v = Vector3.fromString(vStr)
            if(v.x > max.x) max.x = v.x;
            if(v.y > max.y) max.y = v.y;
            if(v.z > max.z) max.z = v.z;

            if(v.x < min.x) min.x = v.x;
            if(v.y < min.y) min.y = v.y;
            if(v.z < min.z) min.z = v.z;
        })    

        out.x = Math.floor((min.x + max.x) / 2);
        out.y = Math.floor((min.y + max.y) / 2);
        out.z = Math.floor((min.z + max.z) / 2);
        
        return out;
    }

    // Checks whether grid voxel of given position is non-empty or is a ghost voxel
    isVoxelUsed(gridPosition: Vector3){
        return this.ghostVoxels.has(gridPosition.toString()) || this.isVoxelNonEmpty(gridPosition);
    }


}