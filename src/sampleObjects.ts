import { VoxelObject } from "./classes/voxelObject";
import { Vector3 } from "./math/vector3.type";
import { Vector4 } from "./math/vector4.type";
export const defaultColor: Vector4 = new Vector4(101, 204, 224,255);
export const debugPaintColor: Vector4 = new Vector4(190,90,90,255); 
export function getBasicSampleVoxelObject(){
    const out: VoxelObject = new VoxelObject(new Vector3(16,16,16));
    out.baseVoxelSize = 20;

    for(let x = 0; x < 16; x++){
        for(let y=0; y<16; y++){
            for(let z=0; z<16; z++){
                if(x==0 && y==0 && z==0) continue;
                out.setVoxel(new Vector3(x,y,z), {
                    color: defaultColor
                })
            }
        }
    }

    out.rebuildMesh();
    return out;
}