import type { Vector2 } from "../../math/vector2.type"
import type { Vector3 } from "../../math/vector3.type"
import type { Vector4 } from "../../math/vector4.type"
import type { Mesh, VertexLayout } from "./Mesh"


// By default frontFace = "cw" and cullmode = "back" 
export type MeshBuilderVertexLayout = {
    topology: "line-list" | "triangle-list" //only supported topologies are line-list and triangle-list
    attributes: MeshAttribute[]
    frontFace?: "cw" | "ccw"
    cullMode?: "front" | "back" | "none"
}

//refers to optional fields that should be expected from any vertex that is used by the MeshBuilder
export type MeshAttribute =
    | "color"
    | "normal"
    | "quadUV"

export type MeshBuilderVertex = {
    position: Vector3,
    color?: Vector4,
    normal?: Vector3,
    quadUV?: Vector2
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
        this.depthStencilState = !depthStencilState? this.#getDepthStencilState() : depthStencilState;
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

    #getDepthStencilState(): GPUDepthStencilState{
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
        let stride = 0;

        //vertex position attributes are independant of topology
        attributes.push({
            shaderLocation: location++,
            offset,
            format: `float32x3`,
        })
        offset+=12
        stride+=4*3;

        layout.attributes.forEach(v=>{
            if(v === "color"){
                attributes.push({
                    shaderLocation: location++,
                    offset,
                    format: 'unorm8x4',
                })
                offset+=4
                stride+=4*1;
            }else if(v === "normal"){
                attributes.push({
                    shaderLocation: location++,
                    offset,
                    format: `float32x3`,
                })
                offset+=12
                stride+=4*3;
            }else if(v ==="quadUV"){
                attributes.push({
                    shaderLocation: location++,
                    offset,
                    format: `float32x2`,
                })
                offset+=8
                stride+=4*2;
            }
        })

        const out: VertexLayout = {
            stride,
            attributes,
        }; 

        return out;
    }

    #doesVertexFitLayout(v: MeshBuilderVertex): boolean{
        let out: boolean = true; 
        this.meshBuilderLayout.attributes.forEach(attr=>{
            if(attr === "color"){
               if(v.color==null) out = false;
            }else if(attr === "normal"){
                if(v.normal==null) out = false;
            }else if(attr ==="quadUV"){
                if(v.quadUV==null) out = false;
            }
        })
        return out;
    }
    
    addBox(leftTopFront: MeshBuilderVertex, rightTopFront: MeshBuilderVertex, rightBottomFront: MeshBuilderVertex, leftBottomFront: MeshBuilderVertex,
        leftTopBack: MeshBuilderVertex, rightTopBack: MeshBuilderVertex, rightBottomBack: MeshBuilderVertex, leftBottomBack: MeshBuilderVertex
    ){
        if(!this.#doesVertexFitLayout(leftTopFront) || //a
        !this.#doesVertexFitLayout(rightTopFront) || //b
        !this.#doesVertexFitLayout(rightBottomFront) || //c
        !this.#doesVertexFitLayout(leftBottomFront) || //d
        !this.#doesVertexFitLayout(leftTopBack) ||//e
        !this.#doesVertexFitLayout(rightTopBack) || //f
        !this.#doesVertexFitLayout(rightBottomBack) || //g
        !this.#doesVertexFitLayout(leftBottomBack)){//h
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

    addQuad(topLeft: MeshBuilderVertex, topRight: MeshBuilderVertex, bottomRight: MeshBuilderVertex, bottomLeft: MeshBuilderVertex ){
        if(!this.#doesVertexFitLayout(topLeft) || 
        !this.#doesVertexFitLayout(topRight) || 
        !this.#doesVertexFitLayout(bottomRight) || 
        !this.#doesVertexFitLayout(bottomLeft)){
            throw Error(`Vertices fields are not consistent with declared layout`)
        }

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
        this.vertices.push(first);
        this.vertices.push(second);
        
        this.indices.push(currentVertexIndex, currentVertexIndex+1);
    }
    
    build(): Mesh{
        const floatsPerVertex = this.gpuLayout.stride/4;
        const numVertices : number = this.vertices.length;
        const verticesArray = new Float32Array(numVertices * floatsPerVertex); 

        const colors : boolean = this.meshBuilderLayout.attributes.find((attr)=>attr === "color")!=undefined;
        const colorData = new Uint8Array(verticesArray.buffer);

        const normal : boolean = this.meshBuilderLayout.attributes.find((attr)=>attr === "normal")!=undefined;

        const quadUV : boolean = this.meshBuilderLayout.attributes.find((attr)=>attr === "quadUV")!=undefined;

        
        
        for(let i = 0; i<numVertices; i++){
            let currentByteOffset = 0;

            verticesArray.set([this.vertices[i].position.x , this.vertices[i].position.y, this.vertices[i].position.z]  , i*floatsPerVertex + currentByteOffset);
            currentByteOffset+=3;

            if(colors){
                colorData.set([this.vertices[i].color!.x , this.vertices[i].color!.y , this.vertices[i].color!.z ,this.vertices[i].color!.w],i*floatsPerVertex*4 + 4*currentByteOffset );
                currentByteOffset+=1;
            }
            if(normal){
                verticesArray.set([this.vertices[i].normal!.x , this.vertices[i].normal!.y, this.vertices[i].normal!.z], i * floatsPerVertex + currentByteOffset);
                currentByteOffset+=3;
            }     
            if(quadUV){
                verticesArray.set([this.vertices[i].quadUV!.x , this.vertices[i].quadUV!.y], i * floatsPerVertex + currentByteOffset);
                currentByteOffset+=2;
            }

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