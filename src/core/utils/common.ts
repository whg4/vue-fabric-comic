import { fabric } from 'fabric';
import { Cell } from '../types';

export const getImageObject = (src: string) => {
  return new Promise<fabric.Image>((resolve, reject) => {
    try {
      fabric.Image.fromURL(src, (img) => {
        resolve(img);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const getClonedObject = (object: fabric.Object) => {
  return new Promise<fabric.Object>((resolve, reject) => {
    try {
      object.clone((clone: fabric.Object) => {
        resolve(clone);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const isBasicCell = (object: fabric.Object | null) => {
  return object?.cellType === Cell.BASIC;
};
