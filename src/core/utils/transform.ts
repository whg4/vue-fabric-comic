/* eslint-disable @typescript-eslint/no-explicit-any */
import { fabric } from 'fabric';
import { Point } from './types';

export const transformPoints = (obj: any, points: Point[]) => {
  // see: http://fabricjs.com/using-transformations
  const matrix = obj.calcTransformMatrix();
  return points.map((item: Point) => {
    // 将坐标转换为相对于原点的坐标
    const point = new fabric.Point(item.x - obj.pathOffset.x, item.y - obj.pathOffset.y);
    // 将坐标转换到对应在画布上的坐标(画布未平移和缩放的情况下)
    const selfTransformedPoint = fabric.util.transformPoint(point, matrix);
    // 将坐标转换到对应在画布上的坐标(画布已平移和缩放的情况下)
    const viewTransformPoint = fabric.util.transformPoint(
      selfTransformedPoint,
      obj.canvas.viewportTransform
    );
    return viewTransformPoint;
  });
};

export const getPointsFromObject = (obj: any): Point[] | null => {
  if (obj.type === 'rect') {
    return [
      {
        x: obj.oCoords.tl.x,
        y: obj.oCoords.tl.y,
      },
      {
        x: obj.oCoords.tr.x,
        y: obj.oCoords.tr.y,
      },
      {
        x: obj.oCoords.br.x,
        y: obj.oCoords.br.y,
      },
      {
        x: obj.oCoords.bl.x,
        y: obj.oCoords.bl.y,
      },
    ];
  }

  if (obj.type === 'polygon') {
    return transformPoints(obj, obj.points);
  }

  // svg或json没有做处理的情况
  if (obj.path) {
    const path = obj.path;
    const pointSet = new Set<string>();
    path.forEach((item: [string, number, number]) => {
      const [, x, y] = item;
      if (x !== undefined && y !== undefined) {
        pointSet.add(`${x}-${y}`);
      }
    });

    const points = [...pointSet.values()].map((item) => {
      const [x, y] = item.split('-');
      return { x: parseFloat(x), y: parseFloat(y) };
    });

    return transformPoints(obj, points);
  }

  return null;
};

export const invertViewTransform = (p: Point, viewportTransform: number[]) => {
  const invertMatrix = fabric.util.invertTransform(viewportTransform);
  return fabric.util.transformPoint(new fabric.Point(p.x, p.y), invertMatrix);
};
