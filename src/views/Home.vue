<template>
  <div class="home-container min-h-screen bg-gradient-to-b from-background to-white">
    <!-- 顶部区域 - 更短且添加爱心元素 -->
    <div class="header-section relative overflow-hidden">
      <!-- 动态背景 -->
      <div class="absolute inset-0 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500 header-animation"></div>
      
      <!-- 爱心装饰元素 - 增加更多爱心 -->
      <div class="absolute inset-0 overflow-hidden heart-particles">
        <div v-for="i in 12" :key="i" 
             class="heart-particle absolute"
             :class="`heart-particle-${i}`">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="heart-svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white" fill-opacity="0.6"/>
          </svg>
        </div>
      </div>
      
      <!-- 波浪效果 -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" class="w-full h-auto -mb-1">
          <path fill="#ffffff" fill-opacity="1" d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,170.7C960,160,1056,96,1152,80C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      
      <!-- 内容 -->
      <div class="container mx-auto px-4 py-10 relative z-10">
        <div class="flex flex-col items-center text-center">
          <div class="mb-3 relative">
            <div class="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center pulse-animation">
              <div class="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <!-- 添加爱心光环效果 -->
            <div class="absolute -inset-3 heart-halo"></div>
          </div>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-wide fade-in-up">
            <span class="whitespace-nowrap">专属格格💖的AI助手</span>
            <span class="relative ml-1 whitespace-nowrap">
              <!-- 移除闪动光标 -->
            </span>
          </h1>
          <p class="text-white text-base md:text-lg opacity-90 max-w-xl fade-in-up animation-delay-300">
            欢迎格格，您吉祥~😄点击下面卡片可以对话哦
          </p>
          <!-- 移除爱心按钮，替换为装饰性爱心图案 -->
          <div class="mt-6 fade-in-up animation-delay-500">
            <div class="heart-decoration">
              <div class="heart-icon-large">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="heart-icon-small heart-left">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="heart-icon-small heart-right">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="container mx-auto px-4 py-8 -mt-16 relative z-10">
      <div class="bg-white rounded-xl shadow-xl p-6">
        <!-- 助手列表标题 -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800">选择助手开始对话</h2>
        </div>
        
        <!-- 助手列表 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          <AssistantCard 
            v-for="assistant in assistants" 
            :key="assistant.id" 
            :assistant="assistant" 
          />
        </div>
      </div>
      
      <!-- 底部信息区 -->
      <div class="mt-12 text-center text-gray-500 text-sm">
        <p>Designed by Mr.Zuo </p>
        <p class="mt-2">© {{ new Date().getFullYear() }} 为爱而创造的对话平台</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAssistantStore } from '../stores/assistantStore';
import AssistantCard from '../components/home/AssistantCard.vue';

const assistantStore = useAssistantStore();
const assistants = assistantStore.assistants;
</script>

<style scoped>
.home-container {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ba01fb' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.header-section {
  height: 320px; /* 减小高度 */
  position: relative;
}

/* 动态背景动画 */
.header-animation {
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 打字机光标动画 - 移除或注释掉 */
.typing-cursor {
  display: none; /* 隐藏光标 */
  /* 
  以下是原有的代码，已注释掉
  display: inline-block;
  width: 3px;
  animation: blink 1s step-end infinite;
  */
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}

/* 淡入上升动画 */
.fade-in-up {
  animation: fadeInUp 0.8s ease forwards;
}

.animation-delay-300 {
  animation-delay: 0.3s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 爱心粒子动画 - 增加更多爱心 */
.heart-particles {
  z-index: 1;
}

.heart-particle {
  position: absolute;
  width: 20px;
  height: 20px;
  animation: heartFloat 12s ease-in-out infinite;
}

.heart-svg {
  animation: heartbeat 2s ease-in-out infinite;
}

.heart-particle-1 {
  top: 10%;
  left: 10%;
  width: 15px;
  height: 15px;
  animation-delay: 0s;
}

.heart-particle-2 {
  top: 20%;
  left: 70%;
  width: 24px;
  height: 24px;
  animation-delay: 1s;
}

.heart-particle-3 {
  top: 50%;
  left: 30%;
  width: 18px;
  height: 18px;
  animation-delay: 2s;
}

.heart-particle-4 {
  top: 70%;
  left: 80%;
  width: 12px;
  height: 12px;
  animation-delay: 3s;
}

.heart-particle-5 {
  top: 30%;
  left: 20%;
  width: 16px;
  height: 16px;
  animation-delay: 4s;
}

.heart-particle-6 {
  top: 40%;
  left: 60%;
  width: 20px;
  height: 20px;
  animation-delay: 5s;
}

.heart-particle-7 {
  top: 60%;
  left: 40%;
  width: 14px;
  height: 14px;
  animation-delay: 6s;
}

.heart-particle-8 {
  top: 80%;
  left: 15%;
  width: 18px;
  height: 18px;
  animation-delay: 7s;
}

/* 新增爱心粒子 */
.heart-particle-9 {
  top: 15%;
  left: 40%;
  width: 16px;
  height: 16px;
  animation-delay: 2.5s;
}

.heart-particle-10 {
  top: 65%;
  left: 65%;
  width: 13px;
  height: 13px;
  animation-delay: 3.5s;
}

.heart-particle-11 {
  top: 35%;
  left: 85%;
  width: 22px;
  height: 22px;
  animation-delay: 4.5s;
}

.heart-particle-12 {
  top: 75%;
  left: 5%;
  width: 19px;
  height: 19px;
  animation-delay: 5.5s;
}

@keyframes heartFloat {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-15px) translateX(10px) rotate(5deg);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-30px) translateX(-5px) rotate(-5deg);
    opacity: 0.6;
  }
  75% {
    transform: translateY(-15px) translateX(-15px) rotate(5deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0.6;
  }
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 爱心光环效果 */
.heart-halo {
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: halo-pulse 2s ease-in-out infinite;
}

@keyframes halo-pulse {
  0% { transform: scale(0.8); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(0.8); opacity: 0.4; }
}

/* 替换爱心按钮为装饰性爱心图案 */
.heart-decoration {
  position: relative;
  width: 120px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.heart-icon-large {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 0 8px rgba(255, 105, 180, 0.6));
  animation: pulse-heart 2s infinite ease-in-out;
  z-index: 1;
}

.heart-icon-small {
  position: absolute;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
  filter: drop-shadow(0 0 5px rgba(255, 105, 180, 0.4));
  animation: float-small-heart 3s infinite ease-in-out;
}

.heart-left {
  left: 15px;
  top: 20px;
  animation-delay: 0.5s;
}

.heart-right {
  right: 15px;
  top: 20px;
  animation-delay: 1s;
}

@keyframes pulse-heart {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes float-small-heart {
  0% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-10px) rotate(10deg); }
  100% { transform: translateY(0) rotate(0); }
}

/* 爱心按钮效果 - 可以删除或保留 */
.love-button {
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}

.love-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
