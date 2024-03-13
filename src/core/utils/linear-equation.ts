import { Line } from './line';
import { Point } from './types';

export const getLines = (points: Point[]) => {
  const edges = [];
  for (let i = 0; i < points.length; i++) {
    edges.push(new Line([points[i], points[i + 1] || points[0]]));
  }
  return edges;
};

// 判断点是否在线段上
export const isInTheLine = (line: Line, point: Point | null) => {
  if (!point) {
    return;
  }

  const { p1, p2 } = line;
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
};

// 计算两条直线的交点
export const getIntersectPoint = (line1: Line, line2: Line): Point | null => {
  // 平行线
  if ((line1.isHorizontal && line2.isHorizontal) || (line1.isVertical && line2.isVertical)) {
    return null;
  }

  if (line1.isVertical && line2.isHorizontal) {
    return { x: line1.p1.x, y: line2.p1.y };
  }

  if (line1.isHorizontal && line2.isVertical) {
    return { x: line2.p1.x, y: line1.p1.y };
  }

  if (line1.isVertical && !line2.isVerticalOrHorizontal) {
    return { x: line1.p1.x, y: line2.k * line1.p1.x + line2.b };
  }

  if (line2.isVertical && !line1.isVerticalOrHorizontal) {
    return { x: line2.p1.x, y: line1.k * line2.p1.x + line1.b };
  }

  if (line1.isHorizontal && !line2.isVerticalOrHorizontal) {
    return { x: (line1.p1.y - line2.b) / line2.k, y: line1.p1.y };
  }

  if (line2.isHorizontal && !line1.isVerticalOrHorizontal) {
    return { x: (line2.p1.y - line1.b) / line1.k, y: line2.p1.y };
  }

  const x = (line2.b - line1.b) / (line1.k - line2.k);
  const y = line1.k * x + line1.b;
  return { x, y };
};

// 将直线两侧的点分组
export const getSeparatePointsByLine = (points: Point[], line: Line) => {
  const positivePoints: Point[] = [];
  const negativePoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const result = line.getLinearResult(point);
    if (result > 0) {
      positivePoints.push(point);
    } else {
      negativePoints.push(point);
    }
  }

  return [positivePoints, negativePoints];
};

export const getLineUnitVector = (line: Line) => {
  const { p1, p2 } = line;
  // 计算方向向量
  const v_x = p2.x - p1.x;
  const v_y = p2.y - p1.y;
  // 计算向量的长度
  const length_v = Math.sqrt(v_x ** 2 + v_y ** 2);
  return {
    ux: v_x / length_v,
    uy: v_y / length_v,
  };
};

export const getGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, d, starts } = options;
  const [line1, line2, splitLine] = lines;
  const [p1, p2] = starts;
  const [v1, v2] = [getLineUnitVector(line1), getLineUnitVector(line2)];

  const condition1 =
    ((line1.k < 0 && line2.k > 0) || (line1.k > 0 && line2.k < 0)) && splitLine.k > 0;
  const condition2 =
    v1.ux > 0 && (line2.k < 0 || line2.isVertical) && isSamePoint(line1.p2, line2.p1);
  const condition3 =
    ((line1.k < 0 && line2.k > 0) || (line1.k > 0 && line2.k < 0)) && splitLine.k < 0;

  const point2MinusY = condition1 || condition2;
  const point2MinusX = condition3;

  // FIXME: 需要考虑边角情况
  const gapPoints = [
    {
      x: p1.x + d * v1.ux,
      y: p1.y + d * v1.uy,
    },
    {
      x: p2.x + d * v2.ux,
      y: point2MinusY
        ? p2.y - Math.abs(d * v2.uy)
        : point2MinusX
        ? p2.y + Math.abs(d * v2.uy)
        : p2.y + d * v2.uy,
    },
  ];

  return gapPoints;
};

export const isSamePoint = (point1: Point, point2: Point) => {
  return point1.x === point2.x && point1.y === point2.y;
};

export const isSameLine = (line1: Line, line2: Line) => {
  return (
    line1.p1.x === line2.p1.x &&
    line1.p1.y === line2.p1.y &&
    line1.p2.x === line2.p2.x &&
    line1.p2.y === line2.p2.y
  );
};

/*
 * 将分割线ac与另一分割线db的组成的点区分开来，需要重新对分割线切分的点进行排序
 *  A-a------b-B
 *  | | gap  | |
 *  | |      | |
 *  C-c------d-D
 * AaCc、bBdD组成新的图形
 */
export const reArragePoints = (options: {
  separatePoints: Point[][];
  lines: Line[];
  splitLine: Line;
}) => {
  const { separatePoints, splitLine } = options;
  const [positivePoints, negativePoints] = separatePoints;

  // FIXME: 需要考虑边角情况
  if (splitLine.k < 0) {
    return [negativePoints, positivePoints];
  }

  return [positivePoints, negativePoints];
};
