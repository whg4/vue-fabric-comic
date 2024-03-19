/**
 * 手动分格插件
 */
import Editor from '../core';
import { fabric } from 'fabric';
import { getPointsFromObject, invertViewTransform } from '../utils/transform';
import {
  getIntersectPoint,
  getLines,
  getSeparatePointsByLine,
  isSameLine,
} from '../utils/linear-equation';
import { Line } from '../utils/line';
import { Point } from '../utils/types';
import { grahamScan } from '../utils/gram-scan';
import { isBasicCell } from '../utils/common';
import { getGapPoints } from '../utils/split-helper';
import { EDITOR_EVENTS } from '../types';

export default class SplitCellPlugin {
  public canvas: fabric.Canvas;
  public editor: Editor;
  static pluginName = 'SplitCellPlugin';
  static apis = ['setSplitMode', 'getSplitMode'];
  static events = [];
  public hotkeys: string[] = [];

  /**
   * 是否为分格模式
   */
  isSplitMode = false;

  /**
   * 最小吸附距离
   */
  minSnapDistance = 5;

  /**
   * 分格对象
   */
  splitObject: fabric.Object | null = null;

  /**
   * 分格对象的索引
   */
  splitObjectIdx = 0;

  /**
   * 吸附线的样式
   */
  snapLineStyle = {
    strokeWidth: 2,
    stroke: '#1499FF',
  };

  /**
   * 被分割格子的起始边
   */
  startLine: Line | null = null;

  /**
   * 吸附线
   */
  snapLine: fabric.Line | null = null;

  /**
   * 吸附线的方程
   */
  snapLineLF: Line | null = null;

  /**
   * 分割线
   */
  splitLine: fabric.Line | null = null;

  /**
   * 分格线的点，存起点和终点
   */
  splitLinePoints: fabric.Point[] = [];

  /**
   * 分格线的样式
   */
  splitLineStyle = {
    stroke: '#1499FF',
    strokeWidth: 2,
  };

  /**
   * 分格线的间隙
   */
  splitLineGap = 10;

  /**
   * 基础缩放比例
   */
  basicZoom = 0.18;

  constructor(canvas: fabric.Canvas, editor: Editor) {
    this.canvas = canvas;
    this.editor = editor;
  }

  _removeSnapLine() {
    if (this.snapLine) {
      this.canvas.remove(this.snapLine);
      this.snapLine = null;
      this.snapLineLF = null;
    }
  }

  _drawSnapLine(pointer: fabric.Point) {
    const activeObject = this.canvas.getActiveObject() || this.splitObject;
    if (!activeObject) {
      return;
    }

    const points = getPointsFromObject(activeObject);
    // console.log('_drawSnapLine points', points);
    if (!points) {
      return;
    }

    /**
     * 找出最近的一条边，然后绘制一条高亮的线
     */
    const lines = getLines(points);
    const lineDistances = lines
      .map((line) => {
        return {
          line,
          distance: line.getDistance(pointer),
        };
      })
      .sort((a, b) => a.distance - b.distance);

    const shouldSnapLine = lineDistances[0].distance < this.minSnapDistance;
    if (!shouldSnapLine) {
      this._removeSnapLine();
      return;
    }

    const { line } = lineDistances[0];
    // console.log('line', line);

    /**
     * 将线的坐标转换为画布上的坐标, 画布已经平移和缩放的情况下
     * 需要将画布的变换矩阵转换为逆矩阵
     * 然后将线的坐标转换为画布未缩放和平移的坐标
     */
    const inversePoints = [line.p1, line.p2].map((point) =>
      invertViewTransform(point, this.canvas.viewportTransform as number[])
    );
    // console.log('inversePoints', inversePoints);
    const snapLine = new fabric.Line(
      [inversePoints[0].x, inversePoints[0].y, inversePoints[1].x, inversePoints[1].y],
      {
        stroke: this.snapLineStyle.stroke,
        strokeWidth: this.snapLineStyle.strokeWidth / this.canvas.getZoom(),
        selectable: false,
      }
    );

    // console.log('snapLine', snapLine);
    this._removeSnapLine();
    this.snapLine = snapLine;
    this.snapLineLF = line;
    this.canvas.add(snapLine);
    this.snapLine.bringToFront();
  }

  _lockSplitObject(object: fabric.Object) {
    if (this.splitObject !== object) {
      this._recoverSplitObject();
    }

    object.set({
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      selectable: false,
      hasControls: false,
      hasBorders: false,
      opacity: 0.4,
    });
  }

  _handleMouseDown = (event: fabric.IEvent) => {
    const activeObject = this.canvas.getActiveObject() || this.splitObject;
    const pointer = event.pointer;

    if (!activeObject || !pointer) {
      return;
    }

    /**
     * 画线的起始条件是
     * 1）有起始吸附线
     * 2）不是是基础格子
     * 3）是分格模式
     * */
    if (!this.snapLine || !this.isSplitMode || isBasicCell(activeObject)) {
      return;
    }
    this._recoverSplitObject();
    console.log('event', event);
    console.log('activeObject', activeObject);

    // 挪到最上层
    activeObject.bringToFront();
    // 锁定分格对象的位置
    this._lockSplitObject(activeObject);

    this.splitLinePoints.push(pointer);
    this.startLine = this.snapLineLF;
    this._removeSnapLine();
    // 禁用多选
    this.canvas.selection = false;

    this.splitObject = activeObject;
    this.splitObjectIdx = this.canvas.getObjects().indexOf(activeObject);
    console.log('splitObjectIdx', this.splitObjectIdx);

    const p = invertViewTransform(pointer, this.canvas.viewportTransform as number[]);
    const splitLine = new fabric.Line([p.x, p.y, p.x, p.y], {
      strokeWidth: this.splitLineStyle.strokeWidth / this.canvas.getZoom(),
      stroke: this.splitLineStyle.stroke,
      selectable: false,
    });
    this.splitLine = splitLine;
    this.canvas.add(splitLine);
  };

  _getInheritObject(object: fabric.Object) {
    if (object.type !== 'group') {
      return object;
    }

    const group = object as fabric.Group;
    const objects = group.getObjects();
    const cellObject = objects[1];

    return cellObject ? cellObject : object;
  }

  _handleMouseMove = (event: fabric.IEvent) => {
    const activeObject = this.canvas.getActiveObject();
    const pointer = event.pointer;
    if (!pointer || !this.isSplitMode || isBasicCell(activeObject)) {
      return;
    }

    if (activeObject) {
      this._lockSplitObject(activeObject);
    }

    this.canvas.setCursor('url(//assets.dreame.com/dreame/image/pen.png), auto');

    // 绘制吸附线
    this._drawSnapLine(pointer);

    if (this.snapLine && activeObject) {
      this.splitObject = activeObject;
    }

    if (this.splitLine) {
      const p = invertViewTransform(pointer, this.canvas.viewportTransform as number[]);
      this.splitLine.set({
        x2: p.x,
        y2: p.y,
      });
      this.canvas.renderAll();
    }
  };

  _handleMouseUp = (event: fabric.IEvent) => {
    const pointer = event.pointer as fabric.Point;
    this.splitLinePoints.push(pointer);
    const snapLineLF = this.snapLineLF;
    const splitLinePoints = this.splitLinePoints;

    this._removeSnapLine();
    // 清除分割线
    if (this.splitLine) {
      this.canvas.remove(this.splitLine);
      this.splitLine = null;
    }

    this.splitLinePoints = [];

    const activeObject = this.canvas.getActiveObject() || this.splitObject;

    this._recoverSplitObject();
    if (!this.isSplitMode || !activeObject || isBasicCell(activeObject)) {
      return;
    }

    console.log('mouseup', event);
    console.log('activeObject', activeObject);

    // 确保线存在且不是同一条线
    if (!this.startLine || !snapLineLF) {
      return;
    }

    const isSameWithStartLine = isSameLine(snapLineLF, this.startLine);
    if (isSameWithStartLine || splitLinePoints.length !== 2) {
      return;
    }

    console.log('splitLinePoints', splitLinePoints);
    console.log('snapLine', this.startLine, snapLineLF);

    const splitLine = new Line(splitLinePoints);
    const lines = [this.startLine, snapLineLF];
    const intersectPoints = lines
      .map((line) => getIntersectPoint(splitLine, line))
      .filter((p) => p !== null) as Point[];
    console.log('intersectPoints', intersectPoints);
    console.log('splitLine', splitLine);

    const points = getPointsFromObject(activeObject);
    if (intersectPoints.length !== 2 || !points) {
      return;
    }
    console.log('lines', lines);

    /**
     * 平移分割线，生成d长度的间隔
     * 平移方向为向分割线的正值区域
     */
    const zoom = this.canvas.getZoom();
    const gapPoints = getGapPoints({
      lines: [...lines, splitLine],
      d: this.splitLineGap / (this.basicZoom / zoom),
      starts: intersectPoints,
    });
    console.log('gapPoints', gapPoints);
    // 如果没有间隙点，不进行分格
    if (!gapPoints.length) {
      return;
    }

    /**
     * 将点分为两部分，一部分在分割线的正值区域，一部分在分割线的负值区域
     */
    const [positivePoints, negativePoints] = getSeparatePointsByLine(points, splitLine);
    console.log('positivePoints, negativePoints', positivePoints, negativePoints);

    const shape1Points = grahamScan([...negativePoints, ...intersectPoints]).map((point) =>
      invertViewTransform(point, this.canvas.viewportTransform as number[])
    );
    const shape2Points = grahamScan([...positivePoints, ...gapPoints]).map((point) =>
      invertViewTransform(point, this.canvas.viewportTransform as number[])
    );
    const inheritObject = this._getInheritObject(activeObject);
    const splitShape1 = new fabric.Polygon(shape1Points, {
      fill: inheritObject.fill,
      stroke: inheritObject.stroke,
      strokeWidth: inheritObject.strokeWidth,
      selectable: true,
    });

    const splitShape2 = new fabric.Polygon(shape2Points, {
      fill: inheritObject.fill,
      stroke: inheritObject.stroke,
      strokeWidth: inheritObject.strokeWidth,
      selectable: true,
    });

    this.canvas.add(splitShape1);
    this.canvas.add(splitShape2);
    this.canvas.remove(activeObject);

    this.setSplitMode(false);
    this.editor.emit(EDITOR_EVENTS.CELL_SPLIT, {
      splitObjects: [splitShape1, splitShape2],
      originObject: activeObject,
    });
    this.editor.emit(EDITOR_EVENTS.SPLIT_MODE_CHANGE, this.isSplitMode);
  };

  _recoverSplitObject() {
    if (this.splitObject) {
      // 还原分格对象的位置
      // this.splitObject.moveTo(this.splitObjectIdx);
      this.splitObject.set({
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        opacity: 1,
      });
      this.canvas.renderAll();
      this.splitObject = null;
    }
  }

  _attachEvents() {
    this.canvas.on('mouse:down', this._handleMouseDown);
    this.canvas.on('mouse:move', this._handleMouseMove);
    this.canvas.on('mouse:up', this._handleMouseUp);
  }

  _detachEvents() {
    this.canvas.off('mouse:down', this._handleMouseDown);
    this.canvas.off('mouse:move', this._handleMouseMove);
    this.canvas.off('mouse:up', this._handleMouseUp);
  }

  /**
   * 设置分格模式是否启用
   * @param isSplitMode 是否为分格模式
   */
  setSplitMode(isSplitMode: boolean) {
    this.isSplitMode = isSplitMode;
    if (isSplitMode) {
      this._attachEvents();
    } else {
      this._detachEvents();
      this._recoverSplitObject();
    }
  }

  getSplitMode() {
    return this.isSplitMode;
  }

  destory() {
    console.log('SplitCellPlugin destory');
    this._detachEvents();
  }
}
