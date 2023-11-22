import * as Cesium from "cesium";

export default class SearchRoute {


    init(viewer) {
        this.startP = null;
        this.endP = null;
        this.isMeasure = false;
        this.viewer = viewer;
        this.x_PI = 3.14159265358979324 * 3000.0 / 180.0;
        this.PI = 3.1415926535897932384626;
        this.a = 6378245.0;
        this.ee = 0.00669342162296594323;
    }


    getCatesian3FromPX(px, viewer, entity) {
        var pick = viewer.scene.pick(px);
        var cartesian;
        var drillPick = viewer.scene.drillPick(px);
        var truePick = null;
        if (entity) {
            for (var i = 0; i < drillPick.length; i++) {
                if (drillPick[i].id._id != entity.id) {
                    truePick = drillPick[i].id;
                    break;
                }
            }
        } else {
            truePick = pick;
        }
        if (viewer.scene.pickPositionSupported && Cesium.defined(truePick)) {
            cartesian = viewer.scene.pickPosition(px);
        } else {
            var ray = viewer.camera.getPickRay(px);
            if (!ray) return;
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        return cartesian;
    }

    cartesianToLnglat(cartesian, isToWgs84) {
        if (!cartesian) return;
        var ellipsoid = this.viewer.scene.globe.ellipsoid;
        var lnglat = ellipsoid.cartesianToCartographic(cartesian);
        //var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        if (isToWgs84) {
            var lat = Cesium.Math.toDegrees(lnglat.latitude);
            var lng = Cesium.Math.toDegrees(lnglat.longitude);
            var hei = lnglat.height;
            return [lng, lat, hei];
        } else {
            return [lnglat.longitude, lnglat.latitude, lnglat.height];
        }

    }
    lnglatToCartesian(lnglat) { //经纬度转世界坐标 [101,40]
        if (!lnglat) return null;
        return Cesium.Cartesian3.fromDegrees(lnglat[0], lnglat[1], lnglat[2] || 0);
    }

    lnglatArrToCartesianArr(lnglatArr) {
        if (!lnglatArr) return [];
        var arr = [];
        for (var i = 0; i < lnglatArr.length; i++) {
            arr.push(this.lnglatToCartesian(lnglatArr[i]));
        }
        return arr;
    }

    start(opt) {
        var startP = this.wgs2gcj(this.startP);
        var endP = this.wgs2gcj(this.endP);
        $.ajax({
            url: "http://restapi.amap.com/v3/direction/driving",
            type: "GET",
            dataType: "jsonp",
            timeout: "5000",
            contentType: "application/json;utf-8",
            // TODO: 高德api
            data: {
                "output": "json",
                "extensions": "all",
                "key": "6139567a7a71e47a30de228b97233547",
                "origin": startP[0] + "," + startP[1],
                "destination": endP[0] + "," + endP[1],
                "strategy": opt.strategy || 10
            },
            success: function(json) {
                // 由于线涉及坐标较多 此处返回的坐标 未转为wgs84
                var data = "";
                if (!json || !json.route || !json.route.paths) {
                    data = "";
                } else {
                    data = json.route.paths;
                }
                opt.callback(data);
            },
            error: function(data) {}
        });
    }

    search() {
        this.isMeasure = true;
        var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        var isClickAgain = false;
        var start = null;
        var entd = null;
        let that = this;
        handler.setInputAction(function(evt) { //单机开始绘制
            var pick = this.viewer.scene.pick(evt.position);
            var cartesian = that.getCatesian3FromPX(evt.position, this.viewer);
            if (!isClickAgain) {
                isClickAgain = true;
                start = this.viewer.entities.add({
                    name: "图标点",
                    position: cartesian,
                    billboard: {
                        image: 'mark4.png',
                        scale: 1,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                    }
                });
                return;
            }
            if (isClickAgain) {
                let end;
                end = this.viewer.entities.add({
                    name: "图标点",
                    position: cartesian,
                    billboard: {
                        image: 'mark2.png',
                        scale: 1,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                    }
                });
                that.showRes(start.position.getValue(), end.position.getValue());
                handler.destroy();
                this.isMeasure = false;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    }

    showRes(start, end) {
        if (!start || !end) return;
        let that = this;
        // TODO: 将cartesian3转为经纬度
        var startp = this.cartesianToLnglat(start, true);
        var endP = this.cartesianToLnglat(end, true);
        this.startP = [startp[0], startp[1]];
        this.endP = [endP[0], endP[1]];
        //var search = new searchRoute([startp[0], startp[1]], [endP[0], endP[1]]);
        this.start({
            strategy: 11,
            callback: function(data) {
                that.addRouteLine(data[0]);
            }
        })
    }

    addRouteLine(res) {
        var arr = [];
        var steps = res.steps;
        for (var i = 0; i < steps.length; i++) {
            var item = steps[i];
            var positionStr = item.polyline;
            var strArr = positionStr.split(";");
            for (var z = 0; z < strArr.length; z++) {
                var item2 = strArr[z];
                var strArr2 = item2.split(",");
                var p = this.gcj2wgs(strArr2);
                arr.push(p);
            }
        }
        var cartesians = this.lnglatArrToCartesianArr(arr);
        var line = this.viewer.entities.add({
            polyline: {
                positions: cartesians,
                clampToGround: true,
                material: Cesium.Color.RED.withAlpha(1),
                width: 3
            }
        });
    }

    //坐标转换==================================

    transformWD(lng, lat) {
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * this.PI) + 40.0 * Math.sin(lat / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * this.PI) + 320 * Math.sin(lat * this.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }
    transformJD(lng, lat) {
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * this.PI) + 20.0 * Math.sin(2.0 * lng * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * this.PI) + 40.0 * Math.sin(lng / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * this.PI) + 300.0 * Math.sin(lng / 30.0 * this.PI)) * 2.0 / 3.0;
        return ret;
    }


    wgs2gcj(arrdata) {
        var lng = Number(arrdata[0]);
        var lat = Number(arrdata[1]);
        var dlat = this.transformWD(lng - 105.0, lat - 35.0);
        var dlng = this.transformJD(lng - 105.0, lat - 35.0);
        var radlat = lat / 180.0 * this.PI;
        var magic = Math.sin(radlat);
        magic = 1 - this.ee * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = dlat * 180.0 / (this.a * (1 - this.ee) / (magic * sqrtmagic) * this.PI);
        dlng = dlng * 180.0 / (this.a / sqrtmagic * Math.cos(radlat) * this.PI);
        var mglat = lat + dlat;
        var mglng = lng + dlng;

        mglng = Number(mglng.toFixed(6));
        mglat = Number(mglat.toFixed(6));
        return [mglng, mglat];

    };

    gcj2wgs(arrdata) {
        var lng = Number(arrdata[0]);
        var lat = Number(arrdata[1]);
        var dlat = this.transformWD(lng - 105.0, lat - 35.0);
        var dlng = this.transformJD(lng - 105.0, lat - 35.0);
        var radlat = lat / 180.0 * this.PI;
        var magic = Math.sin(radlat);
        magic = 1 - this.ee * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = dlat * 180.0 / (this.a * (1 - this.ee) / (magic * sqrtmagic) * this.PI);
        dlng = dlng * 180.0 / (this.a / sqrtmagic * Math.cos(radlat) * this.PI);

        var mglat = lat + dlat;
        var mglng = lng + dlng;

        var jd = lng * 2 - mglng;
        var wd = lat * 2 - mglat;

        jd = Number(jd.toFixed(6));
        wd = Number(wd.toFixed(6));
        return [jd, wd];

    }
}