import { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import { Vector4 } from "../math/vector4.type";
import { RenderableObject } from "./renderableObject";
import { copyVoxel, type Voxel } from "./voxel.type";

//(0,0,0) of model space should be middle of the object
//for now without any chunk system or any other kind of optimization
//any cell inside VoxelObject may have object of type Voxel or be null
export class VoxelObject{
    
    voxels : (Voxel | null)[][][] = [[[]]];
   
    size : Vector3 = new Vector3(0,0,0);
    baseVoxelSize = 50;

    mesh: RenderableObject | null = null;
    voxelsModified = false

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
        console.log(`[rebuildMesh]`);
        const out: RenderableObject = new RenderableObject();
        const objectStart : Vector3 = new Vector3(-this.size.x/2 , -this.size.y/2, -this.size.z/2) 
        for(let x = 0; x < this.size.x; x++){
            for(let y = 0; y < this.size.y; y++){
                for(let z = 0; z < this.size.z; z++){
                    if(this.getVoxel(new Vector3(x,y,z))){
                        
                        const voxelStart = new Vector3( (objectStart.x +x)*this.baseVoxelSize , (objectStart.y+y)*this.baseVoxelSize, (objectStart.z+z)*this.baseVoxelSize);
                        const voxelColor = this.getVoxel(new Vector3(x,y,z))!.color;
                        const voxelVertices : Map<string, Vector3> = new Map();
                        
                        voxelVertices.set("A" , voxelStart.addVector(new Vector3(0,0,this.baseVoxelSize)));
                        voxelVertices.set( "B" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,this.baseVoxelSize)));
                        voxelVertices.set( "C" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,this.baseVoxelSize)));
                        voxelVertices.set( "D" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,this.baseVoxelSize)));
                        voxelVertices.set( "E" , voxelStart.addVector(new Vector3(0,0,0)));
                        voxelVertices.set( "F" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,0)));
                        voxelVertices.set( "G" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,0)));
                        voxelVertices.set( "H" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,0)));
                        

                        /*
                        const halfVoxel = this.baseVoxelSize/2;

                        voxelVertices.set("A" , voxelStart.addVector(new Vector3(-halfVoxel,-halfVoxel,halfVoxel)));
                        voxelVertices.set( "B" , voxelStart.addVector(new Vector3(halfVoxel,-halfVoxel,halfVoxel)));
                        voxelVertices.set( "C" , voxelStart.addVector(new Vector3(halfVoxel,halfVoxel,halfVoxel)));
                        voxelVertices.set( "D" , voxelStart.addVector(new Vector3(-halfVoxel,halfVoxel,halfVoxel)));
                        voxelVertices.set( "E" , voxelStart.addVector(new Vector3(-halfVoxel,-halfVoxel,-halfVoxel)));
                        voxelVertices.set( "F" , voxelStart.addVector(new Vector3(halfVoxel,-halfVoxel,-halfVoxel)));
                        voxelVertices.set( "G" , voxelStart.addVector(new Vector3(halfVoxel,halfVoxel,-halfVoxel)));
                        voxelVertices.set( "H" , voxelStart.addVector(new Vector3(-halfVoxel,halfVoxel,-halfVoxel)));
                        */

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
        this.mesh = out;
        this.voxelsModified = false;
    }


    //receives point in this object model space
    //returns id of possible vexel in this object
    //whether any vexel exists under this id is unkown
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
        return out;
    }

}