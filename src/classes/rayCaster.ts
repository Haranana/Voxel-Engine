
import type { Matrix4 } from "../math/matrix4.type";
import type { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import { Vector4 } from "../math/vector4.type";
import type { Camera } from "./camera";
import { faceDirectionToVector, type FaceDirection, type VoxelObject } from "./voxelObject";

class Ray{
    direction: Vector3;
    origin: Vector3;
    constructor(origin: Vector3, direction: Vector3){
        this.origin = origin;
        this.direction = direction;
    }

    get(t: number) : Vector3{
        return this.origin.addVector(this.direction.multByScalar(t));
    }
}

/*
casts ray from given coordinates (in Model space) onto given voxel object and returns id of first-non empty voxel
and direction of the hit

if lastEmpty argument is true function returns last empty voxel before hit, otherwise it returns first non-empty voxel

if hitOnExit argument is true upon exiting bounding box without hitting any voxel the function will return last empty voxel hit,
otherwise it will return null
*/
export function getVoxelFromObject(camera: Camera, 
                            pointSs: Vector2, 
                            obj: VoxelObject,
                            canvasSize: Vector2,
                            objectTransformMatrix: Matrix4,  
                            ndcProjectionMatrix: Matrix4, 
                            cameraViewMatrix: Matrix4,
                            lastEmpty: boolean = true,
                            hitOnExit: boolean = true,
                            )
    : {voxelCoords: Vector3, hitDirection: FaceDirection} | null {
    
    const mvpInversion = ndcProjectionMatrix.multMatrix(cameraViewMatrix).multMatrix(objectTransformMatrix).getInversion();
    const EPS = 1e-6;
    /*
    const cameraPositionMs = new Vector3(
    ...objectTransformMatrix.getInversion().multVector(
        new Vector4(...camera.transform.translation.toArray4())
    ).toArray3());*/

    const xNdc = (2 * pointSs.x) / canvasSize.x - 1;
    const yNdc = 1 - (2 * pointSs.y) / canvasSize.y;

    const pointNearMs : Vector4 = mvpInversion.multVector(new Vector4(xNdc, yNdc, 0, 1));
    const pointFarMs: Vector4 = mvpInversion.multVector(new Vector4(xNdc, yNdc, 1, 1));

    const pointNearMsPersp : Vector3 = new Vector3(pointNearMs.x/pointNearMs.w, pointNearMs.y/pointNearMs.w, pointNearMs.z/pointNearMs.w);
    const pointFarMsPersp : Vector3 = new Vector3(pointFarMs.x/pointFarMs.w, pointFarMs.y/pointFarMs.w, pointFarMs.z/pointFarMs.w);

    const rayDirection: Vector3 = pointFarMsPersp.subVector(pointNearMsPersp).normalize();
    const rayOrigin: Vector3 = pointNearMsPersp;
    const voxelSize: number = obj.baseVoxelSize; 
    const ray: Ray = new Ray(rayOrigin, rayDirection);

    /*
    console.log(`
        Origin: ${ray.origin.toString()} |
        Direction: ${ray.direction.toString()} |
        Point pos (model space) : ${pointFarMsPersp.toString()} |
    `)  ;*/
    
    let currentRayT: number = 0;
    if(obj.getVoxelFromModelSpacePoint(ray.get(currentRayT))){
        return {voxelCoords: obj.pointCoordinatesToVexelId(ray.get(currentRayT)) , hitDirection: "PosX"};
    }

    const xSign : number = ray.direction.x == 0? 0 : ray.direction.x < 0? -1 : 1;
    const ySign : number = ray.direction.y == 0? 0 : ray.direction.y < 0? -1 : 1;
    const zSign : number = ray.direction.z == 0? 0 : ray.direction.z < 0? -1 : 1;

    const sign : Vector3 = new Vector3(
        xSign, ySign, zSign
    );



    //returns values of the first x,y,z of the next cell
    //assumes that voxelSize > 1 distance unit
    //returns null if sign for this dimension is 0
    const getNextVoxelX = (curX: number, xSign: number) : number | null =>{
        /*
        return xSign == 0? null : xSign==1? Math.ceil(curX/voxelSize)*voxelSize+voxelSize : Math.floor(curX/voxelSize)*voxelSize-1;
        */
       if(xSign==0) return null;
       const cell = Math.floor(curX/voxelSize);
       const nextBoundary = xSign > 0? (cell+1)*voxelSize : cell*voxelSize;
       return nextBoundary;
    }

    const getNextVoxelY = (curY: number, ySign: number) : number | null =>{
        /*
        return ySign == 0? null : ySign==1? Math.ceil(curY/voxelSize)*voxelSize+voxelSize : Math.floor(curY/voxelSize)*voxelSize-1;
        */
        if(ySign==0) return null;
        const cell = Math.floor(curY/voxelSize);
        const nextBoundary = ySign > 0? (cell+1)*voxelSize : cell*voxelSize;
        return nextBoundary;
    }

    const getNextVoxelZ = (curZ: number, zSign: number) : number | null=>{
        /*
        return zSign == 0? null : zSign==1? Math.ceil(curZ/voxelSize)*voxelSize+voxelSize : Math.floor(curZ/voxelSize)*voxelSize-1;
        */
               if(zSign==0) return null;
        const cell = Math.floor(curZ/voxelSize);
        const nextBoundary = zSign > 0? (cell+1)*voxelSize : cell*voxelSize;
        return nextBoundary;
    }

    //returns t for the next instance when ray reaches new cell
    const getNextT = (ray: Ray, t: number, sign : Vector3) : {minDelta: number, dir: FaceDirection}=>{
        const curRayValue = ray.get(t)
        const nextVoxelX : number | null = getNextVoxelX(curRayValue.x , sign.x);
        const nextVoxelY : number | null = getNextVoxelY(curRayValue.y, sign.y);
        const nextVoxelZ: number | null = getNextVoxelZ(curRayValue.z , sign.z);

            
        //const deltasT : number[] = [];
        let smallestDelta: number | null = null;
        let hitDimension : "X" | "Y" | "Z"  = "X";
        if(nextVoxelX!=null){
            const diff = nextVoxelX - curRayValue.x;
            const deltaT = diff/rayDirection.x;
            if(smallestDelta == null || smallestDelta > deltaT){
                smallestDelta = deltaT;
                hitDimension = "X";
            }                        
        }
        if(nextVoxelY!=null){
            const diff = nextVoxelY - curRayValue.y;
            const deltaT = diff/rayDirection.y;
            if(smallestDelta == null || smallestDelta > deltaT) {
                smallestDelta = deltaT;
                hitDimension = "Y";
            }            
        }
        if(nextVoxelZ!=null){
            const diff = nextVoxelZ - curRayValue.z;
            const deltaT = diff/rayDirection.z;
            if(smallestDelta == null || smallestDelta > deltaT){
                smallestDelta = deltaT;                
                hitDimension = "Z";
            } 
        }        
        
        let dir : FaceDirection;
        if(hitDimension === "X"){
            if(sign.x > 0){
                dir = "NegX";
            }else{
                dir = "PosX";
            }
        }else if(hitDimension === "Y"){
            if(sign.y > 0){
                dir = "NegY";
            }else{
                dir = "PosY";
            }
        }else{
            if(sign.z > 0){
                dir = "NegZ";
            }else{
                dir = "PosZ";
            }
        }
        
        //there shouldn't be any possible way for all signs to be 0 so it's assumed that tForNextVoxels is never empty at this point
        //const minT = Math.min(...deltasT);

        /*
        console.log(`[getNextT] finding delta beetwen 2 arguments of ray
            position before = ${curRayValue.toString()} |
            sign = ${sign} |
            voxelSize = ${voxelSize} |
            next (x,y,z) = (${nextVoxelX},${nextVoxelY},${nextVoxelZ})
            diffs (x,y,z) = (${nextVoxelX as number - curRayValue.x},${nextVoxelY as number - curRayValue.y},${nextVoxelZ as number - curRayValue.z})
            deltaT = (${minT})
            `);
        */
        return {minDelta: smallestDelta!, dir};
    }
    

    //later it will be modified to calculate only in bounding box
    //loop condition is temporary as safety
    //let enteredBoundingBox = false;
    let LastEmptyVoxel : Vector3 | null = null; 
    while( Math.abs(ray.get(currentRayT).z) < 10000){
        const nextVoxelBoundary  = getNextT(ray, currentRayT, sign);
        currentRayT += (nextVoxelBoundary.minDelta + EPS);

        const rayValue = ray.get(currentRayT)
        const voxelId = obj.pointCoordinatesToVexelId(rayValue);
        if(obj.voxelExists(voxelId) && obj.isVoxelNonEmpty(voxelId)){ //is in bb and hit non-empty voxel
            
            let result : {voxelCoords: Vector3, hitDirection: FaceDirection} | null = {voxelCoords: voxelId, hitDirection: nextVoxelBoundary.dir};
            if(lastEmpty) result.voxelCoords=result.voxelCoords.addVector(faceDirectionToVector(nextVoxelBoundary.dir));
            if(!obj.voxelExists(result.voxelCoords)) result = null
            return result;
            //const returnId = lastEmpty? obj.voxelExists(voxelId.addVector(faceDirectionToVector(nextVoxelBoundary.dir)))? 
            //voxelId.addVector(faceDirectionToVector(nextVoxelBoundary.dir)) : null : voxelId
            //return returnId==null? null : {voxelCoords: returnId!, hitDirection:  nextVoxelBoundary.dir};
        }else if(obj.voxelExists(voxelId)){ //is in bb and hit empty voxel
            LastEmptyVoxel = voxelId.copy();
            continue;
        }else if(LastEmptyVoxel!=null){ //was in boundingBox but exited it
            return hitOnExit? {voxelCoords: voxelId.addVector( (faceDirectionToVector(nextVoxelBoundary.dir))), hitDirection: nextVoxelBoundary.dir} : null;
        }else{ //yet to enter bb
            continue;
        }
    }

    return null;
}