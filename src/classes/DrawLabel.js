import * as Cesium from "cesium";
import {ElMessage, ElMessageBox} from "element-plus";

//文字标签类
export default class DrawLabel {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.pointEntities = [];
    this.labelEntities = [];
    this.positions = [];
    this.isActive = false;
  }

  //初始化事件
  initEvents() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.MeasureStartEvent = new Cesium.Event(); //开始事件
    this.MeasureEndEvent = new Cesium.Event(); //结束事件
  }

  //激活
  activate() {
    this.deactivate();
    this.registerEvents(); //注册鼠标事件
    //设置鼠标状态
    this.viewer.enableCursorStyle = false;
    this.viewer._element.style.cursor = 'default';
    this.isActive = true;
  }

  //禁用
  deactivate() {
    if (!this.isActive) return;
    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'default';
    this.viewer.enableCursorStyle = true;
    this.isActive = false;
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
    this.positions = [];
    this.pointEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.pointEntities = [];
    this.labelEntities.forEach(item => {
      this.viewer.entities.remove(item);
    })
    this.labelEntities = [];
  }

  //创建点位
  createPoint() {
    let entity = this.viewer.entities.add({
      id: "point" + this.positions[this.positions.length - 1],
      position: this.positions[this.positions.length - 1],
      point: {
        color: Cesium.Color.ANTIQUEWHITE,
        pixelSize: 10,
        disableDepthTestDistance: 500,
      }
    });
    this.pointEntities.push(entity);
  }

  //创建标签
  createLabel(text) {
    let label = this.viewer.entities.add({
      position: this.positions[this.positions.length - 1],
      label: {
        text: text,
        scale: 0.5,
        font: 'normal 26px MicroSoft YaHei',
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
        scaleByDistance: new Cesium.NearFarScalar(30, 2, 100000, 1),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE
      }
    });
    this.labelEntities.push(label);
  }

  getLabelAndDraw() {
    ElMessageBox.prompt('请输入标签内容', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(({ value }) => {
      this.createPoint();
      this.createLabel(value);
    }).catch(() => {
      ElMessage({
        type: 'info',
        message: '取消输入'
      });
    });
  }

  //左键点击事件
  leftClickEvent() {
    //单击鼠标左键画点点击事件
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.position);
      if (!position) {
        position = this.viewer.scene.camera.pickEllipsoid(e.position, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.positions.push(position);
      this.getLabelAndDraw();
      this.deactivate();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //右键点击事件
  rightClickEvent() {
    //单击鼠标右键结束
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      this.deactivate();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

}