/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*
 * @Description: 格子插件
 */

import { fabric } from 'fabric';
import Editor from '../core';
import { getClonedObject, getImageObject } from '../utils/common';
import { transformPoint } from '../utils/transform';
import {
  Cell,
  CellSplitEvent,
  ControlDeleteEvent,
  EDITOR_EVENTS,
  SetCellImageOptions,
} from '../types';
export interface SetCropOptions extends SetCellImageOptions {
  object: fabric.Object;
}

export interface SetRemarkOptions {
  remark: string;
  object: fabric.Object;
}

/**
 * 格子插件，管理格子内部的对象
 * Group内部对象，顺序按以下位置排序：
 * 1. Group
 * 	1.1 image
 *  1.2 格子（用作裁剪路径）
 * 2. 备注
 */

class CellPlugin {
  canvas: fabric.Canvas;
  editor: Editor;
  static pluginName = 'CellPlugin';
  static apis = [
    'setCellImage',
    'clearCellImage',
    'setCellExtProps',
    'setCellRemark',
    'setCellRemarkVisible',
  ];
  static events = [];
  hotkeys: string[] = [];

  /**
   * 基础缩放比例
   */
  basicZoom = 0.13;

  /**
   * 备注是否显示
   */
  isRemarkVisible = true;

  /**
   * 备注属性
   */
  remarkProps = {
    maxlength: 500,
    placeholder: `备注仅作为您制作漫画的参考使用，不会出现在最终漫画作品中`,
  };

  constructor(canvas: fabric.Canvas, editor: Editor) {
    this.canvas = canvas;
    this.editor = editor;

    this._init();
  }

  _init() {
    this._attachEvents();
  }

  _attachEvents() {
    this.canvas.on('mouse:dblclick', this._handleMouseDbClick);
    this.canvas.on('object:scaling', this._handleCellScaling);
    this.editor.on(EDITOR_EVENTS.DELETE, this._handleDelete);
    this.editor.on(EDITOR_EVENTS.CELL_SPLIT, this._handleCellSplit);
  }

  _detachEvents() {
    this.canvas.off('mouse:dblclick', this._handleMouseDbClick);
    this.canvas.off('object:scaling', this._handleCellScaling);
    this.editor.off(EDITOR_EVENTS.DELETE, this._handleDelete);
    this.editor.off(EDITOR_EVENTS.CELL_SPLIT, this._handleCellSplit);
  }

  _getScalingOperateTarget(target?: fabric.Object) {
    if (!target) {
      return null;
    }

    if (target.type !== 'group') {
      return target;
    }

    const groupTarget = target as fabric.Group;
    const innerGroup = groupTarget.getObjects().find((object) => object.type === 'group') as
      | fabric.Group
      | undefined;

    if (!innerGroup) {
      return null;
    }

    const cellObject = innerGroup.getObjects().find((object) => object.type !== 'image');
    if (cellObject) {
      return cellObject;
    }

    return null;
  }

  /**
   * 格子缩放，让格子边框保持视觉宽度（近式）一致
   */
  _handleCellScaling = (e: fabric.IEvent) => {
    const target = e.target;
    const operatingTarget = this._getScalingOperateTarget(target);

    if (!operatingTarget || !target || target.cellType !== Cell.BASIC) {
      return;
    }

    if (!operatingTarget._strokeWidth) {
      operatingTarget._strokeWidth = operatingTarget.strokeWidth || 10;
    }

    const baseStrokeWidth = operatingTarget._strokeWidth!;

    const strokeWidth = Math.floor(baseStrokeWidth / ((target.scaleX! + target.scaleY!) / 2));

    operatingTarget.set({
      strokeWidth,
      width: operatingTarget.width! * operatingTarget.scaleX!,
      height: operatingTarget.height! * operatingTarget.scaleY!,
      scaleX: 1,
      scaleY: 1,
    });
  };

  /**
   * 当格子发生分割时，继承被分割格子的图片、备注等信息
   */
  async _handleCellSplit(event: CellSplitEvent) {
    const { splitObjects, originObject, splitLine } = event;
    if (
      originObject.cellType !== 'basic'
      // (originObject.type !== 'group' && originObject.cellType === 'basic')
    ) {
      return;
    }
    const group = originObject as fabric.Group;

    const { _ext } = group;
    const [first, second] = splitObjects;
    /**
     * 保持顺序，图片集成在左边或上方的格子
     */
    let assignObject = first;
    if (splitLine.k > 0 || splitLine.k < 0 || splitLine.isVertical) {
      assignObject = second;
    }
    assignObject.set({ _ext: _ext });

    // 发生格子分割时，继承被分割格子的图片、备注等信息
    const innerGroup = group.getObjects().find((item) => item.type === 'group') as
      | fabric.Group
      | undefined;
    if (!innerGroup) {
      return;
    }
    const imageObject = innerGroup.getObjects().find((item) => item.type === 'image') as
      | fabric.Image
      | undefined;
    const textBoxObject = group.getObjects().find((item) => item.type === 'textbox') as
      | fabric.Textbox
      | undefined;

    const imgEle = imageObject?.getElement();
    // 继承图片
    if (imgEle?.src) {
      this.canvas.setActiveObject(assignObject);
      await this.setCellImage({ src: imgEle.src, ...(_ext || {}) });
    }

    // 继承备注
    if (textBoxObject?.text) {
      if (!imgEle?.src) {
        this.canvas.setActiveObject(assignObject);
      }
      this.setCellRemark(textBoxObject.text);
    }
  }

  /**
   * 处理删除事件，当删除transform image时，需要将其内部的图片移除
   */
  _handleDelete = async (event: ControlDeleteEvent) => {
    const { objects } = event;
    const transformImage = objects.find((obj) => obj.cellType === 'transform-image');

    if (!transformImage) {
      return;
    }

    if (!transformImage._group) {
      return;
    }

    const innerImage = transformImage._group.getObjects().find((obj) => obj.type === 'image') as
      | fabric.Image
      | undefined;
    const cellObject = transformImage._group.getObjects().find((obj) => obj.type !== 'image');

    if (!innerImage || !cellObject) {
      return;
    }

    cellObject.set('fill', '#fff');
    transformImage._group.remove(innerImage);
    this.canvas.renderAll();
  };

  _handleMouseDbClick = async () => {
    const activeObject = this.canvas.getActiveObject();
    const groupObject = activeObject
      ? activeObject.type !== 'group'
        ? activeObject.group
        : activeObject
      : null;

    console.log('===CellPlusin === groupObject', groupObject);
    if (!groupObject || groupObject.type !== 'group') {
      return;
    }

    const subObjects = (groupObject as fabric.Group).getObjects();
    const innerImage = subObjects.find((obj) => obj.type === 'image') as fabric.Image | undefined;
    const hasImageEl = innerImage?.getElement() instanceof HTMLImageElement;
    // 如果group里面没有Image对象，或者Image对象没有element属性，则不进行裁剪
    if (!innerImage || !hasImageEl) {
      return;
    }

    // update coordinates
    innerImage.setCoords();
    console.log('innerImage', innerImage);
    /**
     * 将内部图片相对于组的left、top转换为相对于画布的left、top
     */
    const topLeft = transformPoint(
      new fabric.Point(innerImage.left!, innerImage.top!),
      groupObject.calcTransformMatrix() as number[]
    );
    console.log('topLeft', topLeft);

    const transformImage = (await getClonedObject(innerImage)) as fabric.Image;
    const outerGroup = groupObject.group;
    const outerGroupScaleX = outerGroup?.scaleX || 1;
    const outerGroupScaleY = outerGroup?.scaleY || 1;
    transformImage.set({
      // 标识为transformImage
      left: topLeft.x,
      top: topLeft.y,
      width: innerImage.width,
      height: innerImage.height,
      scaleX: innerImage.scaleX! * groupObject.scaleX! * outerGroupScaleX,
      scaleY: innerImage.scaleY! * groupObject.scaleY! * outerGroupScaleY,
      angle: innerImage.angle,
      opacity: 0.5,
      cellType: 'transform-image',
      // 标识所归属的group
      _group: groupObject.cellType === 'basic' ? (groupObject as fabric.Group) : groupObject.group,
    });
    groupObject.set('selectable', false);

    console.log('transformImage', transformImage);
    this.canvas.add(transformImage);
    this.canvas.setActiveObject(transformImage);

    this._attachTransformEvents({
      innerImage,
      transformImage,
      groupObject,
    });
  };

  _attachTransformEvents(options: {
    innerImage: fabric.Object;
    transformImage: fabric.Object;
    groupObject: fabric.Object;
  }) {
    const { innerImage, transformImage, groupObject } = options;
    const handleMoveAndScale = () => {
      this._handleCropTransform(options);
    };
    const handleRotate = () => {
      innerImage.set('angle', transformImage.angle);
    };
    const handleDeSelected = () => {
      transformImage.off('moving', handleMoveAndScale);
      transformImage.off('scaling', handleMoveAndScale);
      transformImage.off('rotating', handleRotate);
      transformImage.off('deselected', handleDeSelected);
      /**
       * 当被操作的图片被取消选中时，将该图片移除
       */
      this.canvas.remove(transformImage);
      groupObject.set('selectable', true);
    };

    transformImage.on('moving', handleMoveAndScale);
    transformImage.on('scaling', handleMoveAndScale);
    transformImage.on('rotating', handleRotate);
    transformImage.on('deselected', handleDeSelected);
  }

  /**
   * 处理被裁剪的图片变换，根据被操作的图片变换裁剪的图片
   * 的位置、缩放、角度等
   */
  _handleCropTransform(options: {
    innerImage: fabric.Object;
    transformImage: fabric.Object;
    groupObject: fabric.Object;
  }) {
    const { innerImage, transformImage, groupObject } = options;
    const outerGroup = groupObject.group;
    const outerGroupScaleX = outerGroup?.scaleX || 1;
    const outerGroupScaleY = outerGroup?.scaleY || 1;
    // 调用setCoords方法更新innerImage的坐标
    innerImage.setCoords();

    const imageTop = innerImage.top!;
    const imageLeft = innerImage.left!;
    const transformTop = transformImage.top!;
    const transformLeft = transformImage.left!;

    /**
     * 将内部图片相对于组的left、top转换为相对于画布的left、top
     */
    const topLeft = transformPoint(
      new fabric.Point(imageLeft, imageTop),
      groupObject.calcTransformMatrix() as number[]
    );
    const newLeft = imageLeft + transformLeft - topLeft.x;
    const newTop = imageTop + transformTop - topLeft.y;

    innerImage.set({
      left: newLeft,
      top: newTop,
      /**
       * 对于内部的scale，因为组的scale已经应用到了内部的scale上了，所以需要消除组的scale
       */
      scaleX: transformImage.scaleX! / groupObject.scaleX! / outerGroupScaleX,
      scaleY: transformImage.scaleY! / groupObject.scaleY! / outerGroupScaleY,
    });
  }

  /**
   * 设置格子图片url或其他属性
   */
  setCellImage(params: SetCellImageOptions) {
    const { src, ...other } = params;
    const activeObject = this.canvas.getActiveObject();
    console.log('==== setCellImage activeObject ====', activeObject);
    // 只有cellType为basic的对象才能设置图片
    if (
      !activeObject ||
      (activeObject.cellType !== Cell.BASIC && activeObject.cellType !== Cell.TRANSFORM_IMAGE)
    ) {
      console.warn('no active object');
      return;
    }

    const options = {
      src,
      object:
        activeObject.cellType === Cell.TRANSFORM_IMAGE
          ? (activeObject._group as fabric.Group)
          : activeObject,
      ...other,
    };
    switch (activeObject.type) {
      // 还有选中图片的场景
      case 'image':
      case 'group':
        return this._handleSetGroupImage(options);
      default:
        return this._handleSetImage(options);
    }
  }

  /**
   * 清除格子图片
   */
  async clearCellImage(objectToClear?: fabric.Object) {
    const activeObject = objectToClear || this.canvas.getActiveObject();
    if (!activeObject) {
      console.warn('clearCellImage no active object');
      return;
    }

    const groupObject = activeObject.type !== 'group' ? activeObject._group : activeObject;
    if (!groupObject || (groupObject.type !== 'group' && groupObject.cellType !== 'basic')) {
      return;
    }

    const outerGroup = groupObject as fabric.Group;
    const innerGroup = outerGroup.getObjects().find((obj) => obj.type === 'group') as
      | fabric.Group
      | undefined;

    if (!innerGroup) {
      return;
    }

    const cellObject = innerGroup.getObjects().find((obj) => obj.type !== 'image');
    const imageObject = innerGroup.getObjects().find((obj) => obj.type === 'image');

    if (imageObject) {
      innerGroup.remove(imageObject);
    }

    if (cellObject) {
      cellObject.set('fill', '#fff');
    }
    this.canvas.setActiveObject(groupObject);
    this.canvas.renderAll();
  }

  /**
   *  处理组对象，替换组对象中的图片
   */
  async _handleSetGroupImage(options: SetCropOptions) {
    try {
      const { src, object } = options;
      console.log('_handleSetGroupImage ===', options);
      const outerGroup = object as fabric.Group;
      const innerGroup = outerGroup.getObjects().find((obj) => obj.type === 'group') as
        | fabric.Group
        | undefined;

      if (!innerGroup) {
        return;
      }

      const subObjects = innerGroup.getObjects();
      const cellObject = subObjects.find((obj) => obj.type !== 'image');
      const imageObject = innerGroup.getObjects().find((obj) => obj.type === 'image');

      if (imageObject) {
        innerGroup.remove(imageObject);
      }
      if (!cellObject) {
        console.log('can not find cell in group');
        return;
      }

      cellObject.set('fill', 'transparent');
      outerGroup.set({ _ext: object._ext, cellType: 'basic' });
      const substituteImage = await getImageObject(src);
      const clonedInnerGroup = (await getClonedObject(innerGroup)) as fabric.Group;
      const imageScale = (object.width! * object.scaleX!) / substituteImage.width!;
      substituteImage.set({
        originX: 'center',
        originY: 'center',
        scaleX: imageScale,
        scaleY: imageScale,
        selectable: false,
      });

      clonedInnerGroup.set('perPixelTargetFind', true);
      clonedInnerGroup.insertAt(substituteImage, 0, true);
      clonedInnerGroup.insertAt(cellObject, 1, true);
      outerGroup.insertAt(clonedInnerGroup, 0, true);
      this.canvas.renderAll();
      this.canvas.setActiveObject(outerGroup);
    } catch (error) {
      console.log('_handleSetGroupImage error', error);
    }
  }

  /**
   * 处理不是组的对象的图片替换
   */
  async _handleSetImage(options: SetCropOptions) {
    try {
      const { src, object } = options;
      object.setCoords();
      const clonedObject = await this._getClonedCellObject(object);
      const image = await getImageObject(src);
      // 图片对齐格子宽度
      const imageScale = (object.width! * object.scaleX!) / image.width!;
      image.set({
        originX: 'center',
        originY: 'center',
        scaleX: imageScale,
        scaleY: imageScale,
        selectable: false,
      });

      const point = new fabric.Point(object.left!, object.top!);
      const groupProps = this._getCommonGroupProps(object);

      const innerGroup = new fabric.Group([image, clonedObject], {
        ...groupProps,
        left: 0,
        top: 0,
        perPixelTargetFind: true,
        clipPath: clonedObject,
      });
      const outerGroup = new fabric.Group([innerGroup], {
        cellType: 'basic',
        _ext: object._ext,
        ...groupProps,
        left: point.x,
        top: point.y,
      });
      // 将删除放到最后了，因为先删会导致activeObject为null
      this.canvas.add(outerGroup);
      this.canvas.setActiveObject(outerGroup);
      this.canvas.remove(object);
    } catch (error) {
      console.log('_handleSetImage error', error);
    }
  }

  /**
   * 	设置格子扩展属性
   */
  setCellExtProps(properties: Record<string, string>, objectToSet?: fabric.Object) {
    const activeObject = objectToSet || this.canvas.getActiveObject();
    if (!activeObject) {
      console.warn('setCellExtProps no active object');
      return;
    }

    if (activeObject.cellType === 'basic' && activeObject.type === 'group') {
      const group = activeObject as fabric.Group;
      group._ext = properties;
    }
  }

  // 设置格子备注
  setCellRemark(remark: string) {
    const activeObject = this.canvas.getActiveObject();
    console.log('=====setCellRemark activeObject =====', activeObject);
    if (
      !activeObject ||
      (activeObject.cellType !== 'basic' && activeObject.cellType !== Cell.TRANSFORM_IMAGE)
    ) {
      console.warn('setCellRemark no active object');
      return;
    }

    switch (activeObject.type) {
      case 'group':
      case 'image':
        return this.handleSetGroupRemark({
          remark,
          group:
            activeObject.cellType === Cell.TRANSFORM_IMAGE
              ? (activeObject._group as fabric.Group)
              : (activeObject as fabric.Group),
        });
      default:
        return this.handleSetCellRemark({
          object: activeObject,
          remark,
        });
    }
  }

  // 获取备注textbox
  _getRemarkTextbox(options: { remark: string; object: fabric.Object }) {
    const { remark, object } = options;
    const zoom = this.canvas.getZoom();
    const padding = 88 * (this.basicZoom / zoom);
    const textBox = new fabric.Textbox(remark, {
      left: 0,
      top: 0,
      width: object.width! - padding * 2,
      height: object.height! - padding * 2,
      fontSize: 64,
      fontFamily: 'Acme-Regular',
      scaleX: object.scaleX,
      scaleY: object.scaleY,
      fill: '#fff',
      stroke: '#332828',
      originX: 'center',
      originY: 'center',
      maxlength: this.remarkProps.maxlength,
      placeholder: this.remarkProps.placeholder,
      selectable: false,
      splitByGrapheme: true,
      hasControls: false,
      visible: this.isRemarkVisible,
    });
    return textBox;
  }

  async _getClonedCellObject(object: fabric.Object) {
    const clonedObject = await getClonedObject(object);
    clonedObject.set({
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      fill: 'transparent',
      selectable: false,
    });
    return clonedObject;
  }

  _getCommonGroupProps(object: fabric.Object) {
    const groupProps = {
      originX: 'left',
      originY: 'top',
      width: object.width! * object.scaleX!,
      height: object.height! * object.scaleY!,
      // 不要缩放
      scaleX: 1,
      scaleY: 1,
    };

    return groupProps;
  }

  _getOuterGroupClipPath(object: fabric.Object) {
    const clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      width: object.width,
      height: object.height,
    });
    return clipPath;
  }

  async handleSetGroupRemark(options: { remark: string; group: fabric.Group }) {
    const { group, remark } = options;
    // 不是格子
    if (group.cellType !== 'basic') {
      return;
    }

    const remarkTextBox = group.getObjects().find((item) => item.type === 'textbox') as
      | fabric.Textbox
      | undefined;
    const innerGroup = group.getObjects().find((item) => item.type === 'group') as
      | fabric.Group
      | undefined;
    // 已有备注
    if (remarkTextBox) {
      return;
    }
    innerGroup?.set('perPixelTargetFind', true);
    const textBox = this._getRemarkTextbox({ remark, object: group });
    group.insertAt(textBox, 1, true);
    this.canvas.renderAll();
  }

  async handleSetCellRemark(options: SetRemarkOptions) {
    const { object, remark } = options;
    const clonedObject = await this._getClonedCellObject(object);
    const textBox = this._getRemarkTextbox({ remark, object });
    const groupProps = this._getCommonGroupProps(object);
    const innerGroup = new fabric.Group([clonedObject], {
      ...groupProps,
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
      perPixelTargetFind: true,
      clipPath: clonedObject,
    });
    const outerGroup = new fabric.Group([innerGroup, textBox], {
      ...groupProps,
      cellType: 'basic',
      left: object.left,
      top: object.top,
    });
    this.canvas.add(outerGroup);
    this.canvas.setActiveObject(outerGroup);
    this.canvas.remove(object);
  }

  /**
   * 设置格子备注显隐
   */
  setCellRemarkVisible(visible: boolean) {
    this.isRemarkVisible = visible;
    const objects = this.canvas.getObjects();
    const cellObjects = objects.filter(
      (obj) => obj.cellType === 'basic' && obj.type === 'group'
    ) as fabric.Group[];
    for (const group of cellObjects) {
      const textBox = group.getObjects().find((item) => item.type === 'textbox');

      if (textBox) {
        textBox.set('visible', visible);
      }
    }
    this.canvas.renderAll();
  }

  destroy() {
    console.log('CellPlugin destroy');
    this._detachEvents();
  }
}

export default CellPlugin;
