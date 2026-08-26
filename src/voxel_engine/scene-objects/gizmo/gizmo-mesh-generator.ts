import { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import { Vector4 } from "../../../math/vector4.type";
import type { Mesh } from "../../../render_engine/meshes/Mesh";
import { MeshBuilder, type MeshBuilderBox, type MeshBuilderFaceAttributes, type MeshBuilderVertex } from "../../../render_engine/meshes/MeshBuilder";
import { getPickingInteractionId } from "../../picking/picking-interactions";

// collection of functions for creating Meshes of Gizmos  

export function generateCameraControllsGizmoMesh(): Mesh{
const builder = new MeshBuilder({
    topology: "triangle-list",
    attributes: ["position","color", "quadUV","pickingInteractionId"],
    frontFace: "cw",
    cullMode: "none",
}, {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus",
});
    const red = new Vector4(255, 0, 0, 255);
    const green = new Vector4(0, 255, 0, 255);
    const blue = new Vector4(0, 0, 255, 255);
    
    const left = -100;
    const right = 100;
    //top and bottom here refers to top/bottom of screen so top->negY, bottom->posY
    const top = -100;
    const bottom = 100;
    const front = 100;
    const back = -100;

    const leftTopFront = new Vector3(left, top, front);
    const rightTopFront = new Vector3(right, top, front);
    const leftBottomFront = new Vector3(left, bottom, front);
    const rightBottomFront = new Vector3(right, bottom, front);
    const leftTopBack = new Vector3(left, top, back);
    const rightTopBack = new Vector3(right, top, back);
    const leftBottomBack = new Vector3(left, bottom, back);
    const rightBottomBack = new Vector3(right, bottom, back);

    const frontPickingInteractionId = getPickingInteractionId('CameraGizmoNegZ');
    const backPickingInteractionId = getPickingInteractionId('CameraGizmoPosZ');
    const topPickingInteractionId = getPickingInteractionId('CameraGizmoPosY');
    const bottomPickingInteractionId = getPickingInteractionId('CameraGizmoNegY');
    const leftPickingInteractionId = getPickingInteractionId('CameraGizmoPosX');
    const rightPickingInteractionId = getPickingInteractionId('CameraGizmoNegX');

    const frontFace: MeshBuilderFaceAttributes = {
        color: blue,
        pickingInteractionId: frontPickingInteractionId
    }

    const backFace: MeshBuilderFaceAttributes = {
        color: blue,
        pickingInteractionId: backPickingInteractionId
    }

    const topFace: MeshBuilderFaceAttributes = {
        color: green,
        pickingInteractionId: topPickingInteractionId
    }

    const bottomFace: MeshBuilderFaceAttributes = {
        color: green,
        pickingInteractionId: bottomPickingInteractionId
    }

    const rightFace: MeshBuilderFaceAttributes = {
        color: red,
        pickingInteractionId: rightPickingInteractionId
    }

    const leftFace: MeshBuilderFaceAttributes = {
        color: red,
        pickingInteractionId: leftPickingInteractionId
    }


    const box : MeshBuilderBox = {
        positions: {
            leftTopFront,
            rightTopFront,
            leftBottomFront,
            rightBottomFront,
            leftTopBack,
            rightTopBack,
            leftBottomBack,
            rightBottomBack,
        },
        faces: {
            front: frontFace,
            back: backFace,
            top: topFace,
            bottom: bottomFace,
            right: rightFace,
            left: leftFace,
        }
    };
    builder.addBox(box)
    const cubeMesh = builder.build();
    return cubeMesh
}

export function generateResizeGizmoMesh(): Mesh{
        const meshBuilder: MeshBuilder = new MeshBuilder({
            topology: "triangle-list",
            attributes:[
                "position",
                "color",
                "quadUV",
            ]
        });
        const out = meshBuilder.build();
        return out;
}

export function generateRotateGizmoMesh(): Mesh{
        const meshBuilder: MeshBuilder = new MeshBuilder({
            topology: "triangle-list",
            attributes:[
                "position",
                "color",
                "quadUV",
            ]
        });
        const out = meshBuilder.build();
        return out;
}

export function generateMoveGizmoMesh(): Mesh{
        const meshBuilder: MeshBuilder = new MeshBuilder({
            topology: "triangle-list",
            attributes:[
                "position",
                "color",
                "quadUV",                
            ]
        });
        const out = meshBuilder.build();
        return out;
}