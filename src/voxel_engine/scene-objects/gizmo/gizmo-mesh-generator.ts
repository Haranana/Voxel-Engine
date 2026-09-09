import { Vector2 } from "../../../math/vector2.type";
import { Vector3 } from "../../../math/vector3.type";
import { Vector4 } from "../../../math/vector4.type";
import type { Mesh } from "../../../render_engine/meshes/Mesh";
import { MeshBuilder, type MeshBuilderBox, type MeshBuilderFaceAttributes, type MeshBuilderQuad, type MeshBuilderTriangle, type MeshBuilderVertex } from "../../../render_engine/meshes/MeshBuilder";
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
    const red = new Vector4(192, 32, 32, 255);
    const green = new Vector4(32, 192, 32, 255);
    const blue = new Vector4(32, 32, 192, 255);
    
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
    const builder: MeshBuilder = new MeshBuilder({
        topology: "triangle-list",
        attributes: ["position","color", "quadUV","pickingInteractionId"],
    });

    const red = new Vector4(192, 32, 32, 255);
    const green = new Vector4(32, 192, 32, 255);
    const blue = new Vector4(32, 32, 192, 255);
    
    const arrowLength = 200;
    const arrowWidth = 10;
    const arrowheadLength = 50
    const arrowheadWidth = 30

    const arrowWidthHalf = arrowWidth/2;
    const arrowheadWidthHalf = arrowheadWidth/2

    const xMovePickId = getPickingInteractionId('MoveGizmoX');
    const yMovePickId = getPickingInteractionId('MoveGizmoY');
    const zMovePickId = getPickingInteractionId('MoveGizmoZ');

    const xArrowLeftTopFront = new Vector3(arrowWidthHalf,-arrowWidthHalf,arrowWidthHalf);
    const xArrowRightTopFront = new Vector3(arrowWidthHalf+arrowLength,-arrowWidthHalf,arrowWidthHalf);
    const xArrowRightBottomFront = new Vector3(arrowWidthHalf+arrowLength,arrowWidthHalf,arrowWidthHalf);
    const xArrowLeftBottomFront = new Vector3(arrowWidthHalf,arrowWidthHalf,arrowWidthHalf);
    const xArrowLeftTopBack = new Vector3(arrowWidthHalf,-arrowWidthHalf,-arrowWidthHalf);
    const xArrowRightTopBack = new Vector3(arrowWidthHalf+arrowLength,-arrowWidthHalf,-arrowWidthHalf);
    const xArrowRightBottomBack = new Vector3(arrowWidthHalf+arrowLength,arrowWidthHalf,-arrowWidthHalf);
    const xArrowLeftBottomBack = new Vector3(arrowWidthHalf,arrowWidthHalf,-arrowWidthHalf);
    const xArrowBox: MeshBuilderBox = {
        positions: {
            leftTopFront: xArrowLeftTopFront,
            rightTopFront: xArrowRightTopFront,
            rightBottomFront: xArrowRightBottomFront,
            leftBottomFront: xArrowLeftBottomFront,
            leftTopBack: xArrowLeftTopBack,
            rightTopBack: xArrowRightTopBack,
            rightBottomBack: xArrowRightBottomBack,
            leftBottomBack: xArrowLeftBottomBack,

        },
        faces: {
            left: {
                color: red,
                pickingInteractionId: xMovePickId, 
            },
            right: {
                color: red,
                pickingInteractionId: xMovePickId, 
            },
            top: {
                color: red,
                pickingInteractionId: xMovePickId, 
            },
            bottom: {
                color: red,
                pickingInteractionId: xMovePickId, 
            },
            back: {
                color: red,
                pickingInteractionId: xMovePickId, 
            },
            front: {
                color: red,
                pickingInteractionId: xMovePickId, 
            }
        }
    }
    builder.addBox(xArrowBox);

    const xArrowheadBase: MeshBuilderQuad = {
        leftTop:{
            position: new Vector3(arrowLength, -arrowheadWidthHalf, -arrowheadWidthHalf),
            quadUV: new Vector2(0,0),
            color: red,
            pickingInteractionId: xMovePickId,            
        },
        rightTop:{
            position: new Vector3(arrowLength, -arrowheadWidthHalf, arrowheadWidthHalf),
            quadUV: new Vector2(0,0),
            color: red,
            pickingInteractionId: xMovePickId,  
        },
        rightBottom:{
            position: new Vector3(arrowLength, arrowheadWidthHalf,  arrowheadWidthHalf),
            quadUV: new Vector2(0,0),
            color: red,
            pickingInteractionId: xMovePickId,  
        },
        leftBottom:{
            position: new Vector3(arrowLength, arrowheadWidthHalf, -arrowheadWidthHalf),
            quadUV: new Vector2(0,0),
            color: red,
            pickingInteractionId: xMovePickId,  
        }

    }
    builder.addQuad(xArrowheadBase);

    const xArrowheadFrontTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(arrowLength + arrowheadLength, 0,0),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        secondVertex:{
            position: new Vector3(arrowLength, arrowheadWidthHalf, arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        thirdVertex:{
            position: new Vector3(arrowLength, -arrowheadWidthHalf, arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        }
    } 
    builder.addTriangle(xArrowheadFrontTriangle);

    const xArrowheadTopTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(arrowLength + arrowheadLength, 0,0),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        secondVertex:{
            position: new Vector3(arrowLength, -arrowheadWidthHalf, arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        thirdVertex:{
            position: new Vector3(arrowLength, -arrowheadWidthHalf, -arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        }
    } 
    builder.addTriangle(xArrowheadTopTriangle);

    const xArrowheadBackTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(arrowLength + arrowheadLength, 0, 0),
            color: red,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: xMovePickId,
        },
        secondVertex: {
            position: new Vector3(arrowLength, -arrowheadWidthHalf, -arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: xMovePickId,
        },
        thirdVertex: {
            position: new Vector3(arrowLength, arrowheadWidthHalf, -arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: xMovePickId,
        }
    };
    builder.addTriangle(xArrowheadBackTriangle);    

    const xArrowheadBottomTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(arrowLength + arrowheadLength, 0,0),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        secondVertex:{
            position: new Vector3(arrowLength, arrowheadWidthHalf, -arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        },
        thirdVertex:{
            position: new Vector3(arrowLength, arrowheadWidthHalf, arrowheadWidthHalf),
            color: red,
            quadUV: new Vector2(0,0),
            pickingInteractionId: xMovePickId,
        }
    } 
    builder.addTriangle(xArrowheadBottomTriangle);    

    const yArrowLeftTopFront = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf,
        arrowWidthHalf
    );

    const yArrowRightTopFront = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf,
        arrowWidthHalf
    );

    const yArrowRightBottomFront = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf + arrowLength,
        arrowWidthHalf
    );

    const yArrowLeftBottomFront = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf + arrowLength,
        arrowWidthHalf
    );

    const yArrowLeftTopBack = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf,
        -arrowWidthHalf
    );

    const yArrowRightTopBack = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf,
        -arrowWidthHalf
    );

    const yArrowRightBottomBack = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf + arrowLength,
        -arrowWidthHalf
    );

    const yArrowLeftBottomBack = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf + arrowLength,
        -arrowWidthHalf
    );

    const yArrowBox: MeshBuilderBox = {
        positions: {
            leftTopFront: yArrowLeftTopFront,
            rightTopFront: yArrowRightTopFront,
            rightBottomFront: yArrowRightBottomFront,
            leftBottomFront: yArrowLeftBottomFront,

            leftTopBack: yArrowLeftTopBack,
            rightTopBack: yArrowRightTopBack,
            rightBottomBack: yArrowRightBottomBack,
            leftBottomBack: yArrowLeftBottomBack,
        },

        faces: {
            left: {
                color: green,
                pickingInteractionId: yMovePickId,
            },
            right: {
                color: green,
                pickingInteractionId: yMovePickId,
            },
            top: {
                color: green,
                pickingInteractionId: yMovePickId,
            },
            bottom: {
                color: green,
                pickingInteractionId: yMovePickId,
            },
            back: {
                color: green,
                pickingInteractionId: yMovePickId,
            },
            front: {
                color: green,
                pickingInteractionId: yMovePickId,
            }
        }
    };

    builder.addBox(yArrowBox);

        const yArrowheadBase: MeshBuilderQuad = {
        leftTop: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            quadUV: new Vector2(0, 0),
            color: green,
            pickingInteractionId: yMovePickId,
        },

        rightTop: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            quadUV: new Vector2(0, 0),
            color: green,
            pickingInteractionId: yMovePickId,
        },

        rightBottom: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            quadUV: new Vector2(0, 0),
            color: green,
            pickingInteractionId: yMovePickId,
        },

        leftBottom: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            quadUV: new Vector2(0, 0),
            color: green,
            pickingInteractionId: yMovePickId,
        }
    };

    builder.addQuad(yArrowheadBase);
        const yArrowheadFrontTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(0, arrowLength + arrowheadLength, 0),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        secondVertex: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        thirdVertex: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        }
    };

    builder.addTriangle(yArrowheadFrontTriangle);


    const yArrowheadTopTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(0, arrowLength + arrowheadLength, 0),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        secondVertex: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        thirdVertex: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        }
    };

    builder.addTriangle(yArrowheadTopTriangle);


    const yArrowheadBackTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(0, arrowLength + arrowheadLength, 0),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        secondVertex: {
            position: new Vector3(
                -arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        thirdVertex: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        }
    };

    builder.addTriangle(yArrowheadBackTriangle);


    const yArrowheadBottomTriangle: MeshBuilderTriangle = {
        firstVertex: {
            position: new Vector3(0, arrowLength + arrowheadLength, 0),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        secondVertex: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                -arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        },
        thirdVertex: {
            position: new Vector3(
                arrowheadWidthHalf,
                arrowLength,
                arrowheadWidthHalf
            ),
            color: green,
            quadUV: new Vector2(0, 0),
            pickingInteractionId: yMovePickId,
        }
    };

    builder.addTriangle(yArrowheadBottomTriangle);

    const zArrowLeftTopFront = new Vector3(
        -arrowWidthHalf,
        -arrowWidthHalf,
        arrowWidthHalf
    );

    const zArrowRightTopFront = new Vector3(
        -arrowWidthHalf,
        -arrowWidthHalf,
        arrowLength,
    );

    const zArrowRightBottomFront = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf,
        arrowLength
    );

    const zArrowLeftBottomFront = new Vector3(
        -arrowWidthHalf,
        arrowWidthHalf,
        arrowWidthHalf
    );

    const zArrowLeftTopBack = new Vector3(
        arrowWidthHalf,
        -arrowWidthHalf,
        arrowWidthHalf
    );

    const zArrowRightTopBack = new Vector3(
        arrowWidthHalf,
        -arrowWidthHalf,
        arrowLength
    );

    const zArrowRightBottomBack = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf,
        arrowLength
    );

    const zArrowLeftBottomBack = new Vector3(
        arrowWidthHalf,
        arrowWidthHalf,
        arrowWidthHalf
    );

    const zArrowBox: MeshBuilderBox = {
        positions: {
            leftTopFront: zArrowLeftTopFront,
            rightTopFront: zArrowRightTopFront,
            rightBottomFront: zArrowRightBottomFront,
            leftBottomFront: zArrowLeftBottomFront,

            leftTopBack: zArrowLeftTopBack,
            rightTopBack: zArrowRightTopBack,
            rightBottomBack: zArrowRightBottomBack,
            leftBottomBack: zArrowLeftBottomBack,
        },

        faces: {
            left: {
                color: blue,
                pickingInteractionId: zMovePickId,
            },
            right: {
                color: blue,
                pickingInteractionId: zMovePickId,
            },
            top: {
                color: blue,
                pickingInteractionId: zMovePickId,
            },
            bottom: {
                color: blue,
                pickingInteractionId: zMovePickId,
            },
            back: {
                color: blue,
                pickingInteractionId: zMovePickId,
            },
            front: {
                color: blue,
                pickingInteractionId: zMovePickId,
            }
        }
    };

    builder.addBox(zArrowBox);

    const zArrowheadBase: MeshBuilderQuad = {
    leftTop: {
        position: new Vector3(
            arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        quadUV: new Vector2(0, 0),
        color: blue,
        pickingInteractionId: zMovePickId,
    },

    rightTop: {
        position: new Vector3(
            -arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        quadUV: new Vector2(0, 0),
        color: blue,
        pickingInteractionId: zMovePickId,
    },

    rightBottom: {
        position: new Vector3(
            -arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        quadUV: new Vector2(0, 0),
        color: blue,
        pickingInteractionId: zMovePickId,
    },

    leftBottom: {
        position: new Vector3(
            arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        quadUV: new Vector2(0, 0),
        color: blue,
        pickingInteractionId: zMovePickId,
    }
};

builder.addQuad(zArrowheadBase);


const zArrowheadFrontTriangle: MeshBuilderTriangle = {
    firstVertex: {
        position: new Vector3(
            0,
            0,
            arrowLength + arrowheadLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    secondVertex: {
        position: new Vector3(
            -arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    thirdVertex: {
        position: new Vector3(
            -arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    }
};

builder.addTriangle(zArrowheadFrontTriangle);


const zArrowheadTopTriangle: MeshBuilderTriangle = {
    firstVertex: {
        position: new Vector3(
            0,
            0,
            arrowLength + arrowheadLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    secondVertex: {
        position: new Vector3(
            -arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    thirdVertex: {
        position: new Vector3(
            arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    }
};

builder.addTriangle(zArrowheadTopTriangle);


const zArrowheadBackTriangle: MeshBuilderTriangle = {
    firstVertex: {
        position: new Vector3(
            0,
            0,
            arrowLength + arrowheadLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    secondVertex: {
        position: new Vector3(
            arrowheadWidthHalf,
            -arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    thirdVertex: {
        position: new Vector3(
            arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    }
};

builder.addTriangle(zArrowheadBackTriangle);


const zArrowheadBottomTriangle: MeshBuilderTriangle = {
    firstVertex: {
        position: new Vector3(
            0,
            0,
            arrowLength + arrowheadLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    secondVertex: {
        position: new Vector3(
            arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    },

    thirdVertex: {
        position: new Vector3(
            -arrowheadWidthHalf,
            arrowheadWidthHalf,
            arrowLength
        ),
        color: blue,
        quadUV: new Vector2(0, 0),
        pickingInteractionId: zMovePickId,
    }
};

builder.addTriangle(zArrowheadBottomTriangle);

    const cubeMesh = builder.build();
    return cubeMesh        

}