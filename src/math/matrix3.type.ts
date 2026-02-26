export type Mat3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export class Matrix3 {
  matrix: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  constructor(matrix?: Mat3) {
    if (matrix) this.matrix = Matrix3.copyMat(matrix);
  }

  private static copyMat(m: Mat3): Mat3 {
    return [
      [m[0][0], m[0][1], m[0][2]],
      [m[1][0], m[1][1], m[1][2]],
      [m[2][0], m[2][1], m[2][2]],
    ];
  }

  private static isIndexCorrect(i: number) {
    if (i < 0 || i > 2 || (i | 0) !== i) throw new RangeError("Index out of range for 3x3 matrix.");
  }

  get(row: number, col: number): number {
    Matrix3.isIndexCorrect(row);
    Matrix3.isIndexCorrect(col);
    return this.matrix[row][col];
  }

  set(row: number, col: number, val: number): void {
    Matrix3.isIndexCorrect(row);
    Matrix3.isIndexCorrect(col);
    this.matrix[row][col] = val;
  }

  setMatrix(matrix: Mat3): void {
    this.matrix = Matrix3.copyMat(matrix);
  }

  getRow(row: number): Vector3 {
    Matrix3.isIndexCorrect(row);
    return new Vector3(this.matrix[row][0], this.matrix[row][1], this.matrix[row][2]);
  }

  getCol(col: number): Vector3 {
    Matrix3.isIndexCorrect(col);
    return new Vector3(this.matrix[0][col], this.matrix[1][col], this.matrix[2][col]);
  }

  transpose(): Matrix3 {
    const m = this.matrix;
    return new Matrix3([
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]],
    ]);
  }

  getInversion(eps: number = 1e-12): Matrix3 {
    const a = this.matrix[0][0];
    const b = this.matrix[0][1];
    const c = this.matrix[0][2];
    const d = this.matrix[1][0];
    const e = this.matrix[1][1];
    const f = this.matrix[1][2];
    const g = this.matrix[2][0];
    const h = this.matrix[2][1];
    const i = this.matrix[2][2];

    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    if (Math.abs(det) < eps) {
      throw new Error("Matrix3 is not invertible (determinant is ~0).");
    }

    const invDet = 1.0 / det;

    return new Matrix3([
      [(e * i - f * h) * invDet, -(b * i - c * h) * invDet, (b * f - c * e) * invDet],
      [-(d * i - f * g) * invDet, (a * i - c * g) * invDet, -(a * f - c * d) * invDet],
      [(d * h - e * g) * invDet, -(a * h - b * g) * invDet, (a * e - b * d) * invDet],
    ]);
  }


  multVector(vector: Vector3): Vector3 {
    const m = this.matrix;
    return new Vector3(
      m[0][0] * vector.x + m[0][1] * vector.y + m[0][2] * vector.z,
      m[1][0] * vector.x + m[1][1] * vector.y + m[1][2] * vector.z,
      m[2][0] * vector.x + m[2][1] * vector.y + m[2][2] * vector.z
    );
  }

  addMatrix(other: Matrix3): Matrix3 {
    const a = this.matrix, b = other.matrix;
    return new Matrix3([
      [a[0][0] + b[0][0], a[0][1] + b[0][1], a[0][2] + b[0][2]],
      [a[1][0] + b[1][0], a[1][1] + b[1][1], a[1][2] + b[1][2]],
      [a[2][0] + b[2][0], a[2][1] + b[2][1], a[2][2] + b[2][2]],
    ]);
  }

  subMatrix(other: Matrix3): Matrix3 {
    const a = this.matrix, b = other.matrix;
    return new Matrix3([
      [a[0][0] - b[0][0], a[0][1] - b[0][1], a[0][2] - b[0][2]],
      [a[1][0] - b[1][0], a[1][1] - b[1][1], a[1][2] - b[1][2]],
      [a[2][0] - b[2][0], a[2][1] - b[2][1], a[2][2] - b[2][2]],
    ]);
  }

  multMatrix(other: Matrix3): Matrix3 {
    const A = this.matrix;
    const B = other.matrix;

    const r: Mat3 = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += A[row][k] * B[k][col];
        }
        r[row][col] = sum;
      }
    }

    return new Matrix3(r);
  }

  equals(other: Matrix3, eps: number = 1e-9): boolean {
    const a = this.matrix, b = other.matrix;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (Math.abs(a[r][c] - b[r][c]) > eps) return false;
      }
    }
    return true;
  }

  toString(): string {
    const m = this.matrix;
    return [
      `[ ${m[0][0]} ${m[0][1]} ${m[0][2]} ]`,
      `[ ${m[1][0]} ${m[1][1]} ${m[1][2]} ]`,
      `[ ${m[2][0]} ${m[2][1]} ${m[2][2]} ]`,
    ].join("\n");
  }
}