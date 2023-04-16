import * as Cesium from "cesium";

// 面积测量类
export default class MeasureArea {
    init(viewer) {
        this.viewer = viewer
        this.entityCollection = []
    }
    measurePolygon() {
        var positions = [];
        var clickStatus = false;
        var labelEntity = null;
        this.viewer.screenSpaceEventHandler.setInputAction((clickEvent) => {
            clickStatus = true;
            var cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(clickEvent.position), this.viewer.scene);
            if (!cartesian) {
                return false
            }
            if (positions.length == 0) {
                positions.push(cartesian.clone()); //鼠标左击 添加第1个点
                this.addPoint(cartesian);

                this.viewer.screenSpaceEventHandler.setInputAction((moveEvent) => {
                    var movePosition = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(moveEvent.endPosition), this.viewer.scene);
                    if (!movePosition) {
                        return false;
                    }
                    if (positions.length == 1) {
                        positions.push(movePosition);
                        this.addLine(positions);
                    } else {
                        if (clickStatus) {
                            positions.push(movePosition);
                        } else {
                            positions.pop();
                            positions.push(movePosition);
                        }
                    }
                    if (positions.length >= 3) {
                        // 绘制label
                        if (labelEntity) {
                            this.viewer.entities.remove(labelEntity);
                            this.entityCollection.splice(this.entityCollection.indexOf(labelEntity), 1);
                        }

                        var text = "面积：" + this.getArea(positions);
                        var centerPoint = this.getCenterOfGravityPoint(positions);
                        labelEntity = this.addLabel(centerPoint, text);

                        this.entityCollection.push(labelEntity);
                    }
                    clickStatus = false;
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


            } else if (positions.length == 2) {
                if (!cartesian) {
                    return false
                }
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第2个点

                this.addPoint(cartesian);

                this.addPolyGon(positions);

                // 右击结束
                this.viewer.screenSpaceEventHandler.setInputAction((clickEvent) => {

                    var clickPosition = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(clickEvent.position), this.viewer.scene);
                    if (!clickPosition) {
                        return false;
                    }
                    positions.pop();
                    positions.push(clickPosition);
                    positions.push(positions[0]); // 闭合
                    this.addPoint(clickPosition);

                    this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

                }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);


            } else if (positions.length >= 3) {
                if (!cartesian) {
                    return false
                }
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第3个点
                this.addPoint(cartesian);
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    };

    // 添加点
    addPoint(position) {
        this.entityCollection.push(this.viewer.entities.add(new Cesium.Entity({
            position: position,
            point: {
                color: Cesium.Color.BLUE,
                pixelSize: 5,
                heightReference: Cesium.HeightReference.NONE
            }
        })));
    };

    // 添加线
    addLine(positions) {
        this.viewer.entities.add(
            new Cesium.Entity({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => positions, false),
                    width: 2,
                    material: Cesium.Color.YELLOW,
                    clampToGround: true,
                }
            })
        )
    }

    // 添加面
    addPolyGon(positions) {
        this.entityCollection.push(this.viewer.entities.add(new Cesium.Entity({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(positions);
                }, false),
                material: Cesium.Color.RED.withAlpha(0.6),
                classificationType: Cesium.ClassificationType.BOTH // 贴地表和贴模型,如果设置了，这不能使用挤出高度
            }
        })));
    };

    // 添加标签
    addLabel(position, text) {
        return this.viewer.entities.add(
            new Cesium.Entity({
                position: position,
                label: {
                    text: text,
                    font: '14px sans-serif',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                    fillColor: Cesium.Color.YELLOW,
                    showBackground: true, //指定标签后面背景的可见性
                    backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // 背景颜色
                    backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
                    pixelOffset: new Cesium.Cartesian2(0, -25),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            })
        )
    }


    /*方向*/
    Bearing(from, to) {
        from = Cesium.Cartographic.fromCartesian(from);
        to = Cesium.Cartographic.fromCartesian(to);

        var lat1 = from.latitude;
        var lon1 = from.longitude;
        var lat2 = to.latitude;
        var lon2 = to.longitude;
        var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        var degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

        angle = angle * degreesPerRadian; //角度
        return angle;
    }
    /*角度*/
    Angle(p1, p2, p3) {
        var bearing21 = this.Bearing(p2, p1);
        var bearing23 = this.Bearing(p2, p3);
        var angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }

    distance(point1, point2) {
        var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
        var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        return s;
    }
    //计算多边形面积
    getArea(points) {
        var res = 0;
        //拆分三角曲面

        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            var totalAngle = this.Angle(points[i], points[j], points[k]);

            var dis_temp1 = this.distance(points[j], points[0]);
            var dis_temp2 = this.distance(points[k], points[0]);
            res += dis_temp1 * dis_temp2 * Math.sin(totalAngle) / 2;
        }

        if (res < 1000000) {
            res = Math.abs(res).toFixed(4) + " 平方米";
        } else {
            res = Math.abs((res / 1000000.0).toFixed(4)) + " 平方公里";
        }

        return res;

    };

    /**
     * 计算多边形的中心（简单的处理）
     * @param mPoints
     * @returns {*[]}
     */
    getCenterOfGravityPoint(mPoints) {
        var centerPoint = mPoints[0];
        for (var i = 1; i < mPoints.length; i++) {
            centerPoint = Cesium.Cartesian3.midpoint(centerPoint, mPoints[i], new Cesium.Cartesian3());
        }
        return centerPoint;
    }

}
