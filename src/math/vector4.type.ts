export class Vector4 {

    x: number = 0.0;
    y: number = 0.0;
    z: number = 0.0;
    w: number = 0.0;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    length(): number {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
    }

    normalize(eps: number = 1e-9): Vector4 {
        const length = this.length();
        return Math.abs(length) < eps ? new Vector4(0, 0, 0, 0) : new Vector4(this.x/length, this.y/length, this.z/length, this.w/length);
    }

    dotProduct(v: Vector4): number {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    hadamard(v: Vector4): Vector4 {
        return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
    }

    equals(v: Vector4, eps: number = 1e-9): boolean {
        return Math.abs(this.x - v.x) <= eps
            && Math.abs(this.y - v.y) <= eps
            && Math.abs(this.z - v.z) <= eps
            && Math.abs(this.w - v.w) <= eps;
    }

    copy(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    addVector(v: Vector4): Vector4 {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    addScalar(n: number): Vector4 {
        return new Vector4(this.x + n, this.y + n, this.z + n, this.w + n);
    }

    subVector(v: Vector4): Vector4 {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    subScalar(n: number): Vector4 {
        return new Vector4(this.x - n, this.y - n, this.z - n, this.w - n);
    }

    multByScalar(n: number): Vector4 {
        return new Vector4(this.x * n, this.y * n, this.z * n, this.w * n);
    }

    divideByScalar(n: number): Vector4 {
        return new Vector4(this.x / n, this.y / n, this.z / n, this.w / n);
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }

    toArray3(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    toArray4(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w];
    }
}