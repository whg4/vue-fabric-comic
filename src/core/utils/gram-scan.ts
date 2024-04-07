import { Point } from '../types';

// 计算相对于点p0的极角
const polarAngle = (p0: Point, p1: Point) => {
  const ySpan = p1.y - p0.y;
  const xSpan = p1.x - p0.x;
  return Math.atan2(ySpan, xSpan);
};

// 计算两点之间的距离
const distance = (p0: Point, p1: Point) => {
  return Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
};

// 计算三点形成的方向F
const ccw = (p0: Point, p1: Point, p2: Point) => {
  return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
};

// Graham扫描算法, 扫描出凸包，即多边形的外围边界
export const grahamScan = (points: Point[]) => {
  const p0 = points.reduce(function (prev, curr) {
    return prev.y < curr.y || (prev.y === curr.y && prev.x < curr.x) ? prev : curr;
  });

  points.sort(function (a, b) {
    const angleA = polarAngle(p0, a),
      angleB = polarAngle(p0, b);
    if (angleA < angleB) return -1;
    if (angleA > angleB) return 1;
    return distance(p0, a) - distance(p0, b);
  });

  const stack = [points[0], points[1]];
  for (let i = 2; i < points.length; i++) {
    while (
      stack.length > 1 &&
      ccw(stack[stack.length - 2], stack[stack.length - 1], points[i]) <= 0
    ) {
      stack.pop();
    }
    stack.push(points[i]);
  }
  return stack;
};
