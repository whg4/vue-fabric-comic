import { Point } from './types';

export class Line {
  /**
   * 斜率
   */
  k: number;

  /**
   * 截距
   */
  b: number;

  /**
   * 端点1
   */
  p1: Point;

  /**
   * 端点2
   */
  p2: Point;

  constructor(points: Point[]) {
    const [p1, p2] = points;
    this.p1 = p1;
    this.p2 = p2;

    this.k = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    this.b = this.p1.y - this.k * this.p1.x;

    // 如果是垂直或者水平的线段，斜率取绝对值
    if (this.p1.x === this.p2.x || this.p1.y === this.p2.y) {
      this.b = 0;
    }
  }

  /**
   * 直线是否垂直
   */
  get isVertical() {
    return this.k === Infinity || this.k === -Infinity;
  }

  /**
   * 直线是否水平
   */
  get isHorizontal() {
    return this.k === 0;
  }

  get isVerticalOrHorizontal() {
    return this.isVertical || this.isHorizontal;
  }

  /**
   * 获取点到直线的距离
   * @param point 点
   * @returns 距离
   */
  getDistance(point: Point) {
    if (this.isHorizontal) {
      return Math.abs(point.y - this.p1.y);
    }

    if (this.isVertical) {
      return Math.abs(point.x - this.p1.x);
    }

    const a = this.k;
    const b = -1;
    const c = this.b;
    return Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
  }

  getLinearResult(point: Point) {
    if (this.isVertical) {
      return point.x - this.p1.x;
    }

    if (this.isHorizontal) {
      return point.y - this.p1.y;
    }

    return point.y - this.k * point.x - this.b;
  }

  getX(y: number) {
    return (y - this.b) / this.k;
  }

  getY(x: number) {
    return this.k * x + this.b;
  }
}
