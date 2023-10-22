import * as Cesium from "cesium";
import {Cartesian3} from "cesium";

//距离测量类
export default class MeasureDistanceFitTerrain {
  init(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.positions = [];        //存储确定点位
    this.tempPositions = [];    //存储点位
    this.vertexEntities = [];   //存储点位实体
    this.lineEntities = [];     //存储线实体
    this.labelEntities = [];
    this.measureDistance = 0; //测量结果
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
    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'default';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
    this.tempPositions = [];
    this.positions = [];
  }

  //计算距离
  spaceDistance(positions) {
    let distance = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      distance += Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
    }
    return distance.toFixed(2);
  }

  //清空绘制
  clear() {
    //清除线对象
    this.lineEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.lineEntities = [];
    this.lineEntity = undefined;

    //清除节点
    this.vertexEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.vertexEntities = [];
  }

  //创建线对象
  createLineEntity() {
    this.lineEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.tempPositions;
        }, false),
        width: 2,
        material: Cesium.Color.YELLOW,
        depthFailMaterial: Cesium.Color.YELLOW,
        clampToGround: true,
      }
    })
  }

  //创建线节点
  createVertex(pos) {
    this.measureDistance = this.spaceDistance(this.positions);
    let vertexEntity = this.viewer.entities.add({
      // position: this.positions[this.positions.length - 1],
      position: pos,
      id: "MeasureDistanceVertex" + this.positions[this.positions.length - 1],
      type: "MeasureDistanceVertex",
      label: {
        text: this.measureDistance + "米",
        scale: 0.5,
        font: 'normal 24px MicroSoft YaHei',
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
        scaleByDistance: new Cesium.NearFarScalar(30, 2, 100000, 1),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 8,
        disableDepthTestDistance: 500,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //创建起点
  createStartEntity() {
    let vertexEntity = this.viewer.entities.add({
      position: this.positions[0],
      type: "MeasureDistanceVertex",
      billboard: {
        image: "../pic/point.png",
        scaleByDistance: new Cesium.NearFarScalar(30, 0.3, 100000, 0.1), //设置随图缩放距离和比例
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000), //设置可见距离 10000米可见
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 6,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //创建终点节点
  createEndEntity() {
    //结束时删除最后一个节点的距离标识
    let lastLabel = this.viewer.entities.getById("MeasureDistanceVertex" + this.positions[this.positions.length - 1]);
    this.viewer.entities.remove(lastLabel);
    this.viewer.entities.remove(this.moveVertexEntity);

    this.measureDistance = this.spaceDistance(this.positions);

    let vertexEntity = this.viewer.entities.add({
      position: this.positions[this.positions.length - 1],
      type: "MeasureDistanceVertex",
      label: {
        text: "总距离：" + this.measureDistance + "米",
        scale: 0.5,
        font: 'normal 26px MicroSoft YaHei',
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
        scaleByDistance: new Cesium.NearFarScalar(30, 2, 100000, 1),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -50),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE,
        eyeOffset: new Cesium.Cartesian3(0, 0, -10)
      },
      billboard: {
        image: "../pic/point.png",
        scaleByDistance: new Cesium.NearFarScalar(30, 0.3, 100000, 0.1), //设置随图缩放距离和比例
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000), //设置可见距离 10000米可见
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 6,
      },
    });
    this.vertexEntities.push(vertexEntity);
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

      let flag = false;

      if (this.positions.length > 0) {
        var input = [];
        input.push(this.positions[this.positions.length - 1]);
        input.push(position);
        this.pointInterpolation(input).then(res => {
          //console.log(res);
          let arr = [];
          for (let i = 1; ; i++) {
            if (!res.get(i)) break;
            arr.push(res.get(i));
          }
          flag = true;
          this.positions.push(...arr);

          //console.log(this.positions);
          // this.positions.push(position);
          this.createVertex(position);
        });
      } else {
        this.positions.push(position);
        //console.log(this.positions[0]);
      }


      if (this.positions.length === 1) { //首次点击
        this.createLineEntity();
        this.createStartEntity();
        // this.createVertex();
        return;
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
    this.tempPositions = this.positions.concat(position);
  }

  // 插值
  pointInterpolation(points) {
    let arr = new Map();
    let distance = this.spaceDistance(points);
    // let duration = Math.floor(parseFloat(distance)) / 2;
    let duration = 20;
    return new Promise((resolve) => {
      for (let i = 1; i <= duration; i++) {
        let pos = Cesium.Cartesian3.lerp(points[0], points[1], i / duration, new Cesium.Cartesian3());
        //console.log("1" + pos)
        this.getTerrainHeight(pos).then((res) => {
          arr.set(i, res);
          if (arr.size === duration) {
            console.log(arr);
            resolve(arr);
          }
        });
      }
    });
  }

  // 获取地形高度
  getTerrainHeight(position) {
    //console.log("2" + position);
    let cartographic = [];
    cartographic.push(Cesium.Cartographic.fromCartesian(position));

    let promise = Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, cartographic);

    let temp = cartographic[0];

    return new Promise((resolve, reject) => {
      promise.then((updatedCartographic) => {
        temp.height = updatedCartographic[0].height;
        let res = Cesium.Cartesian3.fromRadians(temp.longitude, temp.latitude, temp.height);
        //console.log("3" + res);
        resolve(res);
      }, (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  //右键事件
  rightClickEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure || this.positions.length < 1) {
        this.deactivate();
        this.clear();
      } else {
        this.createEndEntity();
        this.lineEntity.polyline = {
          positions: this.positions,
          width: 2,
          material: Cesium.Color.YELLOW,
          depthFailMaterial: Cesium.Color.YELLOW,
          clampToGround: true,
        };
        this.lineEntities.push(this.lineEntity);
        this.measureEnd();
      }

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //测量结束
  measureEnd() {
    this.deactivate();
    this.MeasureEndEvent.raiseEvent(this.measureDistance); //触发结束事件 传入结果
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
}
