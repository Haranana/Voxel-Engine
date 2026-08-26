export type Mesh = {
    vertices: Float32Array,
    /*
        topology, stripIndexFormat, cullmode, frontface
    */
    primitiveState: GPUPrimitiveState,
    /*
        depthWrite, depthCompare
    */
    depthStencilState: GPUDepthStencilState,
    indices: Uint32Array,
    layout: VertexLayout,
}

export type VertexLayout = {
    /*
        how much bytes for one vertex
    */
    stride: number,

    /*
        shaderLocation - attribute index,
        format - format of data of given attribute, eg. "float32x3",
        offset: how many bytes from the beginning of the vertex data is given attribute,
    */
    attributes: GPUVertexAttribute[]
}