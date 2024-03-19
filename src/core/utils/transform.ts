/* eslint-disable @typescript-eslint/no-explicit-any */
import { fabric } from 'fabric';
import { Point } from './types';

export const transformPoint = (point: fabric.Point, matrix: number[]) => {
  return fabric.util.transformPoint(point, matrix);
};

const getRectPoints = (rect: fabric.Rect) => {
  if (rect.oCoords && !rect.group) {
    return [rect.oCoords!.tl, rect.oCoords!.tr, rect.oCoords!.br, rect.oCoords!.bl];
  }

  // @ts-expect-error ingore
  if (!rect.group || !rect.lineCoords) {
    return null;
  }

  const group = rect.group;
  const groupTransformMatrix = group.calcTransformMatrix() as number[];
  // @ts-expect-error ingore
  const lineCoords = rect.lineCoords;
  const rectPoints = [lineCoords.tl, lineCoords.tr, lineCoords.br, lineCoords.bl];

  // 还原到画布上的坐标
  const transformPoints = rectPoints.map((item) => {
    const invertGroup = transformPoint(item, groupTransformMatrix);
    const invertView = transformPoint(invertGroup, rect.canvas!.viewportTransform as number[]);
    return invertView;
  });

  return transformPoints;
};

const getPolygonPoints = (polygon: fabric.Polygon) => {
  const points = polygon.points || [];
  const matrix = polygon.calcTransformMatrix() as number[];
  const viewTransform = polygon.canvas!.viewportTransform as number[];
  if (!polygon.group) {
    const transform = points.map((item: Point) => {
      // 将坐标转换为相对于原点的坐标
      const point = new fabric.Point(item.x - polygon.pathOffset.x, item.y - polygon.pathOffset.y);
      // 将坐标转换到对应在画布上的坐标(画布未平移和缩放的情况下)
      const selfTransformedPoint = transformPoint(point, matrix);
      // 将坐标转换到对应在画布上的坐标(画布已平移和缩放的情况下)
      const viewTransformPoint = transformPoint(selfTransformedPoint, viewTransform);
      return viewTransformPoint;
    });
    return transform;
  }

  const groupTransformMatrix = polygon.group.calcTransformMatrix() as number[];
  const transform = points.map((item: Point) => {
    const point = new fabric.Point(item.x - polygon.pathOffset.x, item.y - polygon.pathOffset.y);
    const invertGroup = transformPoint(point, groupTransformMatrix);
    const invertView = transformPoint(invertGroup, viewTransform);
    return invertView;
  });

  return transform;
};

export const getPointsFromObject = (obj: any): Point[] | null => {
  if (obj.type === 'rect') {
    return getRectPoints(obj as fabric.Rect);
  }

  if (obj.type === 'polygon') {
    return getPolygonPoints(obj as fabric.Polygon);
  }

  // 针对格子的情况
  if (obj.type === 'group') {
    const group = obj as fabric.Group;
    const objects = group.getObjects();
    const cellObject = objects[1];
    return getPointsFromObject(cellObject);
  }

  return null;
};

export const invertViewTransform = (p: Point, viewportTransform: number[]) => {
  const invertMatrix = fabric.util.invertTransform(viewportTransform);
  return fabric.util.transformPoint(new fabric.Point(p.x, p.y), invertMatrix);
};
