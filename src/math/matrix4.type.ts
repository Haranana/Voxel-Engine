export type Mat4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export class Matrix4 {
  matrix: Mat4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  constructor(matrix?: Mat4) {
    if (matrix) this.matrix = Matrix4.copyMat(matrix);
  }

  private static copyMat(m: Mat4): Mat4 {
    return [
      [m[0][0], m[0][1], m[0][2], m[0][3]],
      [m[1][0], m[1][1], m[1][2], m[1][3]],
      [m[2][0], m[2][1], m[2][2], m[2][3]],
      [m[3][0], m[3][1], m[3][2], m[3][3]],
    ];
  }

  private static checkIndex4(i: number) {
    if (i < 0 || i > 3 || (i | 0) !== i) throw new RangeError("Index out of range for 4x4 matrix.");
  }

  get(row: number, col: number): number {
    Matrix4.checkIndex4(row);
    Matrix4.checkIndex4(col);
    return this.matrix[row][col];
  }

  set(row: number, col: number, val: number): void {
    Matrix4.checkIndex4(row);
    Matrix4.checkIndex4(col);
    this.matrix[row][col] = val;
  }

  setMatrix(matrix: Mat4): void {
    this.matrix = Matrix4.copyMat(matrix);
  }

  getRow(row: number): Vector4 {
    Matrix4.checkIndex4(row);
    return new Vector4(this.matrix[row][0], this.matrix[row][1], this.matrix[row][2], this.matrix[row][3]);
  }

  getCol(col: number): Vector4 {
    Matrix4.checkIndex4(col);
    return new Vector4(this.matrix[0][col], this.matrix[1][col], this.matrix[2][col], this.matrix[3][col]);
  }

  getInversion(eps: number = 1e-12): Matrix4 {
    const mat: Mat4 = Matrix4.copyMat(this.matrix);
    const inv: Mat4 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    for (let i = 0; i < 4; i++) {
      let pivot = mat[i][i];

      if (Math.abs(pivot) < eps) {
        let swapRow = i + 1;
        while (swapRow < 4 && Math.abs(mat[swapRow][i]) < eps) swapRow++;

        if (swapRow === 4) {
          throw new Error("Matrix4 is not invertible (pivot ~ 0).");
        }

        for (let col = 0; col < 4; col++) {
          const tmpA = mat[i][col];
          mat[i][col] = mat[swapRow][col];
          mat[swapRow][col] = tmpA;

          const tmpB = inv[i][col];
          inv[i][col] = inv[swapRow][col];
          inv[swapRow][col] = tmpB;
        }

        pivot = mat[i][i];
      }

      const pivotInv = 1.0 / pivot;

      for (let col = 0; col < 4; col++) {
        mat[i][col] *= pivotInv;
        inv[i][col] *= pivotInv;
      }

      for (let row = 0; row < 4; row++) {
        if (row === i) continue;
        const factor = mat[row][i];
        for (let col = 0; col < 4; col++) {
          mat[row][col] -= factor * mat[i][col];
          inv[row][col] -= factor * inv[i][col];
        }
      }
    }

    return new Matrix4(inv);
  }

  multVector(vector: Vector4): Vector4 {
    const m = this.matrix;
    return new Vector4(
      m[0][0] * vector.x + m[0][1] * vector.y + m[0][2] * vector.z + m[0][3] * vector.w,
      m[1][0] * vector.x + m[1][1] * vector.y + m[1][2] * vector.z + m[1][3] * vector.w,
      m[2][0] * vector.x + m[2][1] * vector.y + m[2][2] * vector.z + m[2][3] * vector.w,
      m[3][0] * vector.x + m[3][1] * vector.y + m[3][2] * vector.z + m[3][3] * vector.w
    );
  }

  addMatrix(other: Matrix4): Matrix4 {
    const a = this.matrix, b = other.matrix;
    const r: Mat4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[i][j] = a[i][j] + b[i][j];
    return new Matrix4(r);
  }

  subMatrix(other: Matrix4): Matrix4 {
    const a = this.matrix, b = other.matrix;
    const r: Mat4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[i][j] = a[i][j] - b[i][j];
    return new Matrix4(r);
  }

  multMatrix(other: Matrix4): Matrix4 {
    const A = this.matrix;
    const B = other.matrix;

    const r: Mat4 = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += A[row][k] * B[k][col];
        r[row][col] = sum;
      }
    }

    return new Matrix4(r);
  }

  equals(other: Matrix4, eps: number = 1e-9): boolean {
    const a = this.matrix, b = other.matrix;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (Math.abs(a[r][c] - b[r][c]) > eps) return false;
      }
    }
    return true;
  }

  toString(): string {
    const m = this.matrix;
    return [
      `[ ${m[0][0]} ${m[0][1]} ${m[0][2]} ${m[0][3]} ]`,
      `[ ${m[1][0]} ${m[1][1]} ${m[1][2]} ${m[1][3]} ]`,
      `[ ${m[2][0]} ${m[2][1]} ${m[2][2]} ${m[2][3]} ]`,
      `[ ${m[3][0]} ${m[3][1]} ${m[3][2]} ${m[3][3]} ]`,
    ].join("\n");
  }
}