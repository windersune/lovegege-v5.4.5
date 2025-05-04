<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// App.vue 是根组件，仅作为路由视图的容器
</script>

<style>
.app-container {
  width: 100%;
  min-height: 100vh;
}
</style>
