import { clamp } from "../math/utils";
import { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import { Vector4 } from "../math/vector4.type";
import { RenderableObject } from "./renderableObject";
import { copyVoxel, type Voxel } from "./voxel.type";

export type FaceDirection = 
| "PosX"
| "NegX"
| "PosY"
| "NegY"
| "PosZ"
| "NegZ"

//(0,0,0) of model space should be middle of the object
//for now without any chunk system or any other kind of optimization
//any cell inside VoxelObject may have object of type Voxel or be null
export class VoxelObject{
    
    //for now all voxels are stored simply as 3D array in VoxelObject
    //in fututre this will be replaced by more sophisticated methods
    voxels : (Voxel | null)[][][] = [[[]]];

    //selected voxels are of type string to ensure uniqueness by value
    //use Vector3.toString() and Vector3.fromString() for conversion
    selectedVoxels: Set<string> = new Set();
   
    //size of whole voxelObject
    size : Vector3 = new Vector3(0,0,0);
    
    //how much units in worldSpace should one voxel take in each dimension
    baseVoxelSize = 50;

    mesh: RenderableObject | null = null;
    voxelsModified = false
    highlightedVoxelColor: Vector4 = new Vector4(160, 130, 210, 255);
    highlightedVoxel: Vector3 | null = null;
    selectedVoxelColor: Vector4 =  new Vector4(160, 130, 210, 160);

    constructor(size: Vector3){
        this.size = size;
        this.voxels = Array.from({ length: size.x }, () =>
            Array.from({ length: size.y }, () =>
                Array.from({ length: size.z }, () => null)
            )
        );
    }

    shouldRebuildMesh(){
        return this.voxelsModified || !this.mesh;
    }

    //simple meshing with culling
    //in future probably add greedy meshing for exports
    rebuildMesh(){
        //console.log(`[rebuildMesh]`);
        const out: RenderableObject = new RenderableObject();
        const objectStart : Vector3 = new Vector3(-this.size.x/2 , -this.size.y/2, -this.size.z/2) 
        for(let x = 0; x < this.size.x; x++){
            for(let y = 0; y < this.size.y; y++){
                for(let z = 0; z < this.size.z; z++){
                    const currentVoxelCoords = new Vector3(x,y,z);
                    const currentVoxelNonEmpty = this.getVoxel(currentVoxelCoords) != null;
                    const currentVoxelSelected = this.selectedVoxels.has(currentVoxelCoords.toString());
                    const currentVoxelHighlighted = this.highlightedVoxel != null && this.highlightedVoxel.equals(currentVoxelCoords);
                    if(currentVoxelNonEmpty || currentVoxelSelected){
                        
                        const voxelStart = new Vector3( (objectStart.x +x)*this.baseVoxelSize , (objectStart.y+y)*this.baseVoxelSize, (objectStart.z+z)*this.baseVoxelSize);
                        const getThisVoxelColor = (v: Vector3)=>{
                            if(currentVoxelHighlighted){
                                return this.highlightedVoxelColor;
                            }else if(currentVoxelSelected){
                                return this.selectedVoxelColor
                            }else{
                                return this.getVoxel(v)!.color;
                            }
                        }
                        const voxelColor = getThisVoxelColor(currentVoxelCoords);
                        const voxelVertices : Map<string, Vector3> = new Map();
                        
                        voxelVertices.set("A" , voxelStart.addVector(new Vector3(0,0,this.baseVoxelSize)));
                        voxelVertices.set( "B" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,this.baseVoxelSize)));
                        voxelVertices.set( "C" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,this.baseVoxelSize)));
                        voxelVertices.set( "D" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,this.baseVoxelSize)));
                        voxelVertices.set( "E" , voxelStart.addVector(new Vector3(0,0,0)));
                        voxelVertices.set( "F" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,0)));
                        voxelVertices.set( "G" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,0)));
                        voxelVertices.set( "H" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,0)));
                        
                        //front culling
                        if(!this.getVoxel(new Vector3(x,y,z+1))){
                            const currentVoxelId : number = out.vertices.length 
                            out.vertices.push({
                                position: voxelVertices.get("A")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("B")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("C")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("D")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }
                        //back culling
                        if(!this.getVoxel(new Vector3(x,y,z-1))){
                            const currentVoxelId : number = out.vertices.length
                                                            out.vertices.push({
                                position: voxelVertices.get("F")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("E")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("H")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("G")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }
                        //top culling
                        if(!this.getVoxel(new Vector3(x,y-1,z))){
                            const currentVoxelId : number = out.vertices.length
                            out.vertices.push({
                                position: voxelVertices.get("E")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("F")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("B")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("A")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }
                        //bottom culling
                        if(!this.getVoxel(new Vector3(x,y+1,z))){
                            const currentVoxelId : number = out.vertices.length
                            out.vertices.push({
                                position: voxelVertices.get("D")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("C")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("G")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("H")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }
                        //left culling
                        if(!this.getVoxel(new Vector3(x-1,y,z))){
                            const currentVoxelId : number = out.vertices.length
                            out.vertices.push({
                                position: voxelVertices.get("E")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("A")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("D")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("H")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }
                        //right culling
                        if(!this.getVoxel(new Vector3(x+1,y,z))){
                            const currentVoxelId : number = out.vertices.length
                            out.vertices.push({
                                position: voxelVertices.get("B")!,
                                quadUV: new Vector2(0,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("F")!,
                                quadUV: new Vector2(1,0), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("G")!,
                                quadUV: new Vector2(1,1), 
                                color: voxelColor,
                            })
                            out.vertices.push({
                                position: voxelVertices.get("C")!,
                                quadUV: new Vector2(0,1), 
                                color: voxelColor,
                            })
                            out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                            out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                            out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                        }                                                       
                    }
                }
            }
        }
        console.log("[rebuildMesh] done")
        this.mesh = out;
        this.voxelsModified = false;
    }


    //receives point in this object model space
    //returns id of possible vexel in this object
    //whether any voxel exists under this id is unkown
    //assumes that (0,0,0) is in the middle of the object
    pointCoordinatesToVexelId(v: Vector3) : Vector3{
        
        const xCord :number = Math.floor(v.x/this.baseVoxelSize)+this.size.x/2;
        /*const yCord :number = this.size.y - Math.floor(v.x/this.baseVoxelSize)-this.size.y/2 - 1;*/
        const yCord :number = Math.floor(v.y/this.baseVoxelSize)+this.size.y/2;
        const zCord :number = Math.floor(v.z/this.baseVoxelSize)+this.size.z/2;
        const result = new Vector3(xCord, yCord, zCord);

        //console.log(`[pointCoordinatesToVexelId] chunkSize:${this.size} Conversion: ${v.toString()} => ${result.toString()}`)
        
        return result;
    }

    //receives voxel id
    //returns voxel copy or null if id is incorrect
    getVoxel(v: Vector3) : Voxel | null{
        const x = v.x;
        const y = v.y;
        const z = v.z;

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

    setVoxel(pos: Vector3, newVoxel: Voxel){
        try{
            this.voxels[pos.x][pos.y][pos.z] = newVoxel;
            this.voxelsModified = true;
            return true;
        }catch(e: any){
            return false;
        }
    }

    highlightVoxel(pos: Vector3): boolean{
        if(this.highlightedVoxel != null && this.highlightedVoxel.equals(pos)) {
            return false;
        }

        if(this.isVoxelNonEmpty(pos)){
            this.highlightedVoxel = pos.copy();
            this.voxelsModified = true;
            return true;
        }else{
            return false;
        }
    }

    clearHighlight(){
        if(this.highlightedVoxel == null){
            this.highlightedVoxel = null;
            this.voxelsModified = true;
        }
    }

    resetSelect(){
        if(this.selectedVoxels.size>0){
            this.selectedVoxels.clear();
            this.voxelsModified = true;
        }
    }

    //adds voxel of given coordinates to set of selected voxels
    //returns true if successfuly added or if voxel was already selected
    //returns false if voxel doesn't exist
    selectVoxel(v: Vector3): boolean{
        console.log(`[selectVoxel] select request for ${v.toString()}`)
        if(this.voxelExists(v)){
            this.resetSelect();
            this.selectedVoxels.add(v.toString());
            this.voxelsModified = true;
            return true;
        }else{
            return false;
        }
    }

    //adds voxels of the same face as starting voxel of given coordinates
    //returns true if successfuly added or if all voxels were already selected
    //returns false if starting voxel doesn't exist
    selectFace(v: Vector3, dir: FaceDirection): boolean{
        console.log(`[selectFace] select face for ${v.toString()} | ${dir}`)
        if(!this.voxelExists(v)) {
            return false;
        }
        this.resetSelect();
        this.#selectFaceRecursion(v, dir);
        this.voxelsModified = true;
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

    #voxelNeighborsCoords(v: Vector3, dir: FaceDirection): Vector3[]{
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

    #selectFaceRecursion(v: Vector3, dir: FaceDirection){
        if(this.selectedVoxels.has(v.toString())) return;
        
        const possiblyBlockingVoxelCoords = this.#blockingVoxelCoords(v , dir);
        const isCurrentVoxelOnSurface = this.isVoxelEmpty(possiblyBlockingVoxelCoords) || !this.voxelExists(possiblyBlockingVoxelCoords);
        if(isCurrentVoxelOnSurface) return;
        this.selectedVoxels.add(v.toString());

        this.#voxelNeighborsCoords(v, dir).forEach((vs)=>{
            this.#selectFaceRecursion(vs, dir);
        });
    }

    selectCube(vStart: Vector3, vEnd: Vector3): boolean{
        //console.log(`[selectCube] select cube for ${vStart.toString()} : ${vEnd.toString()}`)
        if(!this.voxelExists(vStart)) return false;
        //console.log(`[voxelObject-selectCube] vStart: ${vStart} , vEnd: ${vEnd}`)
        this.resetSelect();
        const clampedEnd = new Vector3(clamp({value: vEnd.x, min: 0 ,max: this.size.x-1 }), 
                                clamp({value: vEnd.y, min: 0 ,max: this.size.y-1 }),
                                clamp({value: vEnd.z, min: 0 ,max: this.size.z-1}));
       
        const correctedVStart = new Vector3(Math.min(vStart.x, clampedEnd.x),
                                            Math.min(vStart.y, clampedEnd.y),
                                            Math.min(vStart.z, clampedEnd.z));
        const correctedVEnd = new Vector3(Math.max(vStart.x, clampedEnd.x),
                                            Math.max(vStart.y, clampedEnd.y),
                                            Math.max(vStart.z, clampedEnd.z));    
                                            
          /*                                  
        const correctedVStart = vStart;
        const correctedVEnd = clampedEnd;
        */
       
        for(let x: number = correctedVStart.x; x <= correctedVEnd.x; x++){
            for(let y: number = correctedVStart.y; y <= correctedVEnd.y; y++){
                for(let z: number = correctedVStart.z; z <= correctedVEnd.z; z++){
                    this.selectedVoxels.add(new Vector3(x,y,z).toString());
                }
            }
        }
        this.voxelsModified = true;
        return true;
    }

    //receives point in this object model space
    //return copy of voxel in those coordinates or null if there's none
    getVoxelFromModelSpacePoint(v: Vector3) : Voxel | null{
        return this.getVoxel(this.pointCoordinatesToVexelId(v));
    }

    copy() : VoxelObject{
        const out: VoxelObject = new VoxelObject(this.size);
        out.voxels = this.voxels.map(layer =>
            layer.map(row =>
                row.map(voxel => voxel ? { ...voxel } : null)
            )
        );
        out.baseVoxelSize = this.baseVoxelSize;
        out.mesh = this.mesh;
        out.voxelsModified = this.voxelsModified;

        out.selectedVoxels = this.selectedVoxels;
        out.highlightedVoxel = this.highlightedVoxel;
        out.selectedVoxelColor = this.selectedVoxelColor;
        out.highlightedVoxelColor = this.highlightedVoxelColor;
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
}