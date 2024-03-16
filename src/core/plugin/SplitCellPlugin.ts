/**
 * 手动分格插件
 */
import Editor from '../core';
import { fabric } from 'fabric';
import { getPointsFromObject, invertViewTransform } from '../utils/transform';
import {
  getGapPoints,
  getIntersectPoint,
  getLines,
  getSeparatePointsByLine,
  isSameLine,
  reArragePoints,
} from '../utils/linear-equation';
import { Line } from '../utils/line';
import { Point } from '../utils/types';
import { grahamScan } from '../utils/gram-scan';
import { isBasicCell } from '../utils/common';

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

  constructor(canvas: fabric.Canvas, editor: Editor) {
    this.canvas = canvas;
    this.editor = editor;

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._init();
  }

  _init() {
    this._attachEvents();
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

  _handleMouseDown(event: fabric.IEvent) {
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
    console.log('event', event);
    console.log('activeObject', activeObject);

    // 挪到最上层
    activeObject.bringToFront();
    // 锁定分格对象的位置
    activeObject.set({
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      selectable: false,
      hasControls: false,
      hasBorders: false,
      opacity: 0.4,
    });

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
  }

  _handleMouseMove(event: fabric.IEvent) {
    const activeObject = this.canvas.getActiveObject();
    const pointer = event.pointer;
    if (!pointer || !this.isSplitMode || isBasicCell(activeObject)) {
      return;
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
  }

  _handleMouseUp(event: fabric.IEvent) {
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

    // 计算距离分割线一定距离的点
    const gapPoints = getGapPoints({
      lines: [...lines, splitLine],
      d: this.splitLineGap,
      starts: intersectPoints,
    });
    console.log('gapPoints', gapPoints);

    const [positivePoints, negativePoints] = reArragePoints({
      separatePoints: getSeparatePointsByLine(points, splitLine),
      lines,
      splitLine,
    });
    console.log('positivePoints, negativePoints', positivePoints, negativePoints);

    const shape1Points = grahamScan([...positivePoints, ...intersectPoints]).map((point) =>
      invertViewTransform(point, this.canvas.viewportTransform as number[])
    );
    const splitShape1 = new fabric.Polygon(shape1Points, {
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      selectable: true,
    });

    const shape2Points = grahamScan([...negativePoints, ...gapPoints]).map((point) =>
      invertViewTransform(point, this.canvas.viewportTransform as number[])
    );
    const splitShape2 = new fabric.Polygon(shape2Points, {
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      selectable: true,
    });

    this.canvas.add(splitShape1);
    this.canvas.add(splitShape2);
    this.canvas.remove(activeObject);

    this.isSplitMode = false;
    this.editor.emit('splitModeChange', this.isSplitMode);
  }

  _recoverSplitObject() {
    if (this.splitObject) {
      // 还原分格对象的位置
      this.splitObject.moveTo(this.splitObjectIdx);
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
      this.splitObject = null;
    }
  }

  _attachEvents() {
    this.canvas.on('mouse:down', this._handleMouseDown);
    this.canvas.on('mouse:move', this._handleMouseMove);
    this.canvas.on('mouse:up', this._handleMouseUp);
  }

  _detachEvents() {
    this.canvas.off('mousedown', this._handleMouseDown);
    this.canvas.off('mouse:move', this._handleMouseMove);
    this.canvas.off('mouse:up', this._handleMouseUp);
  }

  /**
   * 设置分格模式是否启用
   * @param isSplitMode 是否为分格模式
   */
  setSplitMode(isSplitMode: boolean) {
    this.isSplitMode = isSplitMode;
  }

  getSplitMode() {
    return this.isSplitMode;
  }

  destory() {
    console.log('SplitCellPlugin destory');
    this._detachEvents();
  }
}
