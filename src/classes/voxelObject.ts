import { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import { Vector4 } from "../math/vector4.type";
import { Chunk, type ChunkValidationResult } from "./chunk";
import { RenderableObject, type Vertex } from "./renderableObject";
import type { Voxel } from "./voxel.type";

export class VoxelObject{
    
    /*
        chunks are sorted asc by x->y->-z
        so for example for A={x:0-16 y:0-16 z:(-32)-(-16)} B={x:0-16 y:0-16 z:(-32)-(-16)}
    */
    chunks: Chunk[] = [];
    baseVoxelSize = 50;

    mesh: RenderableObject | null = null;
    chunksUpdated = false

    //for now its supposed that chunks are power of 2 and they are cubes, later to change to more universal
    //also for now theyare just put in a list alongside x axis
    setChunks(chunksNum: number, chunksSize: number){
        for(let i=0; i<chunksNum; i++){
            const newChunk = new Chunk();
            newChunk.setSize(chunksSize);
            newChunk.setChunkOffset(new Vector3(chunksSize,0,0));
            this.chunks.push(newChunk);
        }
    }

    shouldRebuildMesh(){
        return this.chunksUpdated || !this.mesh;
    }

    rebuildMesh(){

        const out: RenderableObject = new RenderableObject();
        //console.log("chunks: " , this.chunks.length, " | size: " , this.chunks[0]!.size)
        this.chunks.forEach(chunk =>{
            const chunkOffset = chunk.chunkOffset;
            for(let x = 0; x < chunk.size.x; x++){
                for(let y = 0; y < chunk.size.y; y++){
                    for(let z = 0; z < chunk.size.z; z++){
                        if(chunk.getVoxel(new Vector3(x,y,z))){
                            
                            const voxelStart = new Vector3(this.baseVoxelSize*x+chunkOffset.x,this.baseVoxelSize*y+chunkOffset.y,this.baseVoxelSize*z+chunkOffset.z);
                            const voxelVertices : Map<string, Vector3> = new Map();
                            /*
                            voxelVertices.set("A" , voxelStart.addVector(new Vector3(0,0,this.baseVoxelSize)));
                            voxelVertices.set( "B" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,this.baseVoxelSize)));
                            voxelVertices.set( "C" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,this.baseVoxelSize)));
                            voxelVertices.set( "D" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,this.baseVoxelSize)));
                            voxelVertices.set( "E" , voxelStart.addVector(new Vector3(0,0,0)));
                            voxelVertices.set( "F" , voxelStart.addVector(new Vector3(this.baseVoxelSize,0,0)));
                            voxelVertices.set( "G" , voxelStart.addVector(new Vector3(this.baseVoxelSize,this.baseVoxelSize,0)));
                            voxelVertices.set( "H" , voxelStart.addVector(new Vector3(0,this.baseVoxelSize,0)));
                            */
                            const halfVoxel = this.baseVoxelSize/2;

                            voxelVertices.set("A" , voxelStart.addVector(new Vector3(-halfVoxel,-halfVoxel,halfVoxel)));
                            voxelVertices.set( "B" , voxelStart.addVector(new Vector3(halfVoxel,-halfVoxel,halfVoxel)));
                            voxelVertices.set( "C" , voxelStart.addVector(new Vector3(halfVoxel,halfVoxel,halfVoxel)));
                            voxelVertices.set( "D" , voxelStart.addVector(new Vector3(-halfVoxel,halfVoxel,halfVoxel)));
                            voxelVertices.set( "E" , voxelStart.addVector(new Vector3(-halfVoxel,-halfVoxel,-halfVoxel)));
                            voxelVertices.set( "F" , voxelStart.addVector(new Vector3(halfVoxel,-halfVoxel,-halfVoxel)));
                            voxelVertices.set( "G" , voxelStart.addVector(new Vector3(halfVoxel,halfVoxel,-halfVoxel)));
                            voxelVertices.set( "H" , voxelStart.addVector(new Vector3(-halfVoxel,halfVoxel,-halfVoxel)));

                            //front culling
                            if(!chunk.getVoxel(new Vector3(x,y,z+1))){
                                const currentVoxelId : number = out.vertices.length 
                                out.vertices.push({
                                    position: voxelVertices.get("A")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("B")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("C")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("D")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }
                            //back culling
                            if(!chunk.getVoxel(new Vector3(x,y,z-1))){
                                const currentVoxelId : number = out.vertices.length
                                                                out.vertices.push({
                                    position: voxelVertices.get("F")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("E")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("H")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("G")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                               out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }
                            //top culling
                            if(!chunk.getVoxel(new Vector3(x,y-1,z))){
                                const currentVoxelId : number = out.vertices.length
                                out.vertices.push({
                                    position: voxelVertices.get("E")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("F")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("B")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("A")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                               out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }
                            //bottom culling
                            if(!chunk.getVoxel(new Vector3(x,y+1,z))){
                                const currentVoxelId : number = out.vertices.length
                                out.vertices.push({
                                    position: voxelVertices.get("D")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("C")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("G")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("H")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }
                            //left culling
                            if(!chunk.getVoxel(new Vector3(x-1,y,z))){
                                const currentVoxelId : number = out.vertices.length
                                out.vertices.push({
                                    position: voxelVertices.get("E")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("A")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("D")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("H")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }
                            //right culling
                            if(!chunk.getVoxel(new Vector3(x+1,y,z))){
                                const currentVoxelId : number = out.vertices.length
                                out.vertices.push({
                                    position: voxelVertices.get("B")!,
                                    quadUV: new Vector2(0,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("F")!,
                                    quadUV: new Vector2(1,0), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("G")!,
                                    quadUV: new Vector2(1,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.vertices.push({
                                    position: voxelVertices.get("C")!,
                                    quadUV: new Vector2(0,1), 
                                    color: new Vector4(200,70,200,255),
                                })
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                            }                                                       
                        }
                    }
                }
            }

        })

        //console.log(`New mesh data: | lines: ${out.linesIndices.length/2} | triangles: ${out.trianglesIndices.length/3} | quads: ${out.quadsIndices.length/8} | vertices: ${out.vertices.length/3}`);
        this.mesh = out;
    }

    //all those functions for now work only for 1 chunk

    //receives point in this object model space
    //returns id of possible vexel in this object
    //whether any vexel exists under this id is unkown
    //assumes that (0,0,0) is in the middle of the object
    
    pointCoordinatesToVexelId(v: Vector3) : Vector3{
        
        const xCord :number = Math.floor(v.x/this.baseVoxelSize)+this.chunks[0].size.x/2;
        const yCord :number = this.chunks[0].size.y - Math.floor(v.x/this.baseVoxelSize)-this.chunks[0].size.y/2 - 1;
        const zCord :number = Math.floor(v.z/this.baseVoxelSize)+this.chunks[0].size.z/2;
        const result = new Vector3(xCord, yCord, zCord);
        console.log(`[pointCoordinatesToVexelId] chunkSize:${this.chunks[0].size} Conversion: ${v.toString()} => ${result.toString()}`)
        
        return result;
    }

    //receives voxel id
    //returns voxel copy or null if id is incorrect
    getVoxel(v: Vector3) : Voxel | null{
        const chunk = this.chunks[0];
        return chunk.getVoxel(v);
    }

    //receives point in this object model space
    //return copy of voxel in those coordinates or null if there's none
    getVoxelFromPoint(v: Vector3) : Voxel | null{
        return this.getVoxel(this.pointCoordinatesToVexelId(v));
    }

    areChunksValid() : ChunkValidationResult{
        return this.chunks[0].isChunkValid();
    }


}