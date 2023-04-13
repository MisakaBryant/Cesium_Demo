<script setup>
import * as Cesium from 'cesium';
import {onMounted} from "vue";
import MeasureDistance from "./classes/MeasureDistance.js";
// test git
// test master rebase
// test rebase
// test master merge
// test merge
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmM2U1YjYxYS1lNzczLTRlMjQtODEyYi03MjJmNjQyOTQzOWYiLCJpZCI6MTMwNjk3LCJpYXQiOjE2Nzk4OTg4MTd9.vTMp7xouXgtGhI3yV4rHa86YV1bopfqmVJcrbttFODU"

let viewer
var measureDistance   //测量直线距离工具

onMounted(()=>{
  var custom = new Cesium.ArcGisMapServerImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
  })
  var osmLayer = new Cesium.UrlTemplateImageryProvider({
    url: "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c", "d"],
  })
  viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,         //不显示轮盘
    baseLayerPicker:  false,  //不显示工具栏
    selectionIndicator: false,//不显示选中指示器组件
    infoBox: false,           //不显示信息框
    imageryProvider: osmLayer
  });
  viewer.terrainProvider = Cesium.createWorldTerrain({
    requestWaterMask: true,     //启用水面特效
    requestVertexNormals: true  //启用地形照明
  });
  // viewer.scene.globe.enableLighting = true;   //启用使用场景光源照亮地球

  viewer.scene.globe.depthTestAgainstTerrain = true;  //开启深度检测，解决pickPosition不准确问题

  viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-74.01, 40.7, 1200),
    orientation: {
      heading: 0.0,
      pitch: Cesium.Math.toRadians(-60),  //设置相机俯仰角度
      roll: 0.0
    }
  })

  var city = viewer.scene.primitives.add(new Cesium.Cesium3DTileset(
      {
        url: Cesium.IonResource.fromAssetId(75343)
      }
  ))

  city.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ["${Height} >= 300", "rgba(45, 0, 75, 0.5)"],
        ["${Height} >= 200", "rgba(102, 71, 151, 0.7)"],
        ["${Height} >= 100", "rgb(170, 162, 204)"],
        ["${Height} >= 50", "rgb(224, 226, 238)"],
        ["${Height} >= 25", "rgb(252, 230, 200)"],
        ["${Height} >= 10", "rgb(248, 176, 87)"],
        ["${Height} >= 5", "rgb(198, 106, 11)"],
        ["true", "rgb(127, 59, 8)"]
      ]
    }
  })

  //加载GeoJson数据
  var CommunityPromise = Cesium.GeoJsonDataSource.load('./assets/CommunityDistricts.geojson');
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
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPosition).center;   //计算多边形中心点
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);   //将笛卡尔坐标转换为地形坐标
      entity.position = polyCenter;   //将多边形中心点赋值给entity的position属性
      entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;  //设置多边形贴地
      entity.polygon.outline = true;  //显示多边形边界
      entity.polygon.outlineColor = Cesium.Color.GREY;  //设置多边形边界颜色
    }
  })

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

  measureDistance = new MeasureDistance(viewer);

})

function activeMeasureDistance() {
  measureDistance.activate();
}

function clearMeasureDistance() {
  measureDistance.clear();
}


</script>

<template>
  <div>
    <el-container height="100%">
      <el-main>
        <el-row id="toolBar">
          <el-button type="primary" round @click="activeMeasureDistance">测量距离</el-button>
          <el-button type="primary" round @click="clearMeasureDistance">清除测量</el-button>
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
  height: 10%;
  width: 50%;
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
