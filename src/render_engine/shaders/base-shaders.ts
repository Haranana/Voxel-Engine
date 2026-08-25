export const shaderViewportResourceCode: string = 
`
    struct ShaderViewportResource{
        resolution: vec2f,        
    };
`

export const shaderGizmoCameraResourceCode: string = 
`
    struct ShaderGizmoCameraResource{
        viewMatrix: mat4x4f,    
        projectionMatrix: mat4x4f    
    };
`

export const shaderCameraResourceCode: string = 
`
    struct ShaderCameraResource{
        viewMatrix: mat4x4f,       
        ndcProjection: mat4x4f, 
    };
`
export const shaderWorldObjectResourceCode: string = 
`
    struct ShaderWorldObjectResource{
        translation: mat4x4f,
        rotation: mat4x4f,
        scale: mat4x4f,        
    };
`

export const shaderScreenObjectResourceCode: string = 
`
    struct ShaderScreenObjectResource{
        anchor: vec2f,
        rotation: mat4x4f,
        scale: mat4x4f,        
    };
`

const fequalFunctionCode : string =
`
fn fequal(a : f32, b: f32) -> bool{
    return abs(a - b) < 0.04;
}
`

const matrixFunctionsCode: string =
`
fn mat3Identity() -> mat3x3f {
    return mat3x3f(
        vec3f(1.0, 0.0, 0.0),
        vec3f(0.0, 1.0, 0.0),
        vec3f(0.0, 0.0, 1.0)
    );
}

fn mat3Translation(v: vec2f) -> mat3x3f {
    return mat3x3f(
        vec3f(1.0, 0.0, 0.0),
        vec3f(0.0, 1.0, 0.0),
        vec3f(v.x, v.y, 1.0)
    );
}

fn mat3Scaling(v: vec2f) -> mat3x3f {
    return mat3x3f(
        vec3f(v.x, 0.0, 0.0),
        vec3f(0.0, v.y, 0.0),
        vec3f(0.0, 0.0, 1.0)
    );
}

fn mat3Rotation(angle: f32) -> mat3x3f {
    let c = cos(angle);
    let s = sin(angle);

    return mat3x3f(
        vec3f(c, s, 0.0),
        vec3f(-s, c, 0.0),
        vec3f(0.0, 0.0, 1.0)
    );
}

fn mat3Shearing(v: vec2f) -> mat3x3f {
    return mat3x3f(
        vec3f(1.0, v.y, 0.0),
        vec3f(v.x, 1.0, 0.0),
        vec3f(0.0, 0.0, 1.0)
    );
}


fn mat4Identity() -> mat4x4f {
    return mat4x4f(
        vec4f(1.0, 0.0, 0.0, 0.0),
        vec4f(0.0, 1.0, 0.0, 0.0),
        vec4f(0.0, 0.0, 1.0, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn mat4Translation(v: vec3f) -> mat4x4f {
    return mat4x4f(
        vec4f(1.0, 0.0, 0.0, 0.0),
        vec4f(0.0, 1.0, 0.0, 0.0),
        vec4f(0.0, 0.0, 1.0, 0.0),
        vec4f(v.x, v.y, v.z, 1.0)
    );
}

fn mat4Scaling(v: vec3f) -> mat4x4f {
    return mat4x4f(
        vec4f(v.x, 0.0, 0.0, 0.0),
        vec4f(0.0, v.y, 0.0, 0.0),
        vec4f(0.0, 0.0, v.z, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn mat4RotationX(angle: f32) -> mat4x4f {
    let c = cos(angle);
    let s = sin(angle);

    return mat4x4f(
        vec4f(1.0, 0.0, 0.0, 0.0),
        vec4f(0.0, c, s, 0.0),
        vec4f(0.0, -s, c, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn mat4RotationY(angle: f32) -> mat4x4f {
    let c = cos(angle);
    let s = sin(angle);

    return mat4x4f(
        vec4f(c, 0.0, -s, 0.0),
        vec4f(0.0, 1.0, 0.0, 0.0),
        vec4f(s, 0.0, c, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn mat4RotationZ(angle: f32) -> mat4x4f {
    let c = cos(angle);
    let s = sin(angle);

    return mat4x4f(
        vec4f(c, s, 0.0, 0.0),
        vec4f(-s, c, 0.0, 0.0),
        vec4f(0.0, 0.0, 1.0, 0.0),
        vec4f(0.0, 0.0, 0.0, 1.0)
    );
}

fn mat4Rotation(angleX: f32, angleY: f32, angleZ: f32) -> mat4x4f {
    return mat4RotationZ(angleZ) *
           mat4RotationY(angleY) *
           mat4RotationX(angleX);
}

fn mat4Transform(
    translation: vec3f,
    rotation: vec3f,
    scale: vec3f
) -> mat4x4f {
    return mat4Translation(translation) *
           mat4Rotation(rotation.x, rotation.y, rotation.z) *
           mat4Scaling(scale);
}

fn lightView(
    eye: vec3f,
    targetPosition: vec3f,
    up: vec3f
) -> mat4x4f {

    let f = normalize(targetPosition - eye);       // forward
    let r = normalize(cross(f, up));       // right
    let u = cross(r, f);                   // up (ortho)

    return mat4x4f(
        vec4f(r.x,  r.y,  r.z,  -dot(r, eye)),
        vec4f(u.x,  u.y,  u.z,  -dot(u, eye)),
        vec4f(-f.x, -f.y, -f.z,  dot(f, eye)),
        vec4f(0.0,  0.0,  0.0,   1.0)
    );
}

fn eyeFromOrbit(targetPosition: vec3f, distance: f32, pitch: f32, yaw: f32) -> vec3f {
    return vec3f(
        targetPosition.x + distance * cos(pitch) * sin(yaw),
        targetPosition.y + distance * sin(pitch),
        targetPosition.z + distance * cos(pitch) * cos(yaw)
    );
}
`;

export function worldObjectShader(){
    return `
    ${shaderViewportResourceCode}
    @group(0) @binding(0) var<uniform> viewportBuffer: ShaderViewportResource;
    ${shaderCameraResourceCode}
    @group(1) @binding(0) var<uniform> cameraBuffer: ShaderCameraResource;
    ${shaderWorldObjectResourceCode}
    @group(2) @binding(0) var<uniform> objectBuffer: ShaderWorldObjectResource;

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

    ${fequalFunctionCode}

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {
        
        var out: VertexShaderOutput;

        let transform = objectBuffer.translation * objectBuffer.rotation * objectBuffer.scale;         
        let vertPixelPosition = transform * vec4f(v.position, 1.0);

        let vertNdcPosition = (cameraBuffer.ndcProjection * cameraBuffer.viewMatrix * vertPixelPosition).xyzw;
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

export function screenObjectShader(){
    return `
    ${shaderViewportResourceCode}
    @group(0) @binding(0) var<uniform> viewportBuffer: ShaderViewportResource;
    ${shaderCameraResourceCode}
    @group(1) @binding(0) var<uniform> cameraBuffer: ShaderCameraResource;
    ${shaderScreenObjectResourceCode}
    @group(2) @binding(0) var<uniform> objectBuffer: ShaderScreenObjectResource;
    ${shaderGizmoCameraResourceCode}
    @group(3) @binding(0) var<uniform> gizmoCameraBuffer: ShaderGizmoCameraResource; 

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

    ${fequalFunctionCode}
    ${matrixFunctionsCode}

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {        
        var out: VertexShaderOutput;

        let anchorNdc = objectBuffer.anchor;
        let transform = objectBuffer.rotation * objectBuffer.scale;      
        
        let modelPosition = vec4f(v.position, 1.0);
        let worldPosition = transform * modelPosition; 
        let clipPosition = (gizmoCameraBuffer.projectionMatrix * gizmoCameraBuffer.viewMatrix * worldPosition).xyzw;
        
        
        out.position = vec4f(clipPosition.x + anchorNdc.x * clipPosition.w , clipPosition.y + anchorNdc.y * clipPosition.w , clipPosition.z, clipPosition.w);

        out.quadUV = v.quadUV;
        out.color = v.color;

        return out;
    }

    @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
        return v.color;
    }
    `
}

export function worldObjectQuadWireframeShader(){
return `

    ${shaderViewportResourceCode}
    @group(0) @binding(0) var<uniform> viewportBuffer: ShaderViewportResource;
    ${shaderCameraResourceCode}
    @group(1) @binding(0) var<uniform> cameraBuffer: ShaderCameraResource;
    ${shaderWorldObjectResourceCode}
    @group(2) @binding(0) var<uniform> objectBuffer: ShaderWorldObjectResource;

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

    ${fequalFunctionCode}

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {
        
        var out: VertexShaderOutput;

        let transform = objectBuffer.translation * objectBuffer.rotation * objectBuffer.scale;         
        let vertPixelPosition = transform * vec4f(v.position, 1.0);

        let vertNdcPosition = (cameraBuffer.ndcProjection * cameraBuffer.viewMatrix * vertPixelPosition).xyzw;
        out.position = vec4f(vertNdcPosition);
        
        out.quadUV = v.quadUV;
        out.color = v.color;

        return out;
    }

    @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
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

//adds additional bias
export function worldObjectGridShader(){
return `
    ${shaderViewportResourceCode}
    @group(0) @binding(0) var<uniform> viewportBuffer: ShaderViewportResource;
    ${shaderCameraResourceCode}
    @group(1) @binding(0) var<uniform> cameraBuffer: ShaderCameraResource;
    ${shaderWorldObjectResourceCode}
    @group(2) @binding(0) var<uniform> objectBuffer: ShaderWorldObjectResource;

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

    ${fequalFunctionCode}

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {
        
        var out: VertexShaderOutput;

        let transform = objectBuffer.translation * objectBuffer.rotation * objectBuffer.scale;         
        let vertPixelPosition = transform * vec4f(v.position, 1.0);

        let vertNdcPosition = (cameraBuffer.ndcProjection * cameraBuffer.viewMatrix * vertPixelPosition).xyzw;
        out.position = vec4f(vertNdcPosition);
        out.position.z = out.position.z - 0.0001;
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

        
        if (wire < 0.3) {
            discard;
        }

        return wireColor;
    }
    `
}

export function worldObjectOutlineShader(){
return `
    ${shaderViewportResourceCode}
    @group(0) @binding(0) var<uniform> viewportBuffer: ShaderViewportResource;
    ${shaderCameraResourceCode}
    @group(1) @binding(0) var<uniform> cameraBuffer: ShaderCameraResource;
    ${shaderWorldObjectResourceCode}
    @group(2) @binding(0) var<uniform> objectBuffer: ShaderWorldObjectResource;

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

    ${fequalFunctionCode}

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {
        
        var out: VertexShaderOutput;

        let transform = objectBuffer.translation * objectBuffer.rotation * objectBuffer.scale;         
        let vertPixelPosition = transform * vec4f(v.position, 1.0);

        let vertNdcPosition = (cameraBuffer.ndcProjection * cameraBuffer.viewMatrix * vertPixelPosition).xyzw;
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

/*

export function filledObjectShader(){
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

export function gizmoShader(){
return `
    struct UniformDataStruct{
                anchor: vec2f,
                scale: vec2f,
                objectRotation: mat4x4f,
    };

    struct Vertex{
        @location(0) position: vec3f,
        @location(1) color: vec4f,
    };

    struct VertexShaderOutput{
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
    };

    @group(0) @binding(0) var<uniform> uniformData: UniformDataStruct;

    @vertex fn vertexShader(
        v: Vertex) -> VertexShaderOutput {
        
        var out: VertexShaderOutput;

        let rotatedPos =  vec4f(v.position, 1.0) * uniformData.objectRotation;
        let vertNdcPosition = vec4f(rotatedPos.x * uniformData.scale.x + uniformData.anchor.x, rotatedPos.y * uniformData.scale.y + uniformData.anchor.y, 0.5, 1.0);

        out.position = vec4f(vertNdcPosition);
        
        out.color = v.color;

        return out;
    }

    @fragment fn fragmentShader(v: VertexShaderOutput) -> @location(0) vec4f {
        return v.color;
    }
    `
}*/

/*
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
*/

/*
export function wireframeShader(){
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

export function gridShader(){
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

export function outlineShader(){
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
*/

/*
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
}*/