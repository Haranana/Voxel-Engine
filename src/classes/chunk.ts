import { Vector3 } from "../math/vector3.type";
import { copyVoxel, type Voxel } from "./voxel.type";

export class Chunk{
    voxels : (Voxel | null)[][][] = [[[]]];
    toRemesh : boolean = false;
    size : Vector3 = new Vector3(0,0,0);

    //distance from the beginning of the scene
    //eg. if each chunk in object is 16x16x16 and its 3rd on the x, 2nd on the y and 4th on the z it would be:
    // (3*16,2*16,4*16)
    chunkOffset: Vector3 = new Vector3(0,0,0);

    setChunkOffset(newChunkOffser: Vector3){
        this.chunkOffset = newChunkOffser;
    }

    getVoxel(chunkPos: Vector3): Voxel | null{
        try{
            const chosenVoxel = this.voxels[chunkPos.x][chunkPos.y][chunkPos.z];
            return chosenVoxel? copyVoxel(chosenVoxel) : null;
        }catch(e: any){
            return null
        }
    }

    setVoxel(pos: Vector3, newVoxel: Voxel){
        try{
            this.voxels[pos.x][pos.y][pos.z] = newVoxel;
            return true;
        }catch(e: any){
            return false;
        }
    }

    setSize(newSize: number) {
        this.size = new Vector3(newSize, newSize, newSize);
        this.voxels = Array.from({ length: newSize }, () =>
            Array.from({ length: newSize }, () =>
                Array.from({ length: newSize }, () => null)
            )
        );
    }
}