export class Vector3 {

    x: number = 0.0;
    y: number = 0.0;
    z: number = 0.0;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    length(): number {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }

    normalize(eps: number = 1e-9): Vector3 {
        const length = this.length();
        return Math.abs(length) < eps ? new Vector3(0, 0, 0) : new Vector3(this.x/length, this.y/length, this.z/length);
    }

    // 3D cross product -> Vector3
    crossProduct(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    dotProduct(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    hadamard(v: Vector3): Vector3 {
        return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    equals(v: Vector3, eps: number = 1e-9): boolean {
        return Math.abs(this.x - v.x) <= eps
            && Math.abs(this.y - v.y) <= eps
            && Math.abs(this.z - v.z) <= eps;
    }

    copy(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    addVector(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    addScalar(n: number): Vector3 {
        return new Vector3(this.x + n, this.y + n, this.z + n);
    }

    subVector(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    subScalar(n: number): Vector3 {
        return new Vector3(this.x - n, this.y - n, this.z - n);
    }

    multByScalar(n: number): Vector3 {
        return new Vector3(this.x * n, this.y * n, this.z * n);
    }

    divideByScalar(n: number): Vector3 {
        return new Vector3(this.x / n, this.y / n, this.z / n);
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }

    toArray3(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    toArray4(): [number, number, number, number] {
        return [this.x, this.y, this.z, 1];
    }
};