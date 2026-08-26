import { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import { Vector4 } from "../../../math/vector4.type";
import type { Mesh } from "../../../render_engine/meshes/Mesh";
import { MeshBuilder, type MeshBuilderVertex } from "../../../render_engine/meshes/MeshBuilder";

// collection of functions for creating Meshes of Gizmos  

export function generateCameraControllsGizmoMesh(): Mesh{
const builder = new MeshBuilder({
    topology: "triangle-list",
    attributes: ["position","color", "quadUV"],
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

    const uv00 = new Vector2(0, 0);
    const uv10 = new Vector2(1, 0);
    const uv11 = new Vector2(1, 1);
    const uv01 = new Vector2(0, 1);
    
    const left = -100;
    const right = 100;
    const top = 100;
    const bottom = -100;
    const front = 100;
    const back = -100;

    // Front (+Z) — niebieski
    builder.addQuad(
        { position: new Vector3(left, top, front), color: blue, quadUV: uv00 },
        { position: new Vector3(right, top, front), color: blue, quadUV: uv10 },
        { position: new Vector3(right, bottom, front), color: blue, quadUV: uv11 },
        { position: new Vector3(left, bottom, front), color: blue, quadUV: uv01 },
    );

    
    // Back (-Z) — niebieski
    builder.addQuad(
        { position: new Vector3(right, top, back), color: blue, quadUV: uv00 },
        { position: new Vector3(left, top, back), color: blue, quadUV: uv10 },
        { position: new Vector3(left, bottom, back), color: blue, quadUV: uv11 },
        { position: new Vector3(right, bottom, back), color: blue, quadUV: uv01 },
    );
    
    // Top (+Y) — zielony
    builder.addQuad(
        { position: new Vector3(left, top, front), color: green, quadUV: uv00 },
        { position: new Vector3(right, top, front), color: green, quadUV: uv10 },
        { position: new Vector3(right, top, back), color: green, quadUV: uv11 },
        { position: new Vector3(left, top, back), color: green, quadUV: uv01 },
    );

    // Bottom (-Y) — zielony
    builder.addQuad(
        { position: new Vector3(left, bottom, front), color: green, quadUV: uv00 },
        { position: new Vector3(right, bottom, front), color: green, quadUV: uv10 },
        { position: new Vector3(right, bottom, back), color: green, quadUV: uv11 },
        { position: new Vector3(left, bottom, back), color: green, quadUV: uv01 },
    );

    // Left (-X) — czerwony
    builder.addQuad(
        { position: new Vector3(left, top, back), color: red, quadUV: uv00 },
        { position: new Vector3(left, top, front), color: red, quadUV: uv10 },
        { position: new Vector3(left, bottom, front), color: red, quadUV: uv11 },
        { position: new Vector3(left, bottom, back), color: red, quadUV: uv01 },
    );

    // Right (+X) — czerwony
    builder.addQuad(
        { position: new Vector3(right, top, front), color: red, quadUV: uv00 },
        { position: new Vector3(right, top, back), color: red, quadUV: uv10 },
        { position: new Vector3(right, bottom, back), color: red, quadUV: uv11 },
        { position: new Vector3(right, bottom, front), color: red, quadUV: uv01 },
    );
    

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