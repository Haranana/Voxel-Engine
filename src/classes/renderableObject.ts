import { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes";

export class RenderableObject{
    
    transform: ObjectProperties = {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    };
    indices: number[] = [];
    vertices: number[] = [];
    colors: number[] = [];

    //returns data of all verticex in 32 bit array:
    //4 bytes for x
    //4 bytes for y
    //4 bytes for z
    //1 byte for color r
    //1 byte for color g
    //1 byte for color b
    //1 byte for color a
    getVerticesData(){

        const numVertices = this.indices.length;
        const vertexData = new Float32Array(numVertices * 4); 
        const colorData = new Uint8Array(vertexData.buffer);

        for(let i = 0; i<this.indices.length; i++){
            const vertexPositionsStart = this.indices[i]*3;
            const vertexPositions = this.vertices.slice(vertexPositionsStart , vertexPositionsStart+3);
            vertexData.set(vertexPositions, i*4);
            
            const colorForVertexStart = this.indices[i]*4;
            const color = this.colors.slice(colorForVertexStart, colorForVertexStart + 3);
            colorData.set(color, i * 16 + 12);  
            colorData[i * 16 + 15] = 255;       
        }
        
        return {
            vertexData,
            numVertices: numVertices,
        };
    }
}