<template>
  <div class="toolbar">
    <el-switch
      v-model="measureDistance"
      @change="measureDistance ? activeMeasureDistance() : clearMeasureDistance()"
    ></el-switch>
  </div>
</template>

<script>
export default {
  name: "toolbar"
}

</script>

<style scoped>

</style>