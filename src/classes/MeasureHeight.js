import * as Cesium from "cesium";

//高度测量类
export default class MeasureHeight {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.positions = [];
    this.vertexEntities = [];
    this.lineEntities = [];
    this.circleEntities = [];
    this.labelEntities = [];
    this.measureHeight = 0; //测量结果
    this.isMeasure = false;
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
    this.isMeasure = true;
    this.circleRadius = 0.1;
  }

  //禁用
  deactivate() {
    if (!this.isMeasure) return;

    //将结果全部固定
    let firstPoint = this.vertexEntities[this.vertexEntities.length - 2];
    firstPoint.position = this.positions[0];
    let secondPoint = this.vertexEntities[this.vertexEntities.length - 1];
    secondPoint.position = this.positions[1];
    let line = this.lineEntities[this.lineEntities.length - 1];
    line.polyline.positions = this.positions;
    let label = this.labelEntities[this.labelEntities.length - 1];
    label.position = this.positions[1];
    label.text = "高度：" + this.measureHeight + " 米";
    let circle = this.circleEntities[this.circleEntities.length - 1];
    circle.position = this.positions[1];
    circle.ellipse = {
      height: Cesium.Cartographic.fromCartesian(this.positions[this.positions.length - 1]).height,
      semiMinorAxis: this.circleRadius,
      semiMajorAxis: this.circleRadius,
      material: Cesium.Color.YELLOW.withAlpha(0.5),
    }

    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'pointer';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
    this.positions = [];
  }

  //清空绘制
  clear() {
    //清除线对象
    this.lineEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.lineEntities = [];

    //清除文本
    this.labelEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.labelEntities = [];

    //移除圆
    this.circleEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.circleEntities = [];

    //清除节点
    this.vertexEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.vertexEntities = [];
  }

  //创建线对象
  createLineEntity() {
    let line = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.positions;
        }, false),
        width: 2,
        material: Cesium.Color.YELLOW,
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
        }),
      }
    });
    this.lineEntities.push(line);
  }

  //创建结果文本标签
  createLabel() {
    let label = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(e => {
        return this.positions[this.positions.length - 1]; //返回最后一个点
      }, false), label: {
        text: "",
        scale: 0.5,
        font: 'normal 40px MicroSoft YaHei',
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

  //创建线节点
  createVertex(index) {
    let vertexEntity = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(e => {
        return this.positions[index];
      }, false), type: "MeasureHeightVertex", point: {
        color: Cesium.Color.FUCHSIA, pixelSize: 6,
        //disableDepthTestDistance: 2000,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //创建圆 这样方便看出水平面的高低
  createCircleEntity() {
    let circle = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(e => {
        return this.positions[this.positions.length - 1]; //返回最后一个点
      }, false),
      ellipse: {
        height: new Cesium.CallbackProperty(e => {
          return Cesium.Cartographic.fromCartesian(this.positions[this.positions.length - 1]).height;
        }, false),
        semiMinorAxis: new Cesium.CallbackProperty(e => {
          return this.circleRadius;
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty(e => {
          return this.circleRadius;
        }, false),
        material: Cesium.Color.YELLOW.withAlpha(0.5),
      },
    });
    this.circleEntities.push(circle);
  }

  //注册鼠标事件
  registerEvents() {
    this.leftClickEvent();
    this.rightClickEvent();
    this.mouseMoveEvent();
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

      if (this.positions.length === 0) { //首次点击
        this.positions.push(position);
        this.createVertex(0);
        this.createLineEntity();
        this.createCircleEntity();
        this.createLabel();
      } else { //第二次点击结束测量
        this.measureEnd();
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
        position = this.viewer.scene.camera.pickEllipsoid(e.startPosition, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.handleMoveEvent(position);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //处理鼠标移动
  handleMoveEvent(position) {
    if (this.positions.length < 1) return;
    let firstPoint = Cesium.Cartographic.fromCartesian(this.positions[0]); //第一个点
    let movePoint = Cesium.Cartographic.fromCartesian(position); //鼠标移动点
    const h = movePoint.height - firstPoint.height;
    const secondPosition = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(firstPoint.longitude), Cesium.Math.toDegrees(firstPoint.latitude), movePoint.height);
    if (this.positions.length < 2) {
      this.positions.push(secondPosition);
      this.createVertex(1);
    } else {
      this.positions[1] = secondPosition;
      this.measureHeight = h.toFixed(3);
      this.labelEntities[this.labelEntities.length - 1].label.text = "高度：" + this.measureHeight + " 米"
    }
    //计算圆的半径
    this.circleRadius = Cesium.Cartesian3.distance(secondPosition, position);
  }

  //右键事件
  rightClickEvent() {
    this.handler.setInputAction(e => {
      if (this.isMeasure) {
        this.deactivate();
        this.clear();
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //测量结束
  measureEnd() {
    this.deactivate();
    this.MeasureEndEvent.raiseEvent(this.measureHeight); //触发结束事件 传入结果
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
}
