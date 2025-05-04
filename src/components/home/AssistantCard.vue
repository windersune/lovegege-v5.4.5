<template>
  <div 
    class="assistant-card relative overflow-hidden transition-all duration-300 rounded-xl"
    :class="{ 
      'cursor-pointer transform hover:scale-105 hover:shadow-xl': assistant.available,
      'opacity-70 cursor-not-allowed': !assistant.available 
    }"
    @click="navigateToChat"
  >
    <!-- 背景色渐变 -->
    <div class="absolute inset-0 bg-gradient-to-br" 
      :class="assistant.available ? 
        'from-purple-50 to-indigo-50' : 
        'from-gray-50 to-gray-100'"
    ></div>
    
    <!-- 卡片内容 -->
    <div class="relative p-5 h-full flex flex-col justify-between">
      <!-- 助手信息 -->
      <div>
        <div class="flex items-center mb-3">
          <div class="w-16 h-16 rounded-full flex-shrink-0 bg-purple-100 p-1.5 ring-2 ring-purple-200 flex items-center justify-center overflow-hidden">
            <img :src="assistant.avatar" :alt="assistant.name" class="w-full h-full object-cover rounded-full">
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-bold text-gray-800">{{ assistant.name }}</h3>
            <div v-if="assistant.available" class="flex items-center mt-1">
              <span class="inline-block h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
              <span class="text-sm text-green-600 font-medium">在线</span>
            </div>
            <div v-else class="flex items-center mt-1">
              <span class="inline-block h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              <span class="text-sm text-gray-500 font-medium">即将上线</span>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-600 leading-relaxed pb-3">{{ assistant.description }}</p>
      </div>
      
      <!-- 底部按钮 -->
      <div class="mt-2">
        <div v-if="assistant.available" class="flex justify-between items-center">
          <div class="flex items-center text-xs text-gray-500">
            <span v-if="assistant.supportsImage" class="mr-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              图像支持
            </span>
          </div>
          <button class="py-1.5 px-4 bg-primary text-white rounded-full text-sm font-medium shadow-sm hover:bg-purple-700 transition-colors">
            开始对话
          </button>
        </div>
        <div v-else class="flex justify-center">
          <span class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            敬请期待
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  assistant: {
    type: Object,
    required: true
  }
});

const router = useRouter();

const navigateToChat = () => {
  if (props.assistant.available) {
    router.push(`/chat/${props.assistant.id}`);
  }
};
</script>

<style scoped>
.assistant-card {
  min-height: 200px;
  border: 1px solid rgba(186, 1, 251, 0.1);
  transition: all 0.3s ease;
}

.assistant-card:hover {
  border-color: rgba(186, 1, 251, 0.3);
}
</style>
