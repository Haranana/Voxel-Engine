import { Vector3 } from "../math/vector3.type";
import { copyVoxel, type Voxel } from "./voxel.type";

export type ChunkValidationResult = {
    isValid: boolean;
    errors: string[];
};


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

    getVoxel(chunkPos: Vector3): Voxel | null {
        const x = chunkPos.x;
        const y = chunkPos.y;
        const z = chunkPos.z;

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


    isChunkValid(
        
    ): ChunkValidationResult {
        const voxels = this.voxels;
        const expectedSize = this.size;
        const errors: string[] = [];

        if (!Array.isArray(voxels)) {
            return {
                isValid: false,
                errors: ["voxels is not an array"],
            };
        }

        if (expectedSize && voxels.length !== expectedSize.x) {
            errors.push(
                `voxels length is ${voxels.length}, expected ${expectedSize.x}`
            );
        }

        for (let x = 0; x < voxels.length; x++) {
            const xLayer = voxels[x];

            if (!Array.isArray(xLayer)) {
                errors.push(`voxels[${x}] is not an array`);
                continue;
            }

            if (expectedSize && xLayer.length !== expectedSize.y) {
                errors.push(
                    `voxels[${x}] length is ${xLayer.length}, expected ${expectedSize.y}`
                );
            }

            for (let y = 0; y < xLayer.length; y++) {
                const yLayer = xLayer[y];

                if (!Array.isArray(yLayer)) {
                    errors.push(`voxels[${x}][${y}] is not an array`);
                    continue;
                }

                if (expectedSize && yLayer.length !== expectedSize.z) {
                    errors.push(
                        `voxels[${x}][${y}] length is ${yLayer.length}, expected ${expectedSize.z}`
                    );
                }

                for (let z = 0; z < yLayer.length; z++) {
                    const voxel = yLayer[z];

                    if (!(voxel === null || ( "color" in voxel ))) {
                        errors.push(
                            `voxels[${x}][${y}][${z}] is invalid; expected null or Vector3-like object`
                        );
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}