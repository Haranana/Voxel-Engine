export type PickingInteraction =
| 'miss'
| 'CameraGizmoPosX'
| 'CameraGizmoNegX'
| 'CameraGizmoPosY'
| 'CameraGizmoNegY'
| 'CameraGizmoPosZ'
| 'CameraGizmoNegZ'
| 'MoveGizmoX'
| 'MoveGizmoY'
| 'MoveGizmoZ'
| 'ResizeGizmoPosX'
| 'ResizeGizmoNegX'
| 'ResizeGizmoPosY'
| 'ResizeGizmoNegY'
| 'ResizeGizmoPosZ'
| 'ResizeGizmoNegZ'
| 'RotateGizmoPosX'
| 'RotateGizmoNegX'
| 'RotateGizmoPosY'
| 'RotateGizmoNegY'
| 'RotateGizmoPosZ'
| 'RotateGizmoNegZ'

export const pickingInteractions: ReadonlyMap<number, PickingInteraction> = new Map([
    [0,  "miss"],

    [1,  "CameraGizmoPosX"],
    [2,  "CameraGizmoNegX"],
    [3,  "CameraGizmoPosY"],
    [4,  "CameraGizmoNegY"],
    [5,  "CameraGizmoPosZ"],
    [6,  "CameraGizmoNegZ"],

    [7,  "MoveGizmoX"],
    [8,  "MoveGizmoY"],
    [9,  "MoveGizmoZ"],


    [13, "ResizeGizmoPosX"],
    [14, "ResizeGizmoNegX"],
    [15, "ResizeGizmoPosY"],
    [16, "ResizeGizmoNegY"],
    [17, "ResizeGizmoPosZ"],
    [18, "ResizeGizmoNegZ"],

    [19, "RotateGizmoPosX"],
    [20, "RotateGizmoNegX"],
    [21, "RotateGizmoPosY"],
    [22, "RotateGizmoNegY"],
    [23, "RotateGizmoPosZ"],
    [24, "RotateGizmoNegZ"],
]);

export function getPickingInteractionId(interaction: PickingInteraction): undefined{
    let out: number | undefined = undefined
    pickingInteractions.forEach((v,k)=>{
        if(v===interaction){
            out = k;
        }
    })
    return out;
}