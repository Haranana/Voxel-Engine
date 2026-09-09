import { makeShaderDataDefinitions, makeStructuredView, type StructuredView } from "webgpu-utils"
import type { RenderableObject } from "../renderableObjects/renderableObject"
import type { RenderContext } from "../renderer"
import { Matrices4, PerspectiveMatrices } from "../../math/matrices"
import { degreeToRadians } from "../../math/utils"
import { Vector3 } from "../../math/vector3.type"
import { Vector2 } from "../../math/vector2.type"
import type { Matrix4 } from "../../math/matrix4.type"
import type { ProjectionType } from "../../voxel_engine/scene-objects/camera/camera"

export type ShaderResourceContext = {
    object: RenderableObject,
    renderContext: RenderContext
}

export abstract class ShaderResources{
    readonly bindGroupNumber;
    initialized: boolean = false;
    constructor(bindGroupNumber: number){
        this.bindGroupNumber = bindGroupNumber;
    }
    abstract getBindGroup(): GPUBindGroup | null;
    abstract getBindGroupLayoutDescriptor(context: ShaderResourceContext): GPUBindGroupLayoutDescriptor;
    abstract init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean;
    abstract update(context: ShaderResourceContext): boolean;
}

export class CameraShaderResources extends ShaderResources{

    initialized: boolean = false;
    uniformBufferView: StructuredView | null = null;
    uniformBuffer: GPUBuffer | null = null;
    bindGroup: GPUBindGroup | null = null;

    getBindGroup(): GPUBindGroup | null{
        return this.bindGroup;
    }
   
    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor{
        return {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        }
    }

    init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean{
        const device : GPUDevice | null = context.renderContext.device;
        const queue : GPUQueue | null = context.renderContext.queue;        
        const shaderCode: string | undefined = context.object.material?.shader.code;
        if(!device || !queue || !shaderCode) return false;
        const bindGroupLayout = layout;
        this.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.cameraBuffer);
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.uniformBuffer},
            }]
        })

        this.initialized = true;
        return true;
    }

    update(context: ShaderResourceContext): boolean{
        if(!this.initialized || !context.renderContext.queue || !context.renderContext.cameraContext) return false;
        this.uniformBufferView!.set({
            viewMatrix: context.renderContext.cameraContext.viewMatrix.toArrays(),
            ndcProjection: context.renderContext.cameraContext.ndcProjection.toArrays(),
        });
        context.renderContext.queue.writeBuffer(this.uniformBuffer!, 0, this.uniformBufferView!.arrayBuffer); 
        return true;
    }
}

export class GizmoCameraShaderResources extends ShaderResources{
    initialized: boolean = false;
    uniformBufferView: StructuredView | null = null;
    uniformBuffer: GPUBuffer | null = null;
    bindGroup: GPUBindGroup | null = null;

    fovY: number = degreeToRadians(90);
    near: number = 0.1;
    far: number = 5000;
    distance: number = 1000;

    projectionType: ProjectionType = 'perspective';

    getBindGroup(): GPUBindGroup | null{
        return this.bindGroup;
    }
   
    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor{
        return {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        }
    }

    init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean{
        const device : GPUDevice | null = context.renderContext.device;
        const queue : GPUQueue | null = context.renderContext.queue;        
        const shaderCode: string | undefined = context.object.material?.shader.code;
        if(!device || !queue || !shaderCode) return false;
        const bindGroupLayout = layout;
        this.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.gizmoCameraBuffer);
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.uniformBuffer},
            }]
        })

        this.initialized = true;
        return true;
    }

    update(context: ShaderResourceContext): boolean{
        if(!this.initialized || !context.renderContext.queue || !context.renderContext.cameraContext || !context.renderContext.viewportContext ||!context.renderContext.gizmoCameraContext) return false;
        
        const target = new Vector3(0,0,0);
        const gizmoCameraContext = context.renderContext.gizmoCameraContext;
        const eye = new Vector3(
            target.x + this.distance * Math.cos(degreeToRadians(gizmoCameraContext.pitch)) * Math.sin(degreeToRadians(gizmoCameraContext.yaw)),
            target.y + this.distance * Math.sin(degreeToRadians(gizmoCameraContext.pitch)),
            target.z + this.distance * Math.cos(degreeToRadians(gizmoCameraContext.pitch)) * Math.cos(degreeToRadians(gizmoCameraContext.yaw)),
        );
        const viewMatrx : Matrix4 = PerspectiveMatrices.lightView(
            eye,
            target,
            new Vector3(0, 1, 0)
        );        

        const resolution = context.renderContext.viewportContext.resolution;
        const aspect = resolution.x / resolution.y; 
        const projectionMatrix = this.projectionType==='perspective'? 
            PerspectiveMatrices.PerspectiveProjection(this.fovY, this.near, this.far, aspect) :
            PerspectiveMatrices.orthogonalProjection(-resolution.x/2, resolution.x/2,-resolution.y/2, resolution.y/2, this.near, this.far)        

        this.uniformBufferView!.set({
            viewMatrix: viewMatrx.toArrays(),
            projectionMatrix: projectionMatrix.toArrays(),
        });
        context.renderContext.queue.writeBuffer(this.uniformBuffer!, 0, this.uniformBufferView!.arrayBuffer); 
        return true;
    }    
}

export class WorldObjectShaderResources extends ShaderResources{

    initialized: boolean = false;
    uniformBufferView: StructuredView | null = null;
    uniformBuffer: GPUBuffer | null = null;
    bindGroup: GPUBindGroup | null = null;

    getBindGroup(): GPUBindGroup | null{
        return this.bindGroup;
    }
   
    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor{
        return {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        }
    }

    init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean{
        const device : GPUDevice | null = context.renderContext.device;
        const queue : GPUQueue | null = context.renderContext.queue;        
        const shaderCode: string | undefined = context.object.material?.shader.code;
        if(!device || !queue || !shaderCode) return false;

        const bindGroupLayout = layout;
        this.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.objectBuffer);
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.uniformBuffer},
            }]
        })

        this.initialized = true;
        return true;
    }

    update(context: ShaderResourceContext): boolean{
        const transform = context.object.worldTransform    
        if(!this.initialized || !context.renderContext.queue || !transform) return false;
        this.uniformBufferView!.set({
            translation: Matrices4.translation(transform.translation).toArrays(),
            rotation: Matrices4.rotation(degreeToRadians(transform.rotation.x), degreeToRadians(transform.rotation.y), degreeToRadians(transform.rotation.z)).toArrays(),
            scale: Matrices4.scaling(transform.scale).toArrays(),                
        });
        context.renderContext.queue.writeBuffer(this.uniformBuffer!, 0, this.uniformBufferView!.arrayBuffer);
        return true;
    }
}

export class ViewportShaderResources extends ShaderResources{

    initialized: boolean = false;
    uniformBufferView: StructuredView | null = null;
    uniformBuffer: GPUBuffer | null = null;
    bindGroup: GPUBindGroup | null = null;

    getBindGroup(): GPUBindGroup | null{
        return this.bindGroup;
    }
   
    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor{
        return {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        }
    }

    init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean{
        const device : GPUDevice | null = context.renderContext.device;
        const queue : GPUQueue | null = context.renderContext.queue;        
        const shaderCode: string | undefined = context.object.material?.shader.code;
        if(!device || !queue || !shaderCode) return false;

        const bindGroupLayout = layout;
        this.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.viewportBuffer);
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.uniformBuffer},
            }]
        })

        this.initialized = true;
        return true;
    }

    update(context: ShaderResourceContext): boolean{
        if(!this.initialized || !context.renderContext.queue || !context.renderContext.viewportContext) return false;
        this.uniformBufferView!.set({
            resolution: context.renderContext.viewportContext.resolution.toArray2(),   
        });
        context.renderContext.queue.writeBuffer(this.uniformBuffer!, 0, this.uniformBufferView!.arrayBuffer);
        return true;
    }
}

export class ScreenObjectShaderResources extends ShaderResources{
    initialized: boolean = false;
    uniformBufferView: StructuredView | null = null;
    uniformBuffer: GPUBuffer | null = null;
    bindGroup: GPUBindGroup | null = null;

    getBindGroup(): GPUBindGroup | null{
        return this.bindGroup;
    }
   
    getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor{
        return {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
            ],
        }
    }

    init(context: ShaderResourceContext, layout: GPUBindGroupLayout): boolean{
        const device : GPUDevice | null = context.renderContext.device;
        const queue : GPUQueue | null = context.renderContext.queue;        
        const shaderCode: string | undefined = context.object.material?.shader.code;
        if(!device || !queue || !shaderCode) return false;

        const bindGroupLayout = layout;
        this.uniformBufferView = makeStructuredView(makeShaderDataDefinitions(shaderCode).uniforms.objectBuffer);
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: this.uniformBufferView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        

        this.bindGroup = device.createBindGroup({
            label: 'bind group for uniform data',
            layout: bindGroupLayout,
            entries:[{
                binding: 0,
                resource: {buffer: this.uniformBuffer},
            }]
        })
        this.initialized = true;
        return true;
    }

    update(context: ShaderResourceContext): boolean{
        const transform = context.object.screenTransform    
        if(!this.initialized || !context.renderContext.queue || !transform) return false;
        this.uniformBufferView!.set({
            anchor: new Vector2(transform.anchor.x,transform.anchor.y).toArray2(),
            rotation: Matrices4.rotation(degreeToRadians(transform.rotation.x), degreeToRadians(transform.rotation.y), degreeToRadians(transform.rotation.z)).toArrays(),
            scale: Matrices4.scaling(transform.scale).toArrays(),                
        });
        context.renderContext.queue.writeBuffer(this.uniformBuffer!, 0, this.uniformBufferView!.arrayBuffer);
        return true;
    }
}