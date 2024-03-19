/// <reference types="vite/client" />

// import { Object } from 'fabric/fabric-impl';

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  declare module 'fabric/fabric-impl' {
    interface IObjectOptions {
      /**
       * 标识
       */
      id?: string | undefined;

      _group?: fabric.Group;

      /**
       * 格子类型，
       * basic: 基础格子，不能被拆分
       */
      cellType?: 'basic';

      /**
       * 拓展属性
       */
      _ext?: unknown;
    }
  }
}

export as namespace vfe;
declare module 'vfe' {
  export as namespace vfe;
  export interface ICanvas extends fabric.Canvas {
    c: fabric.Canvas;
    editor: Editor;
  }
}
