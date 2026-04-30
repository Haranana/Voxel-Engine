export function baseShader(){
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
        
            @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
                return v.color;
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
        
    @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
    let baseColor = v.color;
    let wireColor = vec4f(0.35, 0.35, 0.35, 1.0);

    let dx = min(v.quadUV.x, 1.0 - v.quadUV.x);
    let dy = min(v.quadUV.y, 1.0 - v.quadUV.y);
    let distToEdge = min(dx, dy);

    let pixelSpan = 0.5*fwidth(distToEdge);

    let widthPx = 0.5;

    let wire = 1.0 - smoothstep(widthPx * pixelSpan,
                                (widthPx + 1.0) * pixelSpan,
                                distToEdge);


    let color = mix(baseColor.rgb, wireColor.rgb, wire);
return vec4f(color, baseColor.a);
            }
    `
}

export function voxelObjectGridShader(){
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

    @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
        let baseColor = v.color;
        let wireColor = vec4f(0.35, 0.35, 0.35, 1.0);

        let dx = min(v.quadUV.x, 1.0 - v.quadUV.x);
        let dy = min(v.quadUV.y, 1.0 - v.quadUV.y);
        let distToEdge = min(dx, dy);

        let pixelSpan = 0.5*fwidth(distToEdge);

        let widthPx = 0.5;

        let wire = 1.0 - smoothstep(widthPx * pixelSpan,
                                    (widthPx + 1.0) * pixelSpan,
                                    distToEdge);


        return mix(baseColor, wireColor, wire);
    }
    `
}

export function borderGridShader(){
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
        
            @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
                let baseColor = vec4f(0.0,0.0,0.0,0.0);
                let wireColor = v.color;

                let dx = min(v.quadUV.x, 1.0 - v.quadUV.x);
                let dy = min(v.quadUV.y, 1.0 - v.quadUV.y);
                let distToEdge = min(dx, dy);

                let pixelSpan = 0.5*fwidth(distToEdge);
                let widthPx = 0.5;
                let wire = 1.0 - smoothstep(widthPx * pixelSpan,
                                            (widthPx + 1.0) * pixelSpan,
                                            distToEdge);

                
            if (wire < 0.5) {
                discard;
            }

            return wireColor;
            }
    `
}

export function voxelObjectBorderShader(){
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
        
            @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
                let baseColor = vec4f(0.0,0.0,0.0,0.0);
                let wireColor = v.color;

                let dx = min(v.quadUV.x, 1.0 - v.quadUV.x);
                let dy = min(v.quadUV.y, 1.0 - v.quadUV.y);
                let distToEdge = min(dx, dy);

                let pixelSpan = 1.0*fwidth(distToEdge);
                let widthPx = 1.0;
                let wire = 1.0 - smoothstep(widthPx * pixelSpan,
                                            (widthPx + 1.0) * pixelSpan,
                                            distToEdge);

                
            if (wire < 0.5) {
                discard;
            }

            return wireColor;
            }
    `
}

export function selectedAreaShader(){
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
                return baseOutColor;
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