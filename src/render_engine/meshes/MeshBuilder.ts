import { Vector2 } from "../../math/vector2.type"
import type { Vector3 } from "../../math/vector3.type"
import type { Vector4 } from "../../math/vector4.type"
import type { Mesh, VertexLayout } from "./Mesh"

/*
    refers to optional fields that should be expected from any vertex that is used by the MeshBuilder
*/
type MeshAttributeName =
    | "position"
    | "color"
    | "normal"
    | "quadUV"
    | "pickingInteractionId";

type MeshFaceAttributeName = 
| "color"
| "pickingInteractionId";

function isMeshFaceAttribute(value: MeshAttributeName): value is MeshFaceAttributeName {
    return value === "color" || value === "pickingInteractionId"
}

const MESH_ATTRIBUTES = {
    position: {format: "float32x3", size: 12},
    color:  { format: "unorm8x4",  size: 4 },
    normal: { format: "float32x3", size: 12 },
    quadUV: { format: "float32x2", size: 8 },
    pickingInteractionId: {format: 'float32', size: 4},
} as const;

const ATTRIBUTE_GETTERS = {
    position: (v: MeshBuilderVertex) => v.position,
    color: (v: MeshBuilderVertex) => v.color,
    normal: (v: MeshBuilderVertex) => v.normal,
    quadUV: (v: MeshBuilderVertex) => v.quadUV,
    pickingInteractionId: (v: MeshBuilderVertex) => v.pickingInteractionId,
} as const;

const FACE_ATTRIBUTE_GETTERS = {
    color: (f: MeshBuilderFaceAttributes) => f.color,
    pickingInteractionId: (f: MeshBuilderFaceAttributes) => f.pickingInteractionId,
} as const;

export type MeshBuilderVertex = {
    position: Vector3,
    color?: Vector4,
    normal?: Vector3,
    quadUV?: Vector2
    pickingInteractionId?: number
}

export type MeshBuilderQuad = {
    leftTop: MeshBuilderVertex, 
    rightTop: MeshBuilderVertex, 
    rightBottom: MeshBuilderVertex, 
    leftBottom: MeshBuilderVertex
}

export type MeshBuilderBox = {
    positions: MeshBuilderBoxPositions,
    faces: MeshBuilderBoxFaces,
}

export type MeshBuilderBoxPositions = {
    leftTopFront: Vector3, 
    rightTopFront: Vector3, 
    rightBottomFront: Vector3, 
    leftBottomFront: Vector3,
    leftTopBack: Vector3, 
    rightTopBack: Vector3, 
    rightBottomBack: Vector3, 
    leftBottomBack: Vector3    
}

export type MeshBuilderBoxFaces = {
    left: MeshBuilderFaceAttributes,
    right: MeshBuilderFaceAttributes,
    top: MeshBuilderFaceAttributes,
    bottom: MeshBuilderFaceAttributes,
    back: MeshBuilderFaceAttributes,
    front: MeshBuilderFaceAttributes,
}

export type MeshBuilderFaceAttributes = {
    color?: Vector4,
    pickingInteractionId?: number
}

/*
    By default frontFace = "cw" and cullmode = "back" 
    Only supported topologies are line-list and triangle-list
*/
export type MeshBuilderVertexLayout = {
    topology: "line-list" | "triangle-list" 
    attributes: MeshAttributeName[]
    frontFace?: "cw" | "ccw"
    cullMode?: "front" | "back" | "none"
}

export class MeshBuilder{

    private vertices: MeshBuilderVertex[] = []
    private indices: number[] = []

    readonly primitiveState: GPUPrimitiveState;
    readonly depthStencilState: GPUDepthStencilState;
    readonly topology: GPUPrimitiveTopology;
    readonly gpuLayout: VertexLayout;
    readonly meshBuilderLayout: MeshBuilderVertexLayout;

    constructor(layout: MeshBuilderVertexLayout, depthStencilState: GPUDepthStencilState | undefined = undefined){
        this.meshBuilderLayout = layout;
        this.topology = this.meshBuilderLayout.topology;
        this.gpuLayout = this.#getGpuVertexLayout(layout);
        this.primitiveState = this.#getPrimitiveState(layout);
        this.depthStencilState = !depthStencilState? this.#getDefaultDepthStencilState() : depthStencilState;
    }

    #getPrimitiveState(layout: MeshBuilderVertexLayout): GPUPrimitiveState{
        return{
            topology: layout.topology,
            stripIndexFormat: layout.topology === "line-list" ? "uint32" : undefined, //triangle-list requires undefined stripIndexFormat
            frontFace: layout.frontFace? layout.frontFace : 'cw',
            cullMode: layout.cullMode? layout.cullMode : 'back',
            unclippedDepth: false,
        }
    }

    #getDefaultDepthStencilState(): GPUDepthStencilState{
        return{
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        }
    }

    #getGpuVertexLayout(layout: MeshBuilderVertexLayout) : VertexLayout{
        const attributes: GPUVertexAttribute[] = [];
        let location = 0;
        let offset = 0;
        layout.attributes.forEach(attrName=>{
            const attr = MESH_ATTRIBUTES[attrName]
            attributes.push({
                shaderLocation: location++,
                offset,
                format: attr.format,
            })
            offset+=attr.size
            
        })
        const out: VertexLayout = {
            stride: offset,
            attributes,
        }; 

        return out;
    }

    #doesVertexFitLayout(v: MeshBuilderVertex, excludedAttributes: MeshAttributeName[] = []): boolean{
        let out: boolean = true; 
        this.meshBuilderLayout.attributes.forEach(attrName=>{
            if(!excludedAttributes.find(exAttrName=>exAttrName===attrName) && !ATTRIBUTE_GETTERS[attrName](v)){
                out = false;
            }
        })
        return out;
    }

    #doesFaceFitLayout(face: MeshBuilderFaceAttributes): boolean {
        for (const attrName of this.meshBuilderLayout.attributes) {
            if (!isMeshFaceAttribute(attrName)) {
                continue;
            }
            if (FACE_ATTRIBUTE_GETTERS[attrName](face) === undefined) {
                return false;
            }
        }

        return true;
    }

    /*
        Returns box created by eight points specified by user
        if vertex layout contains quadUV, it will be assigned automatically by the functioin
        user do not have to specify any quadUV in the points 
    */
    addBox(box: MeshBuilderBox){
        const faces = box.faces;
        const leftTopFront = box.positions.leftTopFront;
        const rightTopFront = box.positions.rightTopFront;
        const rightBottomFront = box.positions.rightBottomFront;
        const leftBottomFront = box.positions.leftBottomFront;
        const leftTopBack = box.positions.leftTopBack;
        const rightTopBack = box.positions.rightTopBack;
        const rightBottomBack = box.positions.rightBottomBack;
        const leftBottomBack = box.positions.leftBottomBack;

        if(!this.#doesFaceFitLayout(box.faces.back) || 
        !this.#doesFaceFitLayout(box.faces.front) || 
        !this.#doesFaceFitLayout(box.faces.left) ||  
        !this.#doesFaceFitLayout(box.faces.right) || 
        !this.#doesFaceFitLayout(box.faces.top) || 
        !this.#doesFaceFitLayout(box.faces.bottom)){
            throw Error(`Box faces are not consistent with declared layout`)
        }

        const buildMeshBuilderVertex = (position: Vector3, faceAttr: MeshBuilderFaceAttributes) => {
            const vertex: MeshBuilderVertex = {
                position,
            };

            if (faceAttr.color !== undefined) {
                vertex.color = faceAttr.color;
            }

            if (faceAttr.pickingInteractionId !== undefined) {
                vertex.pickingInteractionId = faceAttr.pickingInteractionId;
            }

            return vertex;
        }

        //front 
        const frontFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(leftTopFront , faces.front),
            rightTop: buildMeshBuilderVertex(rightTopFront , faces.front),
            rightBottom: buildMeshBuilderVertex(rightBottomFront, faces.front),
            leftBottom: buildMeshBuilderVertex(leftBottomFront, faces.front),
        } 
        this.addQuad(frontFace);
        
        //back 
        //potencjalnie nieprawidlowe? zweryfikowac 
        const backFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(rightTopBack , faces.back),
            rightTop: buildMeshBuilderVertex(leftTopBack , faces.back),
            rightBottom: buildMeshBuilderVertex(leftBottomBack, faces.back),
            leftBottom: buildMeshBuilderVertex(rightBottomBack, faces.back),
        }      
        this.addQuad(backFace);   
        
        //top 
        const topFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(leftTopBack , faces.top),
            rightTop: buildMeshBuilderVertex(rightTopBack , faces.top),
            rightBottom: buildMeshBuilderVertex(rightTopFront, faces.top),
            leftBottom: buildMeshBuilderVertex(leftTopFront, faces.top),
        }      
        this.addQuad(topFace);      
        
        //bottom 
        const bottomFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(leftBottomFront , faces.bottom),
            rightTop: buildMeshBuilderVertex(rightBottomFront , faces.bottom),
            rightBottom: buildMeshBuilderVertex(rightBottomBack, faces.bottom),
            leftBottom: buildMeshBuilderVertex(leftBottomBack, faces.bottom),
        }              
        this.addQuad(bottomFace);
        
        //left 
        const leftFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(leftTopBack , faces.left),
            rightTop: buildMeshBuilderVertex(leftTopFront , faces.left),
            rightBottom: buildMeshBuilderVertex(leftBottomFront, faces.left),
            leftBottom: buildMeshBuilderVertex(leftBottomBack, faces.left),
        }              
        this.addQuad(leftFace);        

        //right 
        const rightFace : MeshBuilderQuad ={
            leftTop: buildMeshBuilderVertex(rightTopFront , faces.right),
            rightTop: buildMeshBuilderVertex(rightTopBack , faces.right),
            rightBottom: buildMeshBuilderVertex(rightBottomBack, faces.right),
            leftBottom: buildMeshBuilderVertex(rightBottomFront, faces.right),
        }              
        this.addQuad(rightFace);          
    }

    /*
        Returns quad created by 4 points specified by user
        if vertex layout contains quadUV or normal, it will be assigned automatically by the function        
        user do not have to assign any value to quadUV or normal in the points         
    */    
    addQuad(quad: MeshBuilderQuad){
        const topLeft: MeshBuilderVertex = {...quad.leftTop};
        const topRight: MeshBuilderVertex = {...quad.rightTop};
        const bottomRight: MeshBuilderVertex = {...quad.rightBottom};
        const bottomLeft: MeshBuilderVertex = {...quad.leftBottom};

        if(!this.#doesVertexFitLayout(topLeft, ['quadUV']) || 
        !this.#doesVertexFitLayout(topRight, ['quadUV']) || 
        !this.#doesVertexFitLayout(bottomRight, ['quadUV']) || 
        !this.#doesVertexFitLayout(bottomLeft, ['quadUV'])){
            throw Error(`Vertices fields are not consistent with declared layout`)
        }

        //adding quadUV if this attribute is required by layout
        if(this.meshBuilderLayout.attributes.find(attrName=>attrName==='quadUV')){
            topLeft.quadUV = new Vector2(0,0);
            topRight.quadUV = new Vector2(0,1);
            bottomRight.quadUV = new Vector2(1,1);
            bottomLeft.quadUV = new Vector2(1,0);
        }

        //todo insert normals to vertices here

        const currentVertexIndex : number = this.vertices.length; 
        this.vertices.push(topLeft);
        this.vertices.push(topRight)
        this.vertices.push(bottomRight)
        this.vertices.push(bottomLeft)
        if(this.meshBuilderLayout.topology == "line-list"){
            this.indices.push(currentVertexIndex, currentVertexIndex+1, currentVertexIndex+1, currentVertexIndex+2, currentVertexIndex+2, currentVertexIndex+3, currentVertexIndex+3, currentVertexIndex);
        }else if(this.meshBuilderLayout.topology == "triangle-list"){
             this.indices.push(currentVertexIndex, currentVertexIndex+1, currentVertexIndex+2, currentVertexIndex+2, currentVertexIndex+3, currentVertexIndex);
        }
    }

    addLine(first: MeshBuilderVertex, second: MeshBuilderVertex){
        if(this.meshBuilderLayout.topology != "line-list"){
            throw Error(`Drawing lines in mesh is not supported for declared layout`);
        }
        if(!this.#doesVertexFitLayout(first) || 
        !this.#doesVertexFitLayout(second)){
            throw Error(`Vertices fields are not consistent with declared layout`);
        }
        const currentVertexIndex : number = this.vertices.length; 
        this.vertices.push({...first});
        this.vertices.push({...second});
        
        this.indices.push(currentVertexIndex, currentVertexIndex+1);
    }
    
    /*
        warning, this method doesn't have support for all gpu data formats, if new attributes are added
        I should make sure that their formats are accounted for here
    */
    build(): Mesh{
        const floatsPerVertex = this.gpuLayout.stride/4;
        const numVertices : number = this.vertices.length;
        const verticesArray = new Float32Array(numVertices * floatsPerVertex); 
        const uintArray = new Uint8Array(verticesArray.buffer); //used for colors!

        for(let i=0; i<numVertices; i++){
            let currentByteOffset = 0;
            this.meshBuilderLayout.attributes.forEach((attrName)=>{
                const attr = MESH_ATTRIBUTES[attrName];                
                const floatsInAttr = attr.size/4;
                const format = attr.format;
                if(format==='unorm8x4'){
                    const attrValue = ATTRIBUTE_GETTERS[attrName](this.vertices[i]) as Vector4
                    uintArray.set([attrValue.x, attrValue.y, attrValue.z, attrValue.w], i*floatsPerVertex*4 + 4*currentByteOffset)                    
                }else if(format==='float32x3'){
                    const attrValue = ATTRIBUTE_GETTERS[attrName](this.vertices[i]) as Vector3
                    verticesArray.set([attrValue.x, attrValue.y, attrValue.z], i*floatsPerVertex + currentByteOffset)
                }else if(format==='float32x2'){
                    const attrValue = ATTRIBUTE_GETTERS[attrName](this.vertices[i]) as Vector2
                    verticesArray.set([attrValue.x, attrValue.y], i*floatsPerVertex + currentByteOffset)
                }else if(format==='float32'){
                    const attrValue = ATTRIBUTE_GETTERS[attrName](this.vertices[i]) as number
                    verticesArray.set([attrValue], i*floatsPerVertex + currentByteOffset)
                }
                currentByteOffset+=floatsInAttr;
            })
        }

        const indicesArray = new Uint32Array(this.indices);

        const out: Mesh = {
            vertices: verticesArray,
            indices: indicesArray,
            primitiveState: this.primitiveState,
            depthStencilState: this.depthStencilState, 
            layout: this.gpuLayout,
        }
        return out;
    }
    
}