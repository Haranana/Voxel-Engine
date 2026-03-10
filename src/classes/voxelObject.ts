import { Vector3 } from "../math/vector3.type";
import { Chunk } from "./chunk";
import { RenderableObject } from "./renderableObject";

export class VoxelObject{
    
    /*
        chunks are sorted asc by x->y->-z
        so for example for A={x:0-16 y:0-16 z:(-32)-(-16)} B={x:0-16 y:0-16 z:(-32)-(-16)}
    */
    chunks: Chunk[] = []

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

        this.chunks.forEach(chunk =>{
            const chunkOffset = chunk.chunkOffset;
            for(let x = 0; x < chunk.size.x; x++){
                for(let y = 0; y < chunk.size.y; y++){
                    for(let z = 0; x < chunk.size.z; z++){
                        if(chunk.getVoxel(new Vector3(x,y,z))){
                            const currentVoxelId : number = out.vertices.length/3 


                            const voxelStart = new Vector3(x+chunkOffset.x,y+chunkOffset.y,z+chunkOffset.z);
                            const A = voxelStart.addVector(new Vector3(0,0,1));
                            const B = voxelStart.addVector(new Vector3(1,0,1));
                            const C = voxelStart.addVector(new Vector3(1,1,1));
                            const D = voxelStart.addVector(new Vector3(0,1,1));
                            const E = voxelStart.addVector(new Vector3(0,0,0));
                            const F = voxelStart.addVector(new Vector3(1,0,0));
                            const G = voxelStart.addVector(new Vector3(1,1,0));
                            const H = voxelStart.addVector(new Vector3(0,1,0));

                            const front1 = [currentVoxelId, currentVoxelId+1, currentVoxelId+2];
                            const front2 = [currentVoxelId+2, currentVoxelId+3, currentVoxelId]

                            const back1 = [currentVoxelId+5, currentVoxelId+4, currentVoxelId+7];
                            const back2 = [currentVoxelId+7, currentVoxelId+6, currentVoxelId+5];

                            const top1 = [currentVoxelId+4, currentVoxelId+5, currentVoxelId+1];
                            const top2 = [currentVoxelId+1, currentVoxelId, currentVoxelId+4]

                            const bottom1 = [currentVoxelId+3, currentVoxelId+2, currentVoxelId+6];
                            const bottom2 = [currentVoxelId+6, currentVoxelId+7, currentVoxelId+3];

                            const left1 = [currentVoxelId+4, currentVoxelId, currentVoxelId+3];
                            const left2 = [currentVoxelId+3, currentVoxelId+7, currentVoxelId+4];

                            const right1 = [currentVoxelId+1, currentVoxelId+5, currentVoxelId+6];
                            const right2 = [currentVoxelId+6, currentVoxelId+2, currentVoxelId+1];

                            out.vertices.push(A.x,A.y,A.z);
                            out.vertices.push(B.x,B.y,B.z);
                            out.vertices.push(C.x,C.y,C.z);
                            out.vertices.push(D.x,D.y,D.z);
                            out.vertices.push(E.x,E.y,E.z);
                            out.vertices.push(F.x,F.y,F.z);
                            out.vertices.push(G.x,G.y,G.z);
                            out.vertices.push(H.x,H.y,H.z);

                            for(let i = 0; i<8; i++){
                                out.colors.push(230,230,250);
                            }

                            out.indices.push(...front1, ...front2, ...back1, ...back2, ...top1, ...top2, ...bottom1, ...bottom2, ...left1, ...left2, ...right1, ...right2);
                            
                        }
                    }
                }
            }

        })
    }
}