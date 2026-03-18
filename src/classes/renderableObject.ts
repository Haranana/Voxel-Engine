import type { Vector2 } from "../math/vector2.type";
import { Vector3 } from "../math/vector3.type";
import type { Vector4 } from "../math/vector4.type";
import type { ObjectProperties } from "../RenderableObjectTypes";

export type Vertex ={
    position: Vector3,
    quadUV: Vector2,
    color: Vector4,
}

export class RenderableObject{
    
    transform: ObjectProperties = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    };
    trianglesIndices: number[] = [];
    linesIndices: number[] = [];
    quadsIndices: number[] = [];
    vertices: Vertex[] = [];

    //returns data of all verticex in 32 bit (4 byte) array:
    //4 bytes for x
    //4 bytes for y
    //4 bytes for z
    //1 byte for color r
    //1 byte for color g
    //1 byte for color b
    //1 byte for color a
    //4 bytes for quad u
    //4 bytes for quad v
    getVerticesData(){
        const vertexDataElements : number = 6;

        const numVertices : number = this.vertices.length;
        const vertexData = new Float32Array(numVertices * vertexDataElements); 
        const colorData = new Uint8Array(vertexData.buffer);
        

        for(let i = 0; i<numVertices; i++){
            vertexData.set([this.vertices[i].position.x , this.vertices[i].position.y, this.vertices[i].position.z]  , i*vertexDataElements);
            vertexData.set([this.vertices[i].quadUV.x , this.vertices[i].quadUV.y], i * vertexDataElements + 4);
            const color = this.vertices[i].color;
            colorData.set([color.x, color.y, color.z], i * vertexDataElements * 4 + 12);  
            colorData[i * vertexDataElements * 4 + 15] = 255;       
        }
        
        return {
            vertexData,
            linesIndices: new Uint32Array(this.linesIndices),
            trianglesIndices: new Uint32Array(this.trianglesIndices),
            quadsIndices: new Uint32Array(this.quadsIndices),
            numVertices: numVertices,
        };
    }
}