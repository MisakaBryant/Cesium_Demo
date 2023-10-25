import * as Cesium from "cesium";
import "./cesium-viewshed.js";

export default class MeasureView {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.viewshed = [];
    this.viewModel = { verticalAngle: 90, horizontalAngle: 120, distance: 10 };
    this.isMeasure = false;
  }

  //初始化事件
  initEvents() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.MeasureStartEvent = new Cesium.Event(); //开始事件
    this.MeasureEndEvent = new Cesium.Event(); //结束事件
  }

  activate() {
    this.deactivate();
    this.registerEvents(); //注册鼠标事件
    //设置鼠标状态
    this.viewer.enableCursorStyle = false;
    this.viewer._element.style.cursor = 'default';
    this.isMeasure = true;
  }

  //禁用
  deactivate() {
    if (!this.isMeasure) return;
    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'default';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
  }

  //注册鼠标事件
  registerEvents() {
    this.leftClickEvent();
    this.rightClickEvent();
  }

  //注销鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //清除
  clear() {
    this.viewshed.forEach(item => {
      item.destroy();
    });
  }
}



// 清除可视域
viewshed.destroy();