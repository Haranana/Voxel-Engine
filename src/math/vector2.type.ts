export class Vector2{

    x: number = 0.0;
    y: number = 0.0;

    constructor(x: number = 0, y: number = 0){
        this.x = x;
        this.y = y;
    }

    length() : number{
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    normalize(eps: number = 1e-9) : Vector2{
        const length = this.length();
        return Math.abs(length) < eps?  new Vector2(0,0) :new Vector2(this.x/length , this.y/length);
    }

    crossProduct(v: Vector2) : number{
        return this.x * v.y - this.y * v.x;
    }

    dotProduct(v: Vector2): number{
        return this.x * v.x + this.y * v.y;
    }

    hadamard(v: Vector2): Vector2{
        return new Vector2(this.x * v.x , this.y * v.y);
    }

    equals(v: Vector2, eps: number = 1e-9): boolean{
        return Math.abs(this.x - v.x) <= eps && Math.abs(this.y - v.y) <= eps;
    }

    copy(): Vector2{
        return new Vector2(this.x , this.y);
    }

    addVector(v: Vector2): Vector2{
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    addScalar(n: number): Vector2{
        return new Vector2(this.x + n, this.y + n);
    }

    subVector(v: Vector2): Vector2{
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    subScalar(n: number): Vector2{
        return new Vector2(this.x - n, this.y - n);
    }


    multByScalar(n: number): Vector2{
        return new Vector2(this.x * n, this.y * n);
    }

    divideByScalar(n: number): Vector2{
        return new Vector2(this.x / n, this.y / n);
    }

    toString() {
        return `(${this.x}, ${this.y})`;
    }

    toArray2() : [number, number]{
        return [this.x , this.y];
    }

    toArray3() : [number, number, number]{
        return [this.x, this.y , 0];
    }

    toArray4() :  [number, number, number, number]{
        return [this.x, this.y, 0, 1];
    }
};
