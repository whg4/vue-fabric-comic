export interface ControlDeleteEvent {
  originEvent: MouseEvent;
  target: fabric.Transform;
  objects: fabric.Object[];
}

export enum Cell {
  /**
   * 基础格子，不能被拆分
   */
  BASIC = 'basic',
}

export interface SetCellImageOptions {
  src: string;
  /**
   * 其他属性，可以设置图片的自定义属性
   */
  [key: string]: unknown;
}

export enum EDITOR_EVENTS {
  /**
   * 分格模式改变
   */
  SPLIT_MODE_CHANGE = 'splitModeChange',

  /**
   * 删除事件
   */
  DELETE = 'delete',

  /**
   * 格子分割事件
   */
  CELL_SPLIT = 'cellSplit',
}

export const TRANSFORM_IMAGE_ID = 'TRANSFORM_IMAGE';
