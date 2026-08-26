import { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import { Vector4 } from "../../../math/vector4.type";
import type { Mesh } from "../../../render_engine/meshes/Mesh";
import { MeshBuilder, type MeshBuilderVertex } from "../../../render_engine/meshes/MeshBuilder";

import type { VoxelObject } from "./voxel-object";
import type { VoxelObjectSelectedArea } from "./voxel-object-selected-area";
// collection of functions for creating Meshes of VoxelObject and its associated elements 

export function generateVoMesh(vo: VoxelObject): Mesh{
    const meshBuilder: MeshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes:[
            "position",
            "color",
            "quadUV",
        ]
    });

    const addVoxelSideToMesh = (leftTopPosition: Vector3, rightTopPosition: Vector3, rightBottomPosition: Vector3, leftBottomPosition: Vector3, color: Vector4) =>{
        const leftTop : MeshBuilderVertex = {
            position: leftTopPosition,
            quadUV: new Vector2(0,0), 
            color,
        }
        const rightTop: MeshBuilderVertex = {
            position: rightTopPosition,
            quadUV: new Vector2(1,0), 
            color,
        }
        const rightBottom: MeshBuilderVertex = {
            position: rightBottomPosition,
            quadUV: new Vector2(1,1), 
            color,
        }
        const leftBottom: MeshBuilderVertex = {
            position: leftBottomPosition,
            quadUV: new Vector2(0,1), 
            color,
        }
        meshBuilder.addQuad(leftTop,rightTop,rightBottom,leftBottom)
    }

    const objectStart : Vector3 = new Vector3(-vo.size.x/2 , -vo.size.y/2, -vo.size.z/2) 
    for(let x = 0; x < vo.size.x; x++){
        for(let y = 0; y < vo.size.y; y++){
            for(let z = 0; z < vo.size.z; z++){
                const currentVoxelCoords = new Vector3(x,y,z);
                const currentVoxelNonEmpty = vo.isVoxelNonEmpty(currentVoxelCoords);
                if(currentVoxelNonEmpty){
                    const voxelStartPosition = new Vector3( (objectStart.x +x)*vo.getVoxelSize() , (objectStart.y+y)*vo.getVoxelSize(), (objectStart.z+z)*vo.getVoxelSize());
                    
                    const getThisVoxelColor = (voxelId: Vector3)=>{
                            return vo.getVoxel(voxelId)!.color;
                    }
                    
                    const voxelSize = vo.getVoxelSize();
                    const voxelColor = getThisVoxelColor(currentVoxelCoords);

                    const leftTopFrontPosition = voxelStartPosition.addVector(new Vector3(0,0,voxelSize)); //a
                    const rightTopFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize,0,voxelSize)); //b
                    const rightBottomFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize,voxelSize,voxelSize)); //c
                    const leftBottomFrontPosition = voxelStartPosition.addVector(new Vector3(0,voxelSize,voxelSize)); //d
                    const leftTopBackPosition = voxelStartPosition.addVector(new Vector3(0,0,0)); //e
                    const rightTopBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize,0,0)); //f
                    const rightBottomBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize,voxelSize,0)); //g
                    const leftBottomBackPosition = voxelStartPosition.addVector(new Vector3(0,voxelSize,0)); //h
                    
                    //front culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y,z+1))){
                        addVoxelSideToMesh(leftTopFrontPosition, rightTopFrontPosition, rightBottomFrontPosition, leftBottomFrontPosition, voxelColor);
                    }

                    //back culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y,z-1))){
                        addVoxelSideToMesh(rightTopBackPosition, leftTopBackPosition, leftBottomBackPosition, rightBottomBackPosition, voxelColor);
                    }

                    //top culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y-1,z))){
                        addVoxelSideToMesh(leftTopBackPosition, rightTopBackPosition, rightTopFrontPosition, leftTopFrontPosition, voxelColor);
                    }

                    //bottom culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y+1,z))){
                        addVoxelSideToMesh(leftBottomFrontPosition, rightBottomFrontPosition, rightBottomBackPosition, leftBottomBackPosition, voxelColor);
                    }

                    //left culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x-1,y,z))){
                        addVoxelSideToMesh(leftTopBackPosition, leftTopFrontPosition, leftBottomFrontPosition, leftBottomBackPosition, voxelColor);
                    }

                    //right culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x+1,y,z))){
                        addVoxelSideToMesh(rightTopFrontPosition, rightTopBackPosition, rightBottomBackPosition, rightBottomFrontPosition, voxelColor);
                    }                                                       
                }
            }
        }
    }
    return meshBuilder.build();
}

export function generateVoGridMesh(vo: VoxelObject): Mesh{
    const epsilon = 0.00;
    const meshBuilder: MeshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes:[
            "position",
            "color",
            "quadUV",
        ]
    },
    {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        format: 'depth24plus',        
    });

    const addVoxelSideToMesh = (leftTopPosition: Vector3, rightTopPosition: Vector3, rightBottomPosition: Vector3, leftBottomPosition: Vector3, color: Vector4) =>{
        const leftTop : MeshBuilderVertex = {
            position: leftTopPosition,
            quadUV: new Vector2(0,0), 
            color,
        }
        const rightTop: MeshBuilderVertex = {
            position: rightTopPosition,
            quadUV: new Vector2(1,0), 
            color,
        }
        const rightBottom: MeshBuilderVertex = {
            position: rightBottomPosition,
            quadUV: new Vector2(1,1), 
            color,
        }
        const leftBottom: MeshBuilderVertex = {
            position: leftBottomPosition,
            quadUV: new Vector2(0,1), 
            color,
        }
        meshBuilder.addQuad(leftTop,rightTop,rightBottom,leftBottom)
    }

    const objectStart : Vector3 = new Vector3(-vo.size.x/2 , -vo.size.y/2, -vo.size.z/2) 
    for(let x = 0; x < vo.size.x; x++){
        for(let y = 0; y < vo.size.y; y++){
            for(let z = 0; z < vo.size.z; z++){
                const currentVoxelCoords = new Vector3(x,y,z);
                const currentVoxelNonEmpty = vo.isVoxelNonEmpty(currentVoxelCoords);
                if(currentVoxelNonEmpty){
                    const voxelStartPosition = new Vector3( (objectStart.x +x)*vo.getVoxelSize() , (objectStart.y+y)*vo.getVoxelSize(), (objectStart.z+z)*vo.getVoxelSize());
                
                    
                    const voxelSize = vo.getVoxelSize();
                    const voxelColor = vo.objectGridColor;

                    const leftTopFrontPosition = voxelStartPosition.addVector(new Vector3(0-epsilon,0-epsilon,voxelSize+epsilon)); //a
                    const rightTopFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize+epsilon,0-epsilon,voxelSize+epsilon)); //b
                    const rightBottomFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize+epsilon,voxelSize+epsilon,voxelSize+epsilon)); //c
                    const leftBottomFrontPosition = voxelStartPosition.addVector(new Vector3(0-epsilon,voxelSize+epsilon,voxelSize+epsilon)); //d
                    const leftTopBackPosition = voxelStartPosition.addVector(new Vector3(0-epsilon,0-epsilon,0-epsilon)); //e
                    const rightTopBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize+epsilon,0-epsilon,0-epsilon)); //f
                    const rightBottomBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize+epsilon,voxelSize+epsilon,0-epsilon)); //g
                    const leftBottomBackPosition = voxelStartPosition.addVector(new Vector3(0-epsilon,voxelSize+epsilon,0-epsilon)); //h
                    
                    //front culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y,z+1))){
                        addVoxelSideToMesh(leftTopFrontPosition, rightTopFrontPosition, rightBottomFrontPosition, leftBottomFrontPosition, voxelColor);
                    }

                    //back culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y,z-1))){
                        addVoxelSideToMesh(rightTopBackPosition, leftTopBackPosition, leftBottomBackPosition, rightBottomBackPosition, voxelColor);
                    }

                    //top culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y-1,z))){
                        addVoxelSideToMesh(leftTopBackPosition, rightTopBackPosition, rightTopFrontPosition, leftTopFrontPosition, voxelColor);
                    }

                    //bottom culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x,y+1,z))){
                        addVoxelSideToMesh(leftBottomFrontPosition, rightBottomFrontPosition, rightBottomBackPosition, leftBottomBackPosition, voxelColor);
                    }

                    //left culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x-1,y,z))){
                        addVoxelSideToMesh(leftTopBackPosition, leftTopFrontPosition, leftBottomFrontPosition, leftBottomBackPosition, voxelColor);
                    }

                    //right culling
                    if(!vo.isVoxelNonEmpty(new Vector3(x+1,y,z))){
                        addVoxelSideToMesh(rightTopFrontPosition, rightTopBackPosition, rightBottomBackPosition, rightBottomFrontPosition, voxelColor);
                    }                                                       
                }
            }
        }
    }
    return meshBuilder.build();
}

export function generateVoBorderGridMesh(vo: VoxelObject): Mesh {

    const meshBuilder: MeshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes:[
            "position",
            "color",
            "quadUV",
        ],
        cullMode: "front"
    },
    {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        format: 'depth24plus',        
    });

    const color = vo.borderColor;

    const addQuad = (A: Vector3,B: Vector3,C: Vector3,D: Vector3) => {
        meshBuilder.addQuad({
                position: A,
                quadUV: new Vector2(0,0),
                color,
            },{
                position: B,
                quadUV: new Vector2(1,0),
                color,
            },{
                position: C,
                quadUV: new Vector2(1,1),
                color,
            },{
                position: D,
                quadUV: new Vector2(0,1),
                color,
    })};

    const step = vo.getVoxelSize();

    const objectStart = new Vector3(
        -(vo.size.x  ) * step / 2,
        -(vo.size.y  ) * step / 2,
        -(vo.size.z  ) * step / 2
    );

    const pos = (x:number,y:number,z:number)=>
        objectStart.addVector(
            new Vector3(
                x * step,
                y * step,
                z * step
            )
        );
    
    // FRONT
    for(let x = 0; x < vo.size.x; x++){
        for(let y = 0; y < vo.size.y; y++){           
            addQuad(
                pos(x, y, vo.size.z),
                pos(x+1, y, vo.size.z),
                pos(x+1, y+1, vo.size.z),
                pos(x, y+1, vo.size.z),
            );
        }
    }

    // BACK
    for(let x = 0; x < vo.size.x; x++){
        for(let y = 0; y < vo.size.y; y++){

            addQuad(
                pos(x+1, y, 0),
                pos(x, y, 0),
                pos(x, y+1, 0),
                pos(x+1, y+1, 0),
            );
        }
    }

    // TOP
    for(let x = 0; x < vo.size.x; x++){
        for(let z = 0; z < vo.size.z; z++){

            addQuad(
                pos(x, 0, z),
                pos(x+1, 0, z),
                pos(x+1, 0, z+1),
                pos(x, 0, z+1),
            );
        }
    }

    // BOTTOM
    for(let x = 0; x < vo.size.x; x++){
        for(let z = 0; z < vo.size.z; z++){

            addQuad(
                pos(x, vo.size.y, z+1),
                pos(x+1, vo.size.y, z+1),
                pos(x+1, vo.size.y, z),
                pos(x, vo.size.y, z),
            );
        }
    }

    // LEFT
    for(let y = 0; y < vo.size.y; y++){
        for(let z = 0; z < vo.size.z; z++){

            addQuad(
                pos(0, y, z),
                pos(0, y, z+1),
                pos(0, y+1, z+1),
                pos(0, y+1, z),
            );
        }
    }

    // RIGHT
    for(let y = 0; y < vo.size.y; y++){
        for(let z = 0; z < vo.size.z; z++){

            addQuad(
                pos(vo.size.x, y, z+1),
                pos(vo.size.x, y, z),
                pos(vo.size.x, y+1, z),
                pos(vo.size.x, y+1, z+1),
            );
        }
    }

    return meshBuilder.build();
}

export function generateVoSelectedAreaMesh(vo: VoxelObject, selectedArea: VoxelObjectSelectedArea): Mesh {

    const meshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes: [
            "position",
            "color",
            "quadUV",
        ]
    },{
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        format: 'depth24plus',
    });

    const addVoxelSideToMesh = (
        leftTopPosition: Vector3,
        rightTopPosition: Vector3,
        rightBottomPosition: Vector3,
        leftBottomPosition: Vector3,
        color: Vector4
    ) => {

        meshBuilder.addQuad(
            {
                position: leftTopPosition,
                quadUV: new Vector2(0,0),
                color,
            },
            {
                position: rightTopPosition,
                quadUV: new Vector2(1,0),
                color,
            },
            {
                position: rightBottomPosition,
                quadUV: new Vector2(1,1),
                color,
            },
            {
                position: leftBottomPosition,
                quadUV: new Vector2(0,1),
                color,
            }
        );
    };

    const objectStart = new Vector3(
        -vo.size.x / 2,
        -vo.size.y / 2,
        -vo.size.z / 2
    );

    selectedArea.voxels.forEach(voxelString => {

        const voxelCoords = Vector3.fromString(voxelString);

        const x = voxelCoords.x;
        const y = voxelCoords.y;
        const z = voxelCoords.z;

        const voxelStartPosition = new Vector3(
            (objectStart.x + x) * vo.getVoxelSize(),
            (objectStart.y + y) * vo.getVoxelSize(),
            (objectStart.z + z) * vo.getVoxelSize()
        );

        const voxelSize = vo.getVoxelSize();
        const voxelColor = selectedArea.color;

        const leftTopFrontPosition = voxelStartPosition.addVector(new Vector3(0,0,voxelSize));
        const rightTopFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize,0,voxelSize));
        const rightBottomFrontPosition = voxelStartPosition.addVector(new Vector3(voxelSize,voxelSize,voxelSize));
        const leftBottomFrontPosition = voxelStartPosition.addVector(new Vector3(0,voxelSize,voxelSize));

        const leftTopBackPosition = voxelStartPosition.addVector(new Vector3(0,0,0));
        const rightTopBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize,0,0));
        const rightBottomBackPosition = voxelStartPosition.addVector(new Vector3(voxelSize,voxelSize,0));
        const leftBottomBackPosition = voxelStartPosition.addVector(new Vector3(0,voxelSize,0));

        const selected = (x:number,y:number,z:number)=>
            selectedArea.voxels.has(new Vector3(x,y,z).toString());

        const occupied = (x:number,y:number,z:number)=>
            vo.isVoxelNonEmpty(new Vector3(x,y,z));

        // front
        if(!occupied(x,y,z+1) && !selected(x,y,z+1)){
            addVoxelSideToMesh(
                leftTopFrontPosition,
                rightTopFrontPosition,
                rightBottomFrontPosition,
                leftBottomFrontPosition,
                voxelColor
            );
        }

        // back
        if(!occupied(x,y,z-1) && !selected(x,y,z-1)){
            addVoxelSideToMesh(
                rightTopBackPosition,
                leftTopBackPosition,
                leftBottomBackPosition,
                rightBottomBackPosition,
                voxelColor
            );
        }

        // top
        if(!occupied(x,y-1,z) && !selected(x,y-1,z)){
            addVoxelSideToMesh(
                leftTopBackPosition,
                rightTopBackPosition,
                rightTopFrontPosition,
                leftTopFrontPosition,
                voxelColor
            );
        }

        // bottom
        if(!occupied(x,y+1,z) && !selected(x,y+1,z)){
            addVoxelSideToMesh(
                leftBottomFrontPosition,
                rightBottomFrontPosition,
                rightBottomBackPosition,
                leftBottomBackPosition,
                voxelColor
            );
        }

        // left
        if(!occupied(x-1,y,z) && !selected(x-1,y,z)){
            addVoxelSideToMesh(
                leftTopBackPosition,
                leftTopFrontPosition,
                leftBottomFrontPosition,
                leftBottomBackPosition,
                voxelColor
            );
        }

        // right
        if(!occupied(x+1,y,z) && !selected(x+1,y,z)){
            addVoxelSideToMesh(
                rightTopFrontPosition,
                rightTopBackPosition,
                rightBottomBackPosition,
                rightBottomFrontPosition,
                voxelColor
            );
        }

    });

    return meshBuilder.build();
}

export function generateVoBorderOutlineMesh(vo: VoxelObject): Mesh {

    const meshBuilder: MeshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes:[
            "position",
            "color",
            "quadUV",
        ],
        cullMode: "front"
    },
    {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        format: 'depth24plus',        
    });

    const borderColor = vo.borderColor;
    const borderOffset = 0;

    const addQuad = (
        topLeft: Vector3,
        topRight: Vector3,
        bottomRight: Vector3,
        bottomLeft: Vector3,
    ) => {

        meshBuilder.addQuad(
            {
                position: topLeft,
                quadUV: new Vector2(0,0),
                color: borderColor,
            },
            {
                position: topRight,
                quadUV: new Vector2(1,0),
                color: borderColor,
            },
            {
                position: bottomRight,
                quadUV: new Vector2(1,1),
                color: borderColor,
            },
            {
                position: bottomLeft,
                quadUV: new Vector2(0,1),
                color: borderColor,
            }
        );
    };

    const objectStart = new Vector3(
        -(vo.size.x * vo.getVoxelSize()) / 2,
        -(vo.size.y * vo.getVoxelSize()) / 2,
        -(vo.size.z * vo.getVoxelSize()) / 2
    );

    const voxelSizeX = vo.getVoxelSize() * vo.size.x;
    const voxelSizeY = vo.getVoxelSize() * vo.size.y;
    const voxelSizeZ = vo.getVoxelSize() * vo.size.z;

    const A = objectStart.addVector(
        new Vector3(0,0,voxelSizeZ)
            .addVector(new Vector3(-borderOffset,-borderOffset,borderOffset))
    );

    const B = objectStart.addVector(
        new Vector3(voxelSizeX,0,voxelSizeZ)
            .addVector(new Vector3(borderOffset,-borderOffset,borderOffset))
    );

    const C = objectStart.addVector(
        new Vector3(voxelSizeX,voxelSizeY,voxelSizeZ)
            .addVector(new Vector3(borderOffset,borderOffset,borderOffset))
    );

    const D = objectStart.addVector(
        new Vector3(0,voxelSizeY,voxelSizeZ)
            .addVector(new Vector3(-borderOffset,borderOffset,borderOffset))
    );

    const E = objectStart.addVector(
        new Vector3(0,0,0)
            .addVector(new Vector3(-borderOffset,-borderOffset,-borderOffset))
    );

    const F = objectStart.addVector(
        new Vector3(voxelSizeX,0,0)
            .addVector(new Vector3(borderOffset,-borderOffset,-borderOffset))
    );

    const G = objectStart.addVector(
        new Vector3(voxelSizeX,voxelSizeY,0)
            .addVector(new Vector3(borderOffset,borderOffset,-borderOffset))
    );

    const H = objectStart.addVector(
        new Vector3(0,voxelSizeY,0)
            .addVector(new Vector3(-borderOffset,borderOffset,-borderOffset))
    );

    // front
    addQuad(A, B, C, D);

    // back
    addQuad(F, E, H, G);

    // top
    addQuad(E, F, B, A);

    // bottom
    addQuad(D, C, G, H);

    // left
    addQuad(E, A, D, H);

    // right
    addQuad(B, F, G, C);

    return meshBuilder.build();
}