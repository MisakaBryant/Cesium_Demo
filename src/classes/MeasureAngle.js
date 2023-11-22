import * as Cesium from "cesium";

//测量方位角类
export default class MeasureAngle {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.positions = [];
    this.northPositions = [];
    this.pointEntities = [];
    this.lineEntities = [];
    this.labelEntities = [];
    this.measureAngle = 0; //测量结果
    this.isMeasure = false;
  }

  //初始化事件
  initEvents() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.MeasureStartEvent = new Cesium.Event(); //开始事件
    this.MeasureEndEvent = new Cesium.Event(); //结束事件
  }

  //显示测量结果
  showMeasureResult() {
    this.labelEntities.forEach(item => {
      this.viewer.entities.add(item);
    })
  }

  //隐藏测量结果
  hideMeasureResult() {
    this.labelEntities.forEach(item => {
      this.viewer.entities.remove(item);
    })
  }

  //激活
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

    //将结果全部固定
    let point = this.pointEntities[this.pointEntities.length - 1]
    point.position = this.positions[0];
    let arrow = this.lineEntities[this.lineEntities.length - 2];
    arrow.polyline.positions = this.positions;
    let northLine = this.lineEntities[this.lineEntities.length - 1];
    northLine.polyline.positions = this.northPositions;
    let label = this.labelEntities[this.labelEntities.length - 1];
    label.position = this.positions[0];
    label.label.text = "方位角：" + this.measureAngle.toFixed(2) + "°";

    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'default';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
    this.positions = [];
    this.northPositions = [];
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

    //清除点
    this.pointEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.pointEntities = [];
  }

  //创建线对象
  createLineEntity() {
    //创建箭头
    let arrow = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.positions;
        }, false),
        width: 10,
        material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.ORANGE,
        }),
        clampToGround: true,
      }
    });
    this.lineEntities.push(arrow);
    //创建北向线
    let northLine = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.northPositions;
        }, false),
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
        }),
        clampToGround: true,
      }
    });
    this.lineEntities.push(northLine);
  }

  //创建点位
  createPoint() {
    let entity = this.viewer.entities.add({
      id: "point" + this.positions[0],
      position: this.positions[0],
      point: {
        color: Cesium.Color.GREEN,
        pixelSize: 6,
        disableDepthTestDistance: 500,
      }
    });
    this.pointEntities.push(entity);
  }

  //创建结果文本标签
  createLabel() {
    let label = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(e => {
        return this.positions[0];
      }, false),
      label: {
        text: "",
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
        this.northPositions.push(position);
        this.createPoint();
        this.createLineEntity();
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
    let len = Math.sqrt(Math.pow(movePoint.longitude - firstPoint.longitude, 2) + Math.pow(movePoint.latitude - firstPoint.latitude, 2));
    Cesium.Cartographic.fromDegrees(
      Cesium.Math.toDegrees(firstPoint.longitude),
      Cesium.Math.toDegrees(firstPoint.latitude + len),
      0
    );
    //北向点
    let northPosition = Cesium.Cartesian3.fromDegrees(
      Cesium.Math.toDegrees(firstPoint.longitude),
      Cesium.Math.toDegrees(firstPoint.latitude + len),
      0
    );  //北向点笛卡尔位置
    if (this.positions.length < 2) {
      this.positions.push(position);
      this.northPositions.push(northPosition);
    } else {
      this.positions[1] = position;
      this.northPositions[1] = northPosition;
      this.measureAngle = this.courseAngle(firstPoint.longitude, firstPoint.latitude, movePoint.longitude, movePoint.latitude);
      this.labelEntities[this.labelEntities.length - 1].label.text = "方位角：" + this.measureAngle.toFixed(2) + "°";
    }
  }

  /**
   * 计算两个点的方位角度
   * @param lng_a
   * @param lat_a
   * @param lng_b
   * @param lat_b
   * @return {number}
   */
  courseAngle(lng_a, lat_a, lng_b, lat_b) {

    //以a点为原点建立局部坐标系（东方向为y轴,北方向为x轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
    // const localToWorld_Matrix = Cesium.Transforms.northEastDownToFixedFrame(
    //     new Cesium.Cartesian3.fromDegrees(lng_a, lat_a)
    // );

    //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
    const localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      new Cesium.Cartesian3.fromDegrees(lng_a, lat_a)
    );
    //求世界坐标到局部坐标的变换矩阵
    const worldToLocal_Matrix = Cesium.Matrix4.inverse(
      localToWorld_Matrix,
      new Cesium.Matrix4()
    );
    //a点在局部坐标的位置，其实就是局部坐标原点
    const localPosition_A = Cesium.Matrix4.multiplyByPoint(
      worldToLocal_Matrix,
      new Cesium.Cartesian3.fromDegrees(lng_a, lat_a),
      new Cesium.Cartesian3()
    );
    //B点在以A点为原点的局部的坐标位置
    const localPosition_B = Cesium.Matrix4.multiplyByPoint(
      worldToLocal_Matrix,
      new Cesium.Cartesian3.fromDegrees(lng_b, lat_b),
      new Cesium.Cartesian3()
    );

    //弧度
    const angle = Math.atan2(
      localPosition_B.x - localPosition_A.x,
      localPosition_B.y - localPosition_A.y
    );
    //角度
    let theta = angle * (180 / Math.PI);
    if (theta < 0) {
      theta = theta + 360;
    }
    return theta;
  }

  //右键事件
  rightClickEvent() {
    this.handler.setInputAction(e => {
      if (this.isMeasure) {
        this.deactivate();
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //测量结束
  measureEnd() {
    this.deactivate();
    this.MeasureEndEvent.raiseEvent(this.measureAngle); //触发结束事件 传入结果
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

}
