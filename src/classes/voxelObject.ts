import { Vector3 } from "../math/vector3.type";
import { Chunk } from "./chunk";
import { RenderableObject } from "./renderableObject";

export class VoxelObject{
    
    /*
        chunks are sorted asc by x->y->-z
        so for example for A={x:0-16 y:0-16 z:(-32)-(-16)} B={x:0-16 y:0-16 z:(-32)-(-16)}
    */
    chunks: Chunk[] = [];
    baseVoxelSize = 10;

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
        console.log("chunks: " , this.chunks.length, " | size: " , this.chunks[0]!.size)
        this.chunks.forEach(chunk =>{
            const chunkOffset = chunk.chunkOffset;
            for(let x = 0; x < chunk.size.x; x++){
                for(let y = 0; y < chunk.size.y; y++){
                    for(let z = 0; z < chunk.size.z; z++){
                        if(chunk.getVoxel(new Vector3(x,y,z))){
                            
                            const voxelStart = new Vector3(this.baseVoxelSize*x+chunkOffset.x,this.baseVoxelSize*y+chunkOffset.y,this.baseVoxelSize*z+chunkOffset.z);
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
                            if(!chunk.getVoxel(new Vector3(x,y,z+1))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("A")!.toArray3());
                                out.vertices.push(...voxelVertices.get("B")!.toArray3());
                                out.vertices.push(...voxelVertices.get("C")!.toArray3());
                                out.vertices.push(...voxelVertices.get("D")!.toArray3());
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }
                            //back culling
                            if(!chunk.getVoxel(new Vector3(x,y,z-1))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("F")!.toArray3());
                                out.vertices.push(...voxelVertices.get("E")!.toArray3());
                                out.vertices.push(...voxelVertices.get("H")!.toArray3());
                                out.vertices.push(...voxelVertices.get("G")!.toArray3());
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                               out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }
                            //top culling
                            if(!chunk.getVoxel(new Vector3(x,y-1,z))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("E")!.toArray3());
                                out.vertices.push(...voxelVertices.get("F")!.toArray3());
                                out.vertices.push(...voxelVertices.get("B")!.toArray3());
                                out.vertices.push(...voxelVertices.get("A")!.toArray3());
                                out.trianglesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId);
                                                               out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }
                            //bottom culling
                            if(!chunk.getVoxel(new Vector3(x,y+1,z))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("D")!.toArray3());
                                out.vertices.push(...voxelVertices.get("C")!.toArray3());
                                out.vertices.push(...voxelVertices.get("G")!.toArray3());
                                out.vertices.push(...voxelVertices.get("H")!.toArray3());
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }
                            //left culling
                            if(!chunk.getVoxel(new Vector3(x-1,y,z))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("E")!.toArray3());
                                out.vertices.push(...voxelVertices.get("A")!.toArray3());
                                out.vertices.push(...voxelVertices.get("D")!.toArray3());
                                out.vertices.push(...voxelVertices.get("H")!.toArray3());
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }
                            //right culling
                            if(!chunk.getVoxel(new Vector3(x+1,y,z))){
                                const currentVoxelId : number = out.vertices.length/3 
                                out.vertices.push(...voxelVertices.get("B")!.toArray3());
                                out.vertices.push(...voxelVertices.get("F")!.toArray3());
                                out.vertices.push(...voxelVertices.get("G")!.toArray3());
                                out.vertices.push(...voxelVertices.get("C")!.toArray3());
                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                                                out.linesIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId, currentVoxelId+2, currentVoxelId+3,currentVoxelId+3, currentVoxelId );
                                out.quadsIndices.push(currentVoxelId, currentVoxelId+1, currentVoxelId+1, currentVoxelId+2, currentVoxelId+2, currentVoxelId+3, currentVoxelId+3, currentVoxelId);
                                out.colors.push(200,70,200,200,70,200,200,70,200,200,70,200);
                            }                                                       
                        }
                    }
                }
            }

        })

        console.log(`New mesh data: | lines: ${out.linesIndices.length/2} | triangles: ${out.trianglesIndices.length/3} | quads: ${out.quadsIndices.length/4} | vertices: ${out.vertices.length/3}`);
        this.mesh = out;
    }
}