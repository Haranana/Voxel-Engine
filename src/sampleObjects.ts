import { VoxelObject } from "./classes/voxelObject";
import { Vector3 } from "./math/vector3.type";
import { Vector4 } from "./math/vector4.type";

export function getBasicSampleVoxelObject(){
    const out: VoxelObject = new VoxelObject();
    out.setChunks(1,4);

    for(let x = 0; x < 4; x++){
        for(let y=0; y<4; y++){
            for(let z=0; z<4; z++){
                if(x==0 && y==0 && z==0) continue;
                out.chunks[0]!.setVoxel(new Vector3(x,y,z), {
                    color: new Vector4(160,230,140,255)
                })
            }
        }
    }

    out.rebuildMesh();
    return out;
}