import * as Cesium from "cesium";
import ViewShedStage from "./ViewShedStage";

export default class MeasureView {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.centerPosition = null;
    this.tmpPosition = null;
    this.viewshed = [];
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

    this.viewshed[this.viewshed.length - 1].viewPosition = this.centerPosition;
    this.viewshed[this.viewshed.length - 1].viewPositionEnd = this.tmpPosition;
    this.centerPosition = null;
    this.tmpPosition = null;

    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'default';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
  }

  //创建视域分析
  createViewShed() {
    if (!this.centerPosition) return;
    let viewShedStage = new ViewShedStage(this.viewer, {
      viewPosition: this.centerPosition,
      viewHeading: 30,
      viewPitch: 30,
    });
    this.viewshed.push(viewShedStage);
  }

  //注册鼠标事件
  registerEvents() {
    this.leftClickEvent();
    this.rightClickEvent();
    this.mouseMoveEvent();
  }

  //鼠标左键事件
  leftClickEvent() {
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.position);
      if (!position) {
        position = this.viewer.scene.camera.pickEllipsoid(e.position, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      if (this.centerPosition == null) {
        this.centerPosition = position;
        this.tmpPosition = position;
        this.createViewShed();
      } else {
        this.deactivate();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //鼠标移动事件
  mouseMoveEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure) return;
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.endPosition);
      if (!position) {
        position = this.viewer.scene.camera.pickEllipsoid(e.endPosition, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.tmpPosition = position;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //鼠标右键事件
  rightClickEvent() {
    //单击鼠标右键结束事件
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      this.deactivate();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //注销鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //清除
  clear() {
    for (let i = 0; i < this.viewshed.length; i++) {
      this.viewshed[i].clear();
    }
  }
}


