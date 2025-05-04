<template>
  <div class="chat-header shadow-sm bg-white p-3 flex items-center justify-between z-10 sticky top-0 left-0 right-0">
    <div class="flex items-center">
      <button 
        @click="$emit('back')" 
        class="mr-3 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="返回"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <div class="avatar-animated mr-3 relative">
        <div class="w-9 h-9 rounded-full flex items-center justify-center border border-purple-100 bg-purple-50 overflow-hidden">
          <img 
            :src="assistant?.avatar || '/images/ai-avatar.png'" 
            :alt="assistant?.name" 
            class="w-full h-full object-cover"
          >
        </div>
        <div class="heart-animation">
          <svg xmlns="http://www.w3.org/2000/svg" class="heart-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="heart-pulse"></div>
      </div>
      
      <div class="flex items-center">
        <div class="ml-1">
          <h1 class="font-bold text-gray-800">{{ assistant?.name }}</h1>
          <p class="text-xs text-gray-500">{{ statusText }}</p>
        </div>
      </div>
    </div>
    
    <div class="flex">
      <button 
        @click="$emit('new-chat')" 
        class="new-chat-btn mr-2 text-sm flex items-center justify-center"
        aria-label="开始新对话"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        新对话
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 接收助手对象作为props
const props = defineProps({
  assistant: Object
});

// 发送back事件和new-chat事件
defineEmits(['back', 'new-chat']);

// 计算状态文本
const statusText = computed(() => {
  return props.assistant?.available ? '在线' : '离线';
});
</script>

<style scoped>
.chat-header {
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: #fff;
}

.new-chat-btn {
  background-color: #f9f5ff;
  color: #8b5cf6;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  transition: all 0.2s;
  width: 100px;
  display: flex;
  justify-content: center;
}

.new-chat-btn:hover {
  background-color: #ede9fe;
}

.avatar-animated {
  position: relative;
}

.heart-animation {
  position: absolute;
  top: -4px;
  right: -2px;
  z-index: 1;
}

.heart-icon {
  width: 14px;
  height: 14px;
  color: #ec4899;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
  animation: float-heart 3s infinite ease-in-out;
}

.heart-pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(186, 1, 251, 0.3);
  animation: pulse 2s infinite;
}

@keyframes float-heart {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.1);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.2;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}

@media (max-width: 640px) {
  .new-chat-btn span {
    display: none;
  }
}
</style>
