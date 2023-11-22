// // 添加可视域
// function addViewField() {
//   var e = new Cesium.ViewShed3D(viewer, {
//     horizontalAngle: Number(viewModel.horizontalAngle),
//     verticalAngle: Number(viewModel.verticalAngle),
//     distance: Number(viewModel.distance),
//     calback: function () {
//       viewModel.distance = e.distance
//     }
//   });
//   arrViewField.push(e)
// }
// // 清除可视域
// function clearAllViewField() {
//   for (var e = 0, i = arrViewField.length; e < i; e++) {
//     arrViewField[e].destroy()
//   }
//   arrViewField = []
// }