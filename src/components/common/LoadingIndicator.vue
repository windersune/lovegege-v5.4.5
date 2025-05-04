<template>
  <div class="loading-container">
    <div class="loading-indicator">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  </div>
</template>

<script setup>
// 优化后的加载指示器组件
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}

.loading-dot {
  width: 8px;
  height: 8px;
  margin: 0 4px;
  border-radius: 50%;
  background-color: #ba01fb;
  animation: loadingPulse 1.5s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
