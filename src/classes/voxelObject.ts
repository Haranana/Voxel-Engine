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
                            const currentVoxelId : number = out.vertices.length/3 
                            const voxelStart = new Vector3(this.baseVoxelSize*x+chunkOffset.x,this.baseVoxelSize*y+chunkOffset.y,this.baseVoxelSize*z+chunkOffset.z);
                            const verticesToAdd : Set<string> = new Set();
                            const facesToAdd : Set<"front" | "back" | "top" | "bottom" | "left" | "right"> = new Set();

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
                                verticesToAdd.add("A");
                                verticesToAdd.add("B");
                                verticesToAdd.add("C");
                                verticesToAdd.add("D");
                                facesToAdd.add("front");
                            }
                            //back culling
                            if(!chunk.getVoxel(new Vector3(x,y,z-1))){
                                verticesToAdd.add("E");
                                verticesToAdd.add("F");
                                verticesToAdd.add("G");
                                verticesToAdd.add("H");
                                facesToAdd.add("back");
                            }
                            //top culling
                            if(!chunk.getVoxel(new Vector3(x,y-1,z))){
                                verticesToAdd.add("A");
                                verticesToAdd.add("B");
                                verticesToAdd.add("E");
                                verticesToAdd.add("F");
                                facesToAdd.add("top");
                            }
                            //bottom culling
                            if(!chunk.getVoxel(new Vector3(x,y+1,z))){
                                verticesToAdd.add("C");
                                verticesToAdd.add("D");
                                verticesToAdd.add("G");
                                verticesToAdd.add("H");
                                facesToAdd.add("bottom");
                            }
                            //left culling
                            if(!chunk.getVoxel(new Vector3(x-1,y,z))){
                                verticesToAdd.add("A");
                                verticesToAdd.add("D");
                                verticesToAdd.add("E");
                                verticesToAdd.add("H");
                                facesToAdd.add("left");
                            }
                            //right culling
                            if(!chunk.getVoxel(new Vector3(x+1,y,z))){
                                verticesToAdd.add("B");
                                verticesToAdd.add("C");
                                verticesToAdd.add("F");
                                verticesToAdd.add("G");
                                facesToAdd.add("right");
                            }

                            const verticesAndIndexOffset : Map<string, number>= new Map()
                            let indexOffset = currentVoxelId;
                            verticesToAdd.forEach(v => {
                                verticesAndIndexOffset.set(v, indexOffset)
                                indexOffset++;
                                out.colors.push(230,230,250);
                                out.vertices.push(...voxelVertices.get(v)!.toArray3());
                            });

                            facesToAdd.forEach(face=>{
                                if(face=="front"){
                                    const front1 : number[] = [verticesAndIndexOffset.get("A")!, verticesAndIndexOffset.get("B")!, verticesAndIndexOffset.get("C")!];
                                    const front2 = [verticesAndIndexOffset.get("C")!, verticesAndIndexOffset.get("D")!, verticesAndIndexOffset.get("A")!];
                                    out.indices.push(...front1, ...front2);
                                }else if(face=="back"){
                                    const back1 = [verticesAndIndexOffset.get("F")!, verticesAndIndexOffset.get("E")!, verticesAndIndexOffset.get("H")!];
                                    const back2 = [verticesAndIndexOffset.get("H")!, verticesAndIndexOffset.get("G")!, verticesAndIndexOffset.get("F")!];
                                    out.indices.push(...back1, ...back2);
                                }else if(face=="top"){
                                    const top1 = [verticesAndIndexOffset.get("E")!, verticesAndIndexOffset.get("F")!, verticesAndIndexOffset.get("B")!];
                                    const top2 = [verticesAndIndexOffset.get("B")!, verticesAndIndexOffset.get("A")!, verticesAndIndexOffset.get("E")!];
                                    out.indices.push(...top1, ...top2);
                                }else if(face=="bottom"){
                                    const bottom1 = [verticesAndIndexOffset.get("D")!, verticesAndIndexOffset.get("C")!, verticesAndIndexOffset.get("G")!];
                                    const bottom2 = [verticesAndIndexOffset.get("G")!, verticesAndIndexOffset.get("H")!, verticesAndIndexOffset.get("D")!];
                                    out.indices.push(...bottom1, ...bottom2);
                                }else if(face=="left"){
                                    const left1 = [verticesAndIndexOffset.get("E")!, verticesAndIndexOffset.get("A")!, verticesAndIndexOffset.get("D")!];
                                    const left2 = [verticesAndIndexOffset.get("D")!, verticesAndIndexOffset.get("H")!, verticesAndIndexOffset.get("E")!];
                                    out.indices.push(...left1, ...left2);
                                }else if(face=="right"){
                                    const right1 = [verticesAndIndexOffset.get("B")!, verticesAndIndexOffset.get("F")!, verticesAndIndexOffset.get("G")!];
                                    const right2 = [verticesAndIndexOffset.get("G")!, verticesAndIndexOffset.get("C")!, verticesAndIndexOffset.get("B")!];
                                    out.indices.push(...right1, ...right2);
                                }
                            });//[A0 - B1 - C2- D3 - E4 -F5 -G6- H7]
                        }
                    }
                }
            }

        })

        console.log(`New mesh data: | indices: ${out.indices.length} | vertices: ${out.vertices.length}`);
        this.mesh = out;
    }
}