import { Line } from './line';
import { getIntersectPoint, getLineUnitVector, isInTheLine } from './linear-equation';
import { Point } from './types';

const isLeftTop = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x <= p1.x && p.y <= p1.y && p.x <= p2.x && p.y <= p2.y;
};

const isLeftTopMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x <= p1.x && p.y <= p2.y && p.x >= p2.x;
};

const isLeftMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x <= p1.x && p.y >= p2.y;
};

const isLeftBottom = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x <= p1.x && p.y >= p1.y && p.x <= p2.x && p.y >= p2.y;
};

const isLeftBottomMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p1.y && p.x <= p2.x && p.y >= p2.y;
};

const isRightBottomMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p1.y && p.x <= p2.x && p.y >= p2.y;
};

const isRightTop = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y <= p1.y && p.x >= p2.x && p.y <= p2.y;
};

const isRightMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p2.y;
};

const isRightTopMiddle = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p1.y && p.x <= p2.x && p.y <= p2.y;
};

const isRightBottom = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p1.y && p.x >= p2.x && p.y >= p2.y;
};

const isBottomBetween = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.y >= p1.y && p.x >= p1.x && p.y >= p2.y && p.x <= p2.x;
};

const isLeftBetween = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x <= p1.x && p.y >= p1.y && p.x <= p2.x && p.y <= p2.y;
};

const isTopBetween = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.y <= p1.y && p.x >= p1.x && p.y <= p2.y && p.x <= p2.x;
};

const isRightBetween = (p: Point | null, p1: Point, p2: Point) => {
  if (!p) {
    return false;
  }
  return p.x >= p1.x && p.y >= p1.y && p.x >= p2.x && p.y <= p2.y;
};

/**
 * 处理垂直边和水平边的情况
 */
const getVerticalOrHorizontalGapPoints = (options: {
  lines: Line[];
  d: number;
  starts: Point[];
}) => {
  const { lines, d, starts } = options;
  const [line1, line2] = lines;
  const [p1, p2] = starts;

  const intersectPoint = getIntersectPoint(line1, line2);

  /**
   *  A-------C
   *  |
   *  |
   *  B
   */
  if (line2.isHorizontal && line1.isVertical && isLeftTop(intersectPoint, line2.p1, line1.p1)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  if (line1.isHorizontal && line2.isVertical && isLeftTop(intersectPoint, line1.p1, line2.p1)) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   * A-------B
   *         |
   *         |
   *         C
   */
  if (line1.isHorizontal && line2.isVertical && isRightTop(intersectPoint, line1.p2, line2.p1)) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  if (line2.isHorizontal && line1.isVertical && isRightTop(intersectPoint, line2.p2, line1.p1)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  /**
   * A
   * |
   * |
   * B-------C
   */
  if (line2.isHorizontal && line1.isVertical && isLeftBottom(intersectPoint, line2.p1, line1.p2)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  if (line1.isHorizontal && line2.isVertical && isLeftBottom(intersectPoint, line1.p1, line2.p2)) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   *         A
   *         |
   *         |
   * B-------C
   */
  if (line1.isHorizontal && line2.isVertical && isRightBottom(intersectPoint, line1.p2, line2.p2)) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  if (line2.isHorizontal && line1.isVertical && isRightBottom(intersectPoint, line2.p2, line1.p2)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  return [];
};

/**
 * 处理都是水平边的情况
 */
const getHorizontalGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, d, starts } = options;
  const [p1, p2] = starts;
  const [, , splitLine] = lines;

  if (splitLine.k > 0) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  if (splitLine.k < 0) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  return [];
};

/*
 * 处理都是垂直边的情况
 */
const getVerticalGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { starts, d } = options;
  const [p1, p2] = starts;

  return [
    {
      x: p1.x,
      y: p1.y + d,
    },
    {
      x: p2.x,
      y: p2.y + d,
    },
  ];
};

/**
 * 处理垂直边和非水平垂直边的情况
 */
const getVerticalAndNotVHGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, starts, d } = options;
  const [line1, line2, splitLine] = lines;
  const [p1, p2] = starts;
  const [v1, v2] = [getLineUnitVector(line1), getLineUnitVector(line2)];
  const intersectPoint = getIntersectPoint(line1, line2);

  /**
   * A
   * | \
   * |  \
   * B   C
   */
  if (line1.isVertical && line2.k > 0 && isLeftTop(intersectPoint, line2.p1, line1.p1)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + d * v2.ux,
        y: p2.y + d * v2.uy,
      },
    ];
  }

  if (line2.isVertical && line1.k > 0 && isLeftTop(intersectPoint, line1.p1, line2.p1)) {
    return [
      {
        x: p1.x + d * v1.ux,
        y: p1.y + d * v1.uy,
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   * B  C
   * | /
   * |/
   * A
   */
  if (line1.isVertical && line2.k < 0 && isLeftBottom(intersectPoint, line1.p2, line2.p1)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (line2.isVertical && line1.k < 0 && isLeftBottom(intersectPoint, line2.p2, line1.p1)) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   *    C
   *   /
   *  /
   * A
   * |
   * |
   * B
   */
  if (
    line1.isVertical &&
    line2.k < 0 &&
    splitLine.k < 0 &&
    isLeftMiddle(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isVertical &&
    line1.k < 0 &&
    splitLine.k < 0 &&
    isLeftMiddle(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   * A
   * |
   * |
   * B
   *  \
   *   \
   *    C
   */
  if (
    line1.isVertical &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isLeftMiddle(intersectPoint, line1.p2, line2.p1)
  ) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isVertical &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isLeftMiddle(intersectPoint, line2.p2, line1.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   *    A
   *   /|
   *  / |
   * C  B
   */
  if (line1.isVertical && line2.k < 0 && isRightTop(intersectPoint, line2.p2, line1.p1)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (line2.isVertical && line1.k < 0 && isRightTop(intersectPoint, line1.p2, line2.p1)) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   * B  C
   *  \ |
   *   \|
   *    A
   */
  if (line1.isVertical && line2.k > 0 && isRightBottom(intersectPoint, line1.p2, line2.p2)) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (line2.isVertical && line1.k > 0 && isRightBottom(intersectPoint, line2.p2, line1.p2)) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   * A
   *  \
   *   \
   *    B
   *    |
   *    |
   *    C
   */
  if (
    line1.isVertical &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isRightMiddle(intersectPoint, line2.p2, line1.p1)
  ) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isVertical &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isRightMiddle(intersectPoint, line1.p2, line2.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  /**
   *    B
   *    |
   *    |
   *    A
   *   /
   *  /
   * C
   */
  if (
    line1.isVertical &&
    line2.k < 0 &&
    splitLine.k < 0 &&
    isRightMiddle(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x,
        y: p1.y + d,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isVertical &&
    line1.k < 0 &&
    splitLine.k < 0 &&
    isRightMiddle(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x,
        y: p2.y + d,
      },
    ];
  }

  return [];
};

/**
 * 处理水平边和非水平垂直边的情况
 */
const getHorizontalAndNotVHGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, starts, d } = options;
  const [line1, line2, splitLine] = lines;
  const [p1, p2] = starts;
  const [v1, v2] = [getLineUnitVector(line1), getLineUnitVector(line2)];
  const intersectPoint = getIntersectPoint(line1, line2);

  /**
   *    B
   *   /
   *  /
   * A——————C
   */
  // 分割线斜率为正
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    splitLine.k > 0 &&
    isLeftBottom(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    splitLine.k > 0 &&
    isLeftBottom(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftBottom(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftBottom(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   *     B
   *      \
   *       \
   * A——————C
   */
  // 分割线斜率为正
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isRightBottom(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isRightBottom(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightBottom(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightBottom(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   * A
   *  \
   *   \
   *    B——————C
   */
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isLeftBottomMiddle(intersectPoint, line2.p2, line1.p1)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isLeftBottomMiddle(intersectPoint, line1.p2, line1.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   *            A
   *           /
   *          /
   *  C——————B
   */
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    splitLine.k < 0 &&
    isRightBottomMiddle(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    splitLine.k < 0 &&
    isRightBottomMiddle(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   * A——————C
   *  \
   *   \
   *    B
   */
  // 分割线斜率为正
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isLeftTop(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isLeftTop(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  // 分割线斜率为负或垂直线
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftTop(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftTop(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   *   C——————B
   *         /
   *        /
   *       A
   */
  // 分割线斜率为正
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    splitLine.k > 0 &&
    isRightTop(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    splitLine.k > 0 &&
    isRightTop(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  // 分割线斜率为负或垂直线
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightTop(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightTop(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   *    B——————C
   *   /
   *  /
   * A
   */
  if (
    line1.isHorizontal &&
    line2.k < 0 &&
    splitLine.k < 0 &&
    isLeftTopMiddle(intersectPoint, line1.p1, line2.p2)
  ) {
    return [
      {
        x: p1.x + d,
        y: p1.y,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k < 0 &&
    splitLine.k < 0 &&
    isLeftTopMiddle(intersectPoint, line2.p1, line1.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d,
        y: p2.y,
      },
    ];
  }

  /**
   * A------B
   *         \
   *          \
   *          C
   */
  if (
    line1.isHorizontal &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isRightTopMiddle(intersectPoint, line1.p2, line2.p1)
  ) {
    return [
      {
        x: p1.x - d,
        y: p1.y,
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.isHorizontal &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isRightTopMiddle(intersectPoint, line2.p2, line1.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - d,
        y: p2.y,
      },
    ];
  }

  return [];
};

/**
 * 处理都不是水平垂直边的情况
 */
const getNotVHGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, d, starts } = options;
  const [line1, line2, splitLine] = lines;
  const [p1, p2] = starts;
  const [v1, v2] = [getLineUnitVector(line1), getLineUnitVector(line2)];
  const intersectPoint = getIntersectPoint(line1, line2);

  /**
   * A    B
   *  \  /
   *   \/
   *    C
   */
  if (line1.k > 0 && line2.k < 0 && isBottomBetween(intersectPoint, line1.p2, line2.p1)) {
    return [
      {
        x: p1.x + d * v1.ux,
        y: p1.y + d * v1.uy,
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (line2.k > 0 && line1.k < 0 && isBottomBetween(intersectPoint, line2.p2, line1.p1)) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + d * v2.ux,
        y: p2.y + d * v2.uy,
      },
    ];
  }

  /**
   *     B
   *    /
   *  A
   *    \
   *     C
   *
   */
  // 分割线斜率为正
  if (
    line1.k < 0 &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    isLeftBetween(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.k < 0 &&
    line1.k > 0 &&
    splitLine.k > 0 &&
    isLeftBetween(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负或垂直线
  if (
    line1.k < 0 &&
    line2.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftBetween(intersectPoint, line1.p1, line2.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.k < 0 &&
    line1.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isLeftBetween(intersectPoint, line2.p1, line1.p1)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  /**
   *    A
   *   / \
   *  B   C
   */
  if (line1.k < 0 && line2.k > 0 && isTopBetween(intersectPoint, line1.p2, line2.p1)) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (line2.k < 0 && line1.k > 0 && isTopBetween(intersectPoint, line2.p2, line1.p1)) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  /**
   * A
   *   \
   *    B
   *   /
   * C
   */
  // 分割线斜率为正
  if (
    line1.k > 0 &&
    line2.k < 0 &&
    splitLine.k > 0 &&
    isRightBetween(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.k > 0 &&
    line1.k < 0 &&
    splitLine.k > 0 &&
    isRightBetween(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负
  if (
    line1.k > 0 &&
    line2.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightBetween(intersectPoint, line1.p2, line2.p2)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  if (
    line2.k > 0 &&
    line1.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    isRightBetween(intersectPoint, line2.p2, line1.p2)
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  /**   B C
   *   / /
   *  / /
   *  A
   */
  // 分割线斜率为正
  if (
    line1.k < 0 &&
    line2.k < 0 &&
    splitLine.k > 0 &&
    (isLeftBottom(intersectPoint, line1.p1, line2.p1) ||
      isLeftBottom(intersectPoint, line2.p1, line1.p1))
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.k < 0 &&
    line2.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    (isLeftBottom(intersectPoint, line1.p1, line2.p1) ||
      isLeftBottom(intersectPoint, line2.p1, line1.p1))
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  /**
   *  B C
   *  \ \
   *   \ \
   *     A
   */
  // 分割线斜率为正
  if (
    line1.k > 0 &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    (isRightBottom(intersectPoint, line1.p2, line2.p2) ||
      isRightBottom(intersectPoint, line2.p2, line1.p2))
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.k > 0 &&
    line2.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    (isRightBottom(intersectPoint, line1.p2, line2.p2) ||
      isRightBottom(intersectPoint, line2.p2, line1.p2))
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  /**
   *     A
   *   / /
   *  / /
   * B C
   */
  // 分割线斜率为正
  if (
    line1.k < 0 &&
    line2.k < 0 &&
    splitLine.k > 0 &&
    (isRightTop(intersectPoint, line1.p2, line2.p2) ||
      isRightTop(intersectPoint, line2.p2, line1.p2))
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.k < 0 &&
    line2.k < 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    (isRightTop(intersectPoint, line1.p2, line2.p2) ||
      isRightTop(intersectPoint, line2.p2, line1.p2))
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  /**
   *  A
   *  \ \
   *   \ \
   *    B C
   */
  // 分割线斜率为正
  if (
    line1.k > 0 &&
    line2.k > 0 &&
    splitLine.k > 0 &&
    (isLeftTop(intersectPoint, line1.p1, line2.p1) || isLeftTop(intersectPoint, line2.p1, line1.p1))
  ) {
    return [
      {
        x: p1.x - Math.abs(d * v1.ux),
        y: p1.y - Math.abs(d * v1.uy),
      },
      {
        x: p2.x - Math.abs(d * v2.ux),
        y: p2.y - Math.abs(d * v2.uy),
      },
    ];
  }

  // 分割线斜率为负或为垂直线
  if (
    line1.k > 0 &&
    line2.k > 0 &&
    (splitLine.k < 0 || splitLine.isVertical) &&
    (isLeftTop(intersectPoint, line1.p1, line2.p1) || isLeftTop(intersectPoint, line2.p1, line1.p1))
  ) {
    return [
      {
        x: p1.x + Math.abs(d * v1.ux),
        y: p1.y + Math.abs(d * v1.uy),
      },
      {
        x: p2.x + Math.abs(d * v2.ux),
        y: p2.y + Math.abs(d * v2.uy),
      },
    ];
  }

  return [];
};

/**
 * 获取分割线平移一段距离d后的点，移动方向规则：
 * 1.新生成的分割线点需要在原始分割线点的正值区域
 * 参数说明：
 * 1)lines: [line1, line2, splitLine]
 *    - line1, line2: 与分割线相交的两条线
 *    - splitLine: 分割线
 * 2)starts: [p1, p2]
 *    - p1, p2: 分割线与line1、line2相交的两个点
 * 3)d: 往分割线正值区域移动的距离
 */
export const getGapPoints = (options: { lines: Line[]; d: number; starts: Point[] }) => {
  const { lines, starts, d } = options;
  const [line1, line2] = lines;
  /**
   * 排序一下交点，保持与line1，line2顺序一致
   */
  const [p1, p2] = starts.sort((a) => (isInTheLine(line1, a) ? -1 : 1));

  // 处理垂直边和水平边的情况
  if ((line1.isVertical && line2.isHorizontal) || (line1.isHorizontal && line2.isVertical)) {
    return getVerticalOrHorizontalGapPoints({
      lines,
      d,
      starts: [p1, p2],
    });
  }

  // 处理都是水平边的情况
  if ((line1.isHorizontal && line2.isHorizontal) || (line2.isHorizontal && line1.isHorizontal)) {
    return getHorizontalGapPoints({ lines, d, starts: [p1, p2] });
  }

  // 处理都是垂直边的情况
  if ((line1.isVertical && line2.isVertical) || (line1.isVertical && line2.isVertical)) {
    return getVerticalGapPoints({ lines, d, starts: [p1, p2] });
  }

  // 处理垂直边和非水平垂直边的情况
  if (
    (line1.isVertical && !line2.isVerticalOrHorizontal) ||
    (line2.isVertical && !line1.isVerticalOrHorizontal)
  ) {
    return getVerticalAndNotVHGapPoints({ lines, d, starts: [p1, p2] });
  }

  // 处理水平边和非水平垂直边的情况
  if (
    (line1.isHorizontal && !line2.isVerticalOrHorizontal) ||
    (line2.isHorizontal && !line1.isVerticalOrHorizontal)
  ) {
    return getHorizontalAndNotVHGapPoints({ lines, d, starts: [p1, p2] });
  }

  // 处理都不是水平垂直边的情况
  if (!line1.isVerticalOrHorizontal && !line2.isVerticalOrHorizontal) {
    return getNotVHGapPoints({ lines, d, starts: [p1, p2] });
  }

  return [];
};
