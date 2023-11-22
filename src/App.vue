<script setup>
import * as Cesium from 'cesium';
import {onMounted, reactive, ref} from "vue";
import { Location, Menu as IconMenu } from '@element-plus/icons-vue'
import MeasureDistance from "./classes/MeasureDistance.js";
import MeasureHeight from "./classes/MeasureHeight.js";
import MeasureArea from "./classes/MeasureArea.js";
import MeasureDistanceFitTerrain from "./classes/MeasureDistanceFitTerrain.js";
import DrawPoint from "./classes/DrawPoint.js";
import DrawLine from "./classes/DrawLine.js";
import MeasureAltitude from "./classes/MeasureAltitude.js";
import DrawLabel from "./classes/DrawLabel.js";
import MeasureAngle from "./classes/MeasureAngle.js";
import SearchRoute from "./classes/searchRoute.js";

// import {CGCS2000ToWGS84} from "./classes/CGCS2000toWGS84.js";

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmM2U1YjYxYS1lNzczLTRlMjQtODEyYi03MjJmNjQyOTQzOWYiLCJpZCI6MTMwNjk3LCJpYXQiOjE2Nzk4OTg4MTd9.vTMp7xouXgtGhI3yV4rHa86YV1bopfqmVJcrbttFODU"

let viewer = null
const measureDistance = reactive(new MeasureDistance())   //测量直线距离工具
const measureHeight = reactive(new MeasureHeight())       //测量高度工具
const measureArea = reactive(new MeasureArea()) // 测量面积工具
const measureAltitude = reactive(new MeasureAltitude()) // 测量海拔工具
const measureDistanceFitTerrain = reactive(new MeasureDistanceFitTerrain()) // 贴地距离工具
const measureAngle = reactive(new MeasureAngle()) // 测量角度工具

const showMeasureResult = ref(true)  //是否显示测量结果
const drawPoint = reactive(new DrawPoint()) //绘制点工具
const drawLine = reactive(new DrawLine()) //绘制线工具
const drawLabel = reactive(new DrawLabel()) //绘制标签工具
const searchRoute = reactive(new SearchRoute()) //路径规划工具

const requestWaterMask = ref(true) //是否请求水面特效
const requestVertexNormals = ref(true) //是否请求地形照明
const enableLighting = ref(true) //是否启用场景光源照亮地球


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

    viewer.scene.globe.depthTestAgainstTerrain = true;  //开启深度检测，解决pickPosition不准确问题

    viewer.scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(118.775907, 32.039101, 2000),
        orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-45),  //设置相机俯仰角度
            roll: 0.0
        }
    })

    // 地形
    viewer.terrainProvider = Cesium.createWorldTerrain({
        requestWaterMask: requestWaterMask.value,     //启用水面特效
        requestVertexNormals: requestVertexNormals.value  //启用地形照明
    });

    // var terrain = new Cesium.CesiumTerrainProvider({
    //     url: '/api/Cesium_Demo/terrains/nanjing',
    // });
    // viewer.terrainProvider = terrain;

    viewer.scene.globe.enableLighting = enableLighting.value;   //启用使用场景光源照亮地球

    // var ellipsoidProvider = new Cesium.EllipsoidTerrainProvider();
    // viewer.terrainProvider = ellipsoidProvider;

    // TODO: 代理
    // 建筑模型
    // var city = viewer.scene.primitives.add(new Cesium.Cesium3DTileset(
    //     {
    //         // url: Cesium.IonResource.fromAssetId(75343)
    //         // url: Cesium.IonResource.fromAssetId(1642792)
    //         url: "api/Cesium_Demo/3dtiles/tileset.json"
    //         // url: "./3dtiles/tileset.json"
    //     }
    // ))

    // city.style = new Cesium.Cesium3DTileStyle({
    //     color: {
    //         conditions: [
    //             ["${Elevation} >= 200", "rgb(45, 0, 75)"],
    //             ["${Elevation} >= 150", "rgb(102, 71, 151)"],
    //             ["${Elevation} >= 100", "rgb(170, 162, 204)"],
    //             ["${Elevation} >= 60", "rgb(224, 226, 238)"],
    //             ["${Elevation} >= 30", "rgb(252, 230, 200)"],
    //             ["${Elevation} >= 10", "rgb(248, 176, 87)"],
    //             ["${Elevation} >= 5", "rgb(198, 106, 11)"],
    //             ["true", "rgb(127, 59, 8)"]
    //         ]
    //     }
    // })


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
    measureArea.init(viewer);
    measureAltitude.init(viewer);
    measureDistanceFitTerrain.init(viewer);
    measureAngle.init(viewer);
    drawPoint.init(viewer);
    drawLine.init(viewer);
    drawLabel.init(viewer);
    searchRoute.init(viewer);
})

function activateMeasureDistance() {
    measureDistance.activate();
}

function activateMeasureHeight() {
    measureHeight.activate();
}

function activateMeasureAltitude() {
    measureAltitude.activate();
}

function clearMeasure() {
    measureDistance.clear();
    measureHeight.clear();
    measureArea.clear();
    measureAltitude.clear();
    measureDistanceFitTerrain.clear();
    measureAngle.clear();
}

function activateMeasureArea() {
    measureArea.measurePolygon();
}

function activateMeasureDistanceFitTerrain() {
    measureDistanceFitTerrain.activate();
}

function activateMeasureAngle() {
    measureAngle.activate();
}

function activateSearchRoute() {
    searchRoute.search();
}



function showOrHideMeasureResult(showMeasureResult) {
    if (showMeasureResult) {
        measureDistance.showMeasureResult();
        measureDistanceFitTerrain.showMeasureResult();
        measureHeight.showMeasureResult();
        measureAltitude.showMeasureResult();
        measureAngle.showMeasureResult();
        measureArea.showMeasureResult();
    } else {
        measureDistance.hideMeasureResult();
        measureDistanceFitTerrain.hideMeasureResult();
        measureHeight.hideMeasureResult();
        measureAltitude.hideMeasureResult();
        measureAngle.hideMeasureResult();
        measureArea.hideMeasureResult();
    }
}

function activeDrawPoint() {
    drawPoint.activate();
}

function activeDrawLine() {
    drawLine.activate();
}

function activeDrawLabel() {
    drawLabel.activate();
}

function clearDraw() {
    drawPoint.clear();
    drawLine.clear();
    drawLabel.clear();
}

</script>

<template>
    <div>
        <el-container height="100%">
            <el-main>
                <el-space id="MeasureBar">
                    <el-button type="primary" :disabled="measureDistance.isMeasure" round
                               @click="activateMeasureDistance()">
                        测量距离
                    </el-button>
                    <el-button type="primary" :disabled="measureDistanceFitTerrain.isMeasure" round
                               @click="activateMeasureDistanceFitTerrain()">
                        贴地距离
                    </el-button>
                    <el-button type="primary" :disabled="measureHeight.isMeasure" round @click="activateMeasureHeight()">
                        测量高度
                    </el-button>
                    <el-button type="primary" :disabled="measureAltitude.isMeasure" round @click="activateMeasureAltitude()">
                        测量海拔
                    </el-button>
                    <el-button type="primary" :disabled="measureArea.isMeasure" round @click="activateMeasureArea()">
                        测量面积
                    </el-button>
                    <el-button type="primary" :disabled="measureAngle.isMeasure" round @click="activateMeasureAngle()">
                        测量角度
                    </el-button>
                    <el-button type="primary" :disabled="searchRoute.isMeasure" round @click="activateSearchRoute()">
                        路径规划
                    </el-button>

                    <el-button type="primary" round @click="clearMeasure()">清除测量</el-button>
                    <el-switch v-model="showMeasureResult" style="--el-switch-on-color: #419fff; --el-switch-off-color: #ff4949; --el-margin-left: 5%;"
                               inline-prompt active-text="显示测量结果" inactive-text="隐藏测量结果" size="large"
                               @change="showOrHideMeasureResult(showMeasureResult)"></el-switch>
                </el-space>

                <el-space id="DrawBar">
                    <el-button type="primary" :disabled="drawPoint.active" round @click="activeDrawPoint()">
                        绘制点
                    </el-button>
                    <el-button type="primary" :disabled="drawLine.active" round @click="activeDrawLine()">
                        绘制线
                    </el-button>
                    <el-button type="primary" :disabled="drawLabel.active" round @click="activeDrawLabel()">
                        添加文字标签
                    </el-button>
                    <el-button type="primary" round @click="clearDraw()">清除绘制</el-button>
                </el-space>

                <el-space id="menu">
                    <el-menu
                      default-active="2"
                      :collapse=true
                    >
                        <el-sub-menu index="1">
                            <template #title>
                                <el-icon><location /></el-icon>
                                <span>Navigator One</span>
                            </template>
                            <el-menu-item-group>
                                <template #title><span>Group One</span></template>
                                <el-menu-item index="1-1">item one</el-menu-item>
                                <el-menu-item index="1-2">item two</el-menu-item>
                            </el-menu-item-group>
                            <el-menu-item-group title="Group Two">
                                <el-menu-item index="1-3">item three</el-menu-item>
                            </el-menu-item-group>
                            <el-sub-menu index="1-4">
                                <template #title><span>item four</span></template>
                                <el-menu-item index="1-4-1">item one</el-menu-item>
                            </el-sub-menu>
                        </el-sub-menu>
                        <el-menu-item index="2">
                            <el-icon><iconMenu /></el-icon>
                            <template #title>Navigator Two</template>
                        </el-menu-item>
                    </el-menu>
                </el-space>

                <div id="cesiumContainer"></div>
            </el-main>
        </el-container>
    </div>
</template>

<style>
#MeasureBar {
    position: absolute;
    top: 10px;
    left: 10px;
    height: auto;
    width: auto;
    z-index: 999;
}

#DrawBar {
    position: absolute;
    top: 60px;
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

#menu {
    position: absolute;
    top: 110px;
    left: 10px;
    height: auto;
    width: auto;
    z-index: 999;
}
</style>
