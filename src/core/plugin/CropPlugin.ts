/*
 * @Description: 图片裁剪插件
 */

import { fabric } from 'fabric';
import Editor from '../core';
import { getClonedObject, getImageObject } from '../utils/common';
import { transformPoint } from '../utils/transform';
import {
  ControlDeleteEvent,
  EDITOR_EVENTS,
  SetCellImageOptions,
  TRANSFORM_IMAGE_ID,
} from '../types';
export interface SetCropOptions extends SetCellImageOptions {
  object: fabric.Object;
}

class CropPlugin {
  canvas: fabric.Canvas;
  editor: Editor;
  static pluginName = 'CropPlugin';
  static apis = ['setCellImage', 'clearCellImage'];
  static events = [];
  hotkeys: string[] = [];
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
    this.editor.on(EDITOR_EVENTS.DELETE, this._handleDelete);
  }

  _detachEvents() {
    this.canvas.off('mouse:dblclick', this._handleMouseDbClick);
    this.editor.off(EDITOR_EVENTS.DELETE, this._handleDelete);
  }

  /**
   * 处理删除事件，当删除transform image时，需要将其内部的图片移除
   */
  _handleDelete = async (event: ControlDeleteEvent) => {
    const { objects } = event;
    const transformImage = objects.find((obj) => obj.id === TRANSFORM_IMAGE_ID);

    if (!transformImage) {
      return;
    }

    if (!transformImage._group) {
      return;
    }

    const innerImage = transformImage._group.getObjects().find((obj) => obj.type === 'image') as
      | fabric.Image
      | undefined;

    if (!innerImage) {
      return;
    }

    const substituteImage = await getImageObject('');
    substituteImage.set({
      originX: 'center',
      originY: 'center',
      selectable: false,
    });
    transformImage._group.insertAt(substituteImage, 0, true);
    this.canvas.renderAll();
  };

  _handleMouseDbClick = async () => {
    const activeObject = this.canvas.getActiveObject();
    const groupObject = activeObject
      ? activeObject.type !== 'group'
        ? activeObject.group
        : activeObject
      : null;

    console.log('groupObject', groupObject);
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

    const transformImage = await getClonedObject(innerImage);
    transformImage.set({
      // 标识为transformImage
      id: TRANSFORM_IMAGE_ID,
      left: topLeft.x,
      top: topLeft.y,
      width: innerImage.width,
      height: innerImage.height,
      scaleX: innerImage.scaleX! * groupObject.scaleX!,
      scaleY: innerImage.scaleY! * groupObject.scaleY!,
      angle: innerImage.angle,
      opacity: 0.5,
      // 标识所归属的group
      _group: groupObject as fabric.Group,
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
    transformImage.on('moving', () => {
      this._handleCropTransform({
        innerImage: innerImage,
        transformImage: transformImage,
        groupObject,
      });
    });

    transformImage.on('scaling', () => {
      this._handleCropTransform({
        innerImage: innerImage,
        transformImage: transformImage,
        groupObject,
      });
    });

    transformImage.on('rotating', () => {
      innerImage.set('angle', transformImage.angle);
    });

    transformImage.on('deselected', () => {
      /**
       * 当被操作的图片被取消选中时，将该图片移除
       */
      this.canvas.remove(transformImage);
      groupObject.set('selectable', true);
    });
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
      scaleX: transformImage.scaleX! / groupObject.scaleX!,
      scaleY: transformImage.scaleY! / groupObject.scaleY!,
    });
  }

  /**
   * 设置格子图片url或其他属性
   */
  setCellImage(params: SetCellImageOptions) {
    const { src, ...other } = params;
    const activeObject = this.canvas.getActiveObject();
    console.log('activeObject', activeObject);
    if (!activeObject) {
      console.warn('no active object');
      return;
    }

    if (activeObject.id === TRANSFORM_IMAGE_ID) {
      console.log('transformImage can not set image');
      return;
    }

    const options = {
      src,
      object: activeObject,
      ...other,
    };

    switch (activeObject.type) {
      case 'group':
        this._handleSetGroupImage(options);
        break;
      default:
        this._handleSetImage(options);
    }
  }

  /**
   * 清除格子图片
   */
  async clearCellImage() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) {
      console.warn('clearCellImage no active object');
      return;
    }

    const groupObject = activeObject.type !== 'group' ? activeObject.group : activeObject;
    if (!groupObject || groupObject.type !== 'group') {
      return;
    }

    const innerImage = (groupObject as fabric.Group)
      .getObjects()
      .find((obj) => obj.type === 'image');

    if (!innerImage) {
      return;
    }

    const substituteImage = await getImageObject('');
    substituteImage.set({
      originX: 'center',
      originY: 'center',
      selectable: false,
    });
    (groupObject as fabric.Group).insertAt(substituteImage, 0, true);
  }

  /**
   *  处理组对象，替换组对象中的图片
   */
  async _handleSetGroupImage(options: SetCropOptions) {
    const { src, ...other } = options;
    console.log('group', options);
    const group = options.object as fabric.Group;
    const subObjects = group.getObjects();
    const image = subObjects.find((obj) => obj.type === 'image') as fabric.Image | undefined;

    if (!image) {
      console.log('can not find image in group');
      return;
    }

    const substituteImage = await getImageObject(src);
    const zoom = this.canvas.getZoom();
    substituteImage.set({
      ...other,
      originX: 'center',
      originY: 'center',
      scaleX: (1 / zoom) * group.scaleX!,
      scaleY: (1 / zoom) * group.scaleY!,
      selectable: false,
    });
    group.insertAt(substituteImage, 0, true);
    this.canvas.renderAll();
  }

  /**
   * 处理不是组的对象的图片替换
   */
  async _handleSetImage(options: SetCropOptions) {
    try {
      const { src, object, ...other } = options;
      object.setCoords();
      const clonedObject = await getClonedObject(object);
      const image = await getImageObject(src);
      const zoom = this.canvas.getZoom();
      image.set({
        ...other,
        originX: 'center',
        originY: 'center',
        scaleX: (1 / zoom) * object.scaleX!,
        scaleY: (1 / zoom) * object.scaleY!,
        selectable: false,
      });
      clonedObject.set({
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        selectable: false,
      });

      const point = new fabric.Point(object.left!, object.top!);
      const group = new fabric.Group([image, clonedObject], {
        width: clonedObject.width! * clonedObject.scaleX!,
        height: clonedObject.height! * clonedObject.scaleY!,
        originX: 'left',
        originY: 'top',
        left: point.x,
        top: point.y,
        clipPath: clonedObject,
      });
      this.canvas.remove(object);
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
    } catch (error) {
      console.log('_handleSetImage error', error);
    }
  }

  destroy() {
    console.log('CropPlugin destroy');
    this._detachEvents();
  }
}

export default CropPlugin;
