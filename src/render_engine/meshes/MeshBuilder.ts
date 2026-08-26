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
    | "pickInteractionId"

const MESH_ATTRIBUTES = {
    position: {format: "float32x3", size: 12},
    color:  { format: "unorm8x4",  size: 4 },
    normal: { format: "float32x3", size: 12 },
    quadUV: { format: "float32x2", size: 8 },
    pickInteractionId: {format: 'float32', size: 4},
} as const;

const ATTRIBUTE_GETTERS = {
    position: (v: MeshBuilderVertex) => v.position,
    color: (v: MeshBuilderVertex) => v.color,
    normal: (v: MeshBuilderVertex) => v.normal,
    quadUV: (v: MeshBuilderVertex) => v.quadUV,
    pickInteractionId: (v: MeshBuilderVertex) => v.pickInteractionId,
} as const;

export type MeshBuilderVertex = {
    position: Vector3,
    color?: Vector4,
    normal?: Vector3,
    quadUV?: Vector2
    pickInteractionId?: number
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

    /*
        Returns box created by eight points specified by user
        if vertex layout contains quadUV, it will be assigned automatically by the functioin
        user do not have to specify any quadUV in the points 
    */
    addBox(leftTopFront: MeshBuilderVertex, rightTopFront: MeshBuilderVertex, rightBottomFront: MeshBuilderVertex, leftBottomFront: MeshBuilderVertex,
        leftTopBack: MeshBuilderVertex, rightTopBack: MeshBuilderVertex, rightBottomBack: MeshBuilderVertex, leftBottomBack: MeshBuilderVertex
    ){
        if(!this.#doesVertexFitLayout(leftTopFront, ['quadUV']) || 
        !this.#doesVertexFitLayout(rightTopFront, ['quadUV']) || 
        !this.#doesVertexFitLayout(rightBottomFront, ['quadUV']) || 
        !this.#doesVertexFitLayout(leftBottomFront, ['quadUV']) || 
        !this.#doesVertexFitLayout(leftTopBack, ['quadUV']) ||
        !this.#doesVertexFitLayout(rightTopBack, ['quadUV']) || 
        !this.#doesVertexFitLayout(rightBottomBack, ['quadUV']) || 
        !this.#doesVertexFitLayout(leftBottomBack, ['quadUV'])){
            throw Error(`Box Vertices are not consistent with declared layout`)
        }

        //front 
        this.addQuad(leftTopFront, rightTopFront, rightBottomFront, leftBottomFront);
        
        //back 
        this.addQuad(rightTopBack, leftTopBack, leftBottomBack, rightBottomBack); //potencjalnie nieprawidlowe? zweryfikowac 
        
        //top 
        this.addQuad(leftTopBack, rightTopBack, rightTopFront, leftTopFront);
        
        //bottom 
        this.addQuad(leftBottomFront, rightBottomFront, rightBottomBack, leftBottomBack);
        
        //left 
        this.addQuad(leftTopBack, leftTopFront, leftBottomFront, leftBottomBack);

        //right 
        this.addQuad(rightTopFront, rightTopBack, rightBottomBack, rightBottomFront);
    }

    /*
        Returns quad created by 4 points specified by user
        if vertex layout contains quadUV, it will be assigned automatically by the functioin
        user do not have to specify any quadUV in the points 
    */    
    addQuad(topLeft: MeshBuilderVertex, topRight: MeshBuilderVertex, bottomRight: MeshBuilderVertex, bottomLeft: MeshBuilderVertex ){
        if(!this.#doesVertexFitLayout(topLeft, ['quadUV']) || 
        !this.#doesVertexFitLayout(topRight, ['quadUV']) || 
        !this.#doesVertexFitLayout(bottomRight, ['quadUV']) || 
        !this.#doesVertexFitLayout(bottomLeft, ['quadUV'])){
            throw Error(`Vertices fields are not consistent with declared layout`)
        }

        const topLeftCopy = {...topLeft};
        const topRightCopy = {...topRight};
        const bottomRightCopy = {...bottomRight};
        const bottomLeftCopy = {...bottomLeft};
        

        //adding quadUV if this attribute is required by layout
        if(this.meshBuilderLayout.attributes.find(attrName=>attrName==='quadUV')){
            topLeftCopy.quadUV = new Vector2(0,0);
            topRightCopy.quadUV = new Vector2(0,1);
            bottomRightCopy.quadUV = new Vector2(1,1);
            bottomLeftCopy.quadUV = new Vector2(1,0);
        }

        const currentVertexIndex : number = this.vertices.length; 
        this.vertices.push(topLeftCopy);
        this.vertices.push(topRightCopy)
        this.vertices.push(bottomRightCopy)
        this.vertices.push(bottomLeftCopy)
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