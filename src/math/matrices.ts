import {type Mat3, Matrix3 } from "./matrix3.type";
import {type Mat4, Matrix4 } from "./matrix4.type";
import type { Vector2 } from "./vector2.type";
import {type Vector3 } from "./vector3.type";

export const Matrices3 = {
  ndcProjection2D(width: number, height: number): Matrix3{
    const m: Mat3 = [
      [2/width,0,0],
      [0,-2/height,0],
      [-1,1,1],
    ];
    return new Matrix3(m);
  },

  identity(): Matrix3 {
    const m: Mat3 = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    return new Matrix3(m);
  },

  translation(v: Vector2): Matrix3 {
    const m: Mat3 = [
      [1, 0, v.x],
      [0, 1, v.y],
      [0, 0, 1],
    ];
    return new Matrix3(m);
  },

  scaling(v: Vector2): Matrix3 {
    const m: Mat3 = [
      [v.x, 0, 0],
      [0, v.y, 0],
      [0, 0, 1],
    ];
    return new Matrix3(m);
  },

  rotation(angle: number): Matrix3 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m: Mat3 = [
      [c, -s, 0],
      [s,  c, 0],
      [0,  0, 1],
    ];
    return new Matrix3(m);
  },

  shearing(v: Vector2): Matrix3 {
    const m: Mat3 = [
      [1, v.x, 0],
      [v.y, 1, 0],
      [0, 0, 1],
    ];
    return new Matrix3(m);
  },
} as const;


export const Matrices4 = {
  identity(): Matrix4 {
    const m: Mat4 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  translation(v: Vector3): Matrix4 {
    const m: Mat4 = [
      [1, 0, 0, v.x],
      [0, 1, 0, v.y],
      [0, 0, 1, v.z],
      [0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  scaling(v: Vector3): Matrix4 {
    const m: Mat4 = [
      [v.x, 0, 0, 0],
      [0, v.y, 0, 0],
      [0, 0, v.z, 0],
      [0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  rotation(angleX: number, angleY: number, angleZ: number): Matrix4 {
    return this.rotationZ(angleZ).multMatrix(this.rotationY(angleY)).multMatrix(this.rotationX(angleX));
  },

  rotationX(angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m: Mat4 = [
      [1, 0, 0, 0],
      [0, c, -s, 0],
      [0, s,  c, 0],
      [0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  rotationY(angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m: Mat4 = [
      [ c, 0, s, 0],
      [ 0, 1, 0, 0],
      [-s, 0, c, 0],
      [ 0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  rotationZ(angle: number): Matrix4 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m: Mat4 = [
      [c, -s, 0, 0],
      [s,  c, 0, 0],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ];
    return new Matrix4(m);
  },

  Matrix4To3(m4: Matrix4): Matrix3 {
    const m: Mat3 = [
      [m4.get(0, 0), m4.get(0, 1), m4.get(0, 2)],
      [m4.get(1, 0), m4.get(1, 1), m4.get(1, 2)],
      [m4.get(2, 0), m4.get(2, 1), m4.get(2, 2)],
    ];
    return new Matrix3(m);
  },
} as const;


export const PerspectiveMatrices = {
  lightView(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
   
    const f = target.subVector(eye).normalize();      // forward
    const r = f.crossProduct(up).normalize();         // right
    const u = r.crossProduct(f);                      // up (ortho)

    const m: Mat4 = [
      [ r.x,  r.y,  r.z, -r.dotProduct(eye)],
      [ u.x,  u.y,  u.z, -u.dotProduct(eye)],
      [-f.x, -f.y, -f.z,  f.dotProduct(eye)],
      [ 0,    0,    0,    1],
    ];
    return new Matrix4(m);
  },

  orthogonalProjection(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    const m: Mat4 = [
      [2 / (right - left), 0, 0, -(right + left) / (right - left)],
      [0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom)],
      [0, 0, -2 / (far - near), -(far + near) / (far - near)],
      [0, 0, 0, 1],
    ];
    return new Matrix4(m);
  },

  PerspectiveProjection(fovY: number, near: number, far: number, screenAscpect: number): Matrix4 {
    const s = 1.0 / Math.tan(fovY * 0.5);
    const m: Mat4 = [
      [s / screenAscpect, 0, 0, 0],
      [0, s, 0, 0],
      [0, 0, -(far + near) / (far - near), (-2 * far * near) / (far - near)],
      [0, 0, -1, 0],
    ];
    return new Matrix4(m);
  },
} as const;