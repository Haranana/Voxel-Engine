export function baseShader(){
    return `
    struct UniformDataStruct{
                resolution: vec2f,
                _pad: vec2f,
                objectTransform: mat4x4f,
                ndcProjection: mat4x4f,    
                viewMatrix: mat4x4f,
                baseColor: vec4f,
            };

            struct Vertex{
                @location(0) position: vec3f,
                @location(1) color: vec4f,
            };

            struct VertexShaderOutput{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            }

            @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

            @vertex fn vertexShader(
                v: Vertex) -> VertexShaderOutput {
                
                var out: VertexShaderOutput;
                let vertPixelPosition = uniformData.objectTransform * vec4f(v.position, 1.0);

                let vertNdcPosition = (uniformData.ndcProjection * uniformData.viewMatrix * vertPixelPosition).xyzw;
                out.position = vec4f(vertNdcPosition);
                out.color = v.color;

                return out;
            }
        
            @fragment fn fragmentShader(vnOut: VertexShaderOutput) -> @location(0) vec4f {
                return vnOut.color;
            }
    `
}

export function baseShaderWithWireframe(){
    return `
    struct UniformDataStruct{
                resolution: vec2f,
                _pad: vec2f,
                objectTransform: mat4x4f,
                ndcProjection: mat4x4f,    
                viewMatrix: mat4x4f,
            };

            struct Vertex{
                @location(0) position: vec3f,
                @location(1) color: vec4f,
                @location(2) quadUV: vec2f,
            };

            struct VertexShaderOutput{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
                @location(1) quadUV: vec2f,
            };

            fn fequal(a : f32, b: f32) -> bool{
                return abs(a - b) < 0.04;
            }

            @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

            @vertex fn vertexShader(
                v: Vertex) -> VertexShaderOutput {
                
                var out: VertexShaderOutput;
                let vertPixelPosition = uniformData.objectTransform * vec4f(v.position, 1.0);

                let vertNdcPosition = (uniformData.ndcProjection * uniformData.viewMatrix * vertPixelPosition).xyzw;
                out.position = vec4f(vertNdcPosition);
                out.quadUV = v.quadUV;
                out.color = v.color;

                return out;
            }
        
            @fragment fn fragmentShader(vnOut: VertexShaderOutput) -> @location(0) vec4f {
                let baseOutColor = vnOut.color;
                let uv = vnOut.quadUV;
                let wireframeColor = vec4f(170, 170, 170, 255);
                if(fequal(uv.x, 0.0) || fequal(uv.x, 1.0) || fequal(uv.y,0.0) || fequal(uv.y,1.0)) {
                    return wireframeColor;
                }
                else {
                    return baseOutColor;
                }
            }
    `
}


export function additionalZShader(bias: number = 0.005){
        return `
    struct UniformDataStruct{
                resolution: vec2f,
                _pad: vec2f,
                objectTransform: mat4x4f,
                ndcProjection: mat4x4f,    
                viewMatrix: mat4x4f,
                baseColor: vec4f,
            };

            struct Vertex{
                @location(0) position: vec3f,
                @location(1) color: vec4f,
            };

            struct VertexShaderOutput{
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            }

            @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

            @vertex fn vertexShader(
                v: Vertex) -> VertexShaderOutput {
                
                var out: VertexShaderOutput;
                let vertPixelPosition = uniformData.objectTransform * vec4f(v.position, 1.0);

                let vertNdcPosition = (uniformData.ndcProjection * uniformData.viewMatrix * vertPixelPosition).xyzw;
                out.position = vec4f(vertNdcPosition);
                out.position.z = out.position.z + ${bias};
                out.color = uniformData.baseColor;

                return out;
            }
        
            @fragment fn fragmentShader(vnOut: VertexShaderOutput) -> @location(0) vec4f {
                return vnOut.color;
            }
    `
}