<script setup>
import * as Cesium from 'cesium';
import {onMounted, reactive, ref, toRef} from "vue";
import MeasureDistance from "./classes/MeasureDistance.js";
import MeasureHeight from "./classes/MeasureHeight.js";
import {CGCS2000ToWGS84} from "./classes/CGCS2000toWGS84.js";

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmM2U1YjYxYS1lNzczLTRlMjQtODEyYi03MjJmNjQyOTQzOWYiLCJpZCI6MTMwNjk3LCJpYXQiOjE2Nzk4OTg4MTd9.vTMp7xouXgtGhI3yV4rHa86YV1bopfqmVJcrbttFODU"

let viewer = null
const measureDistance = reactive(new MeasureDistance())   //测量直线距离工具
const measureHeight = reactive(new MeasureHeight())       //测量高度工具

onMounted(() => {
  //arcgis街道图层，基于wgs84坐标系，但国内地区精度不高
  var custom = new Cesium.ArcGisMapServerImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
  })
  //openstreetmap街道图层，基于wgs84坐标系
  var osmLayer = new Cesium.UrlTemplateImageryProvider({
    url: "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c", "d"],
  })
  //百度卫星影像，基于cscg2000坐标系
  var baiduLayer = new Cesium.UrlTemplateImageryProvider({
    url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    layer: "tdtVecBasicLayer",
    style: "default",
    format: "image/png",
    tileMatrixSetID: "GoogleMapsCompatible",
    show: false
  })
  viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,         //不显示轮盘
    baseLayerPicker: false,  //不显示工具栏
    selectionIndicator: false,//不显示选中指示器组件
    infoBox: false,           //不显示信息框
    imageryProvider: osmLayer
  });
  // viewer.terrainProvider = Cesium.createWorldTerrain({
  //   requestWaterMask: true,     //启用水面特效
  //   requestVertexNormals: true  //启用地形照明
  // });
  // viewer.scene.globe.enableLighting = true;   //启用使用场景光源照亮地球

  viewer.scene.globe.depthTestAgainstTerrain = true;  //开启深度检测，解决pickPosition不准确问题

  viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(118.775907, 32.039101, 2000),
    orientation: {
      heading: 0.0,
      pitch: Cesium.Math.toRadians(-45),  //设置相机俯仰角度
      roll: 0.0
    }
  })

    var city = viewer.scene.primitives.add(new Cesium.Cesium3DTileset(
        {
            // url: Cesium.IonResource.fromAssetId(75343)
            // url: Cesium.IonResource.fromAssetId(1642792)
            url: "/api/Cesium_Demo/3dtiles/tileset.json"
            // url: "../3dtiles/tileset.json"
        }
    ))

  city.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ["${Elevation} >= 200", "rgb(45, 0, 75)"],
        ["${Elevation} >= 150", "rgb(102, 71, 151)"],
        ["${Elevation} >= 100", "rgb(170, 162, 204)"],
        ["${Elevation} >= 60", "rgb(224, 226, 238)"],
        ["${Elevation} >= 30", "rgb(252, 230, 200)"],
        ["${Elevation} >= 10", "rgb(248, 176, 87)"],
        ["${Elevation} >= 5", "rgb(198, 106, 11)"],
        ["true", "rgb(127, 59, 8)"]
      ]
    }
  })
  // viewer.zoomTo(city);
  //加载GeoJson数据
/*  var CommunityPromise = Cesium.GeoJsonDataSource.load('https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=320100_full');
  var communityEntities;
  CommunityPromise.then((dataSource) => {
    viewer.dataSources.add(dataSource);
    communityEntities = dataSource.entities.values;
    for (var i = 0; i < communityEntities.length; i++) {
      var entity = communityEntities[i];
      entity.polygon.material = Cesium.Color.fromRandom({
        red: 0.1,
        maximumGreen: 0.5,
        minimumBlue: 0.5,
        alpha: 0.3
      });
      entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
      var polyPosition = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;    //获取多边形顶点
      // polyPosition.forEach((point) => {
      //   console.log(point);
      //   const CGCS2000 = Cesium.Cartographic.fromCartesian(point);
      //   console.log(CGCS2000);
      //   const trans = CGCS2000ToWGS84(CGCS2000.longitude, CGCS2000.latitude);
      //   const WGS84 = new Cesium.Cartographic(trans[0], trans[1], CGCS2000.height);
      //   point.x = Cesium.Cartesian3.fromRadians(WGS84.longitude, WGS84.latitude, WGS84.height).x;
      //   point.y = Cesium.Cartesian3.fromRadians(WGS84.longitude, WGS84.latitude, WGS84.height).y;
      // })
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPosition).center;   //计算多边形中心点
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);   //将笛卡尔坐标转换为地形坐标
      entity.position = polyCenter;   //将多边形中心点赋值给entity的position属性
      entity.polygon.height = 0;  //设置多边形高度
      entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;  //设置多边形贴地
      entity.polygon.outline = true;  //显示多边形边界
      entity.polygon.outlineColor = Cesium.Color.GREY;  //设置多边形边界颜色
    }
  })*/

  //添加billboards
  /*var billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
  var misaka = billboards.add({
    image: './pic/misaka.webp',
    position: Cesium.Cartesian3.fromDegrees(-74.01, 40.71, 150),
    color : new Cesium.Color(1.0, 1.0, 1.0, 0.7),
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    scaleByDistance: new Cesium.NearFarScalar(0, 0.5, 5e3, 0.0)
  });*/

  measureDistance.init(viewer);
  measureHeight.init(viewer);

})

function activateMeasureDistance() {
  measureDistance.activate();
}

function activateMeasureHeight() {
  measureHeight.activate();
}

function clearMeasure() {
  measureDistance.clear();
  measureHeight.clear();
}

</script>

<template>
  <div>
    <el-container height="100%">
      <el-main>
        <el-row id="toolBar">
          <el-button type="primary" :disabled="measureDistance.isMeasure" round @click="activateMeasureDistance">
            测量距离
          </el-button>
          <el-button type="primary" :disabled="measureHeight.isMeasure" round @click="activateMeasureHeight">测量高度
          </el-button>
          <el-button type="primary" round @click="clearMeasure">清除测量</el-button>
        </el-row>
        <div id="cesiumContainer"></div>
      </el-main>
    </el-container>
  </div>
</template>

<style>
#toolBar {
  position: absolute;
  top: 10px;
  left: 10px;
  height: auto;
  width: auto;
  z-index: 999;
}

#cesiumContainer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
