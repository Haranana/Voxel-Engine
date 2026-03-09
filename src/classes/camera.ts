import type { ObjectProperties } from "../RenderableObjectTypes"

export type ProjectionType =
  | "orthographic"
  | "perspective";

export type Camera = {
    fovY: number,
    near: number,
    far: number,
    transform: ObjectProperties
    projectionType: ProjectionType
}