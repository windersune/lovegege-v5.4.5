<template>
  <div class="chat-container min-h-screen flex flex-col bg-gray-50">
    <!-- 顶部栏 -->
    <ChatHeader 
      :assistant="assistant" 
      @back="goBack" 
      @new-chat="startNewChat" 
      class="sticky top-0 left-0 right-0"
    />
    
    <!-- 聊天界面背景图案 - 添加will-change和contain属性优化性能 -->
    <div class="absolute inset-0 bg-chat-pattern opacity-5 pointer-events-none" style="will-change: opacity; contain: strict;"></div>
    
    <!-- 消息列表区域 - 设置为自适应高度，并可滚动 -->
    <div class="flex-1 overflow-y-auto px-4 md:px-6 py-4 relative message-container" ref="messageContainer">
      <!-- 欢迎提示 - 优化渲染性能 -->
      <div v-if="messages.length === 0" class="welcome-container flex flex-col items-center justify-center h-full">
        <!-- 添加温馨爱心动效头像 -->
        <div class="welcome-avatar-container mb-6">
          <div class="welcome-avatar-wrapper">
            <img 
              :src="assistant?.avatar || '/images/ai-avatar.png'" 
              :alt="assistant?.name" 
              class="welcome-avatar"
            >
            <div class="welcome-avatar-glow"></div>
          </div>
          <div class="floating-hearts">
            <div class="floating-heart heart-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="floating-heart heart-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="floating-heart heart-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <h2 class="text-xl font-bold text-gray-800 mb-3 mt-2">{{ assistant?.name }}</h2>
        <p class="text-gray-600 text-center max-w-md mb-6">格格吉祥🧡，{{ assistant?.name }}将为您贴心解答</p>
        
        <!-- 问题建议卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
          <div v-for="(suggestion, index) in suggestions" :key="index" 
               class="suggestion-card"
               @click="usePromptSuggestion(suggestion)">
            <div class="suggestion-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </div>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>
      
      <MessageList 
        v-else
        :messages="messages" 
      />
      
      <!-- 加载指示器 -->
      <div v-if="loading" class="flex justify-center my-4">
        <LoadingIndicator />
      </div>
      
      <!-- 错误消息 -->
      <div v-if="error" class="flex justify-center my-4">
        <div class="bg-red-50 bg-opacity-80 backdrop-blur-sm text-red-600 p-4 rounded-xl border border-red-200 shadow-sm max-w-md w-full flex flex-col">
          <div class="flex items-start">
            <div class="error-icon-container mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="error-pulse"></div>
            </div>
            <div>
              <p class="font-medium text-red-700">{{ error }}</p>
            </div>
          </div>
          <div class="flex justify-center mt-3">
            <button 
              @click="retryLastMessage" 
              class="w-full text-sm bg-white hover:bg-red-50 text-red-600 font-medium py-2 px-4 rounded-lg inline-flex items-center justify-center transition-all shadow-sm border border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
              重试该消息
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="chat-input-section sticky bottom-0 left-0 right-0">
      <InputArea 
        :supports-image="assistant?.supportsImage" 
        @send="sendMessage" 
        :disabled="loading"
      />
      
      <div v-if="loading" class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssistantStore } from '../stores/assistantStore';
import { useChatStore } from '../stores/chatStore';
// 【重要】: 现在 chat.vue 需要同时导入这两个函数
import { fileToBase64, sendMessage as apiSendMessage } from '../utils/api';
import { handleSSE } from '../utils/sse';

import ChatHeader from '../components/chat/ChatHeader.vue';
import MessageList from '../components/chat/MessageList.vue';
import InputArea from '../components/chat/InputArea.vue';
import LoadingIndicator from '../components/common/LoadingIndicator.vue';

const route = useRoute();
const router = useRouter();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();

const messageContainer = ref(null);

// 获取当前助手信息
const assistant = computed(() => 
  assistantStore.getAssistantById(route.params.assistantId)
);

// 从store获取消息、加载状态和错误信息
const messages = computed(() => chatStore.messages);
const loading = computed(() => chatStore.loading);
const error = computed(() => chatStore.error);

// 为不同助手提供的问题建议
const getSuggestions = () => {
  if (!assistant.value) return [];
  
  switch(assistant.value.id) {
    case '1': 
      return ["打电话的开场白怎么说啊？", "面试怎么提问啊？", "怎么解释公式性质", "面试过程怎么提高？"];
    case '2': 
      return ["乙＋丁", "杜门＋丁", "景门＋壬", "壬＋丁"];
    case '3':
      return ["请你帮我解决复杂问题", "请问你能做些什么？", "如何有效地进行决策分析？", "你能给我一些使用建议吗？"];
    case '4': 
      return ["如何培养批判性思维？", "请帮我分析这个问题的多个角度", "如何有效地进行决策分析？", "辩证思维具体应该如何运用？"];
    default:
      return ["你好，我有什么可以帮到你的？", "请问你能做些什么？", "我想了解更多关于你的信息", "你能给我一些使用建议吗？"];
  }
};

const suggestions = computed(() => getSuggestions());

// 预加载助手头像
onBeforeMount(() => {
  if (assistant.value && assistant.value.avatar) {
    const img = new Image();
    img.src = assistant.value.avatar;
  }
});

// 使用提示建议
const usePromptSuggestion = (suggestion) => {
  sendMessage(suggestion, null);
};

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    });
  });
}, { deep: true });

// 组件挂载时清空消息
onMounted(() => {
  requestAnimationFrame(() => {
    chatStore.clearMessages();
    chatStore.setError(null);
    
    if (!assistant.value || !assistant.value.available) {
      router.push('/');
    }
  });
});

// 返回主页
const goBack = () => {
  if (currentSSEConnection) {
    currentSSEConnection.abort();
    currentSSEConnection = null;
  }
  chatStore.clearMessages();
  chatStore.setError(null);
  chatStore.setLoading(false);
  router.push('/');
};

// 开始新对话
const startNewChat = () => {
  if (currentSSEConnection) {
    currentSSEConnection.abort();
    currentSSEConnection = null;
  }
  chatStore.clearMessages();
  chatStore.setError(null);
  chatStore.setLoading(false);
  console.log('开始新对话 - 历史记录已清除');
};

let currentSSEConnection = null;

/**
 * 发送消息的核心函数 (适配最终版sse.js)
 * @param {string} text - 用户输入的文本
 * @param {File|string|null} image - 新上传的图片文件(File)或重试时的base64字符串
 * @param {boolean} isRetry - 标记这是否是一次重试操作
 */
const sendMessage = async (text, image, isRetry = false) => {
  if (!text && !image) return; // 允许只发送图片

  try {
    if (currentSSEConnection) {
      currentSSEConnection.abort();
    }
    
    const historyEndIndex = isRetry ? -1 : messages.value.length;
    const historyForApi = messages.value
      .slice(0, historyEndIndex)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
        image: msg.image || null
      }));

    const currentImageBase64 = await fileToBase64(image);
    
    if (!isRetry) {
      chatStore.addMessage({
        id: Date.now(),
        content: text,
        sender: 'user',
        timestamp: new Date().toISOString(),
        image: currentImageBase64
      });
    }

    chatStore.setLoading(true);
    chatStore.setError(null);

    chatStore.addMessage({
      id: Date.now() + 1,
      content: '',
      sender: 'ai',
      timestamp: new Date().toISOString()
    });

    const payload = {
      assistant_type: assistant.value.id,
      message: text,
      image: currentImageBase64,
      history: historyForApi
    };

    // 【重要】: 这是新的调用方式
    // 第一个参数是一个函数，它负责调用真实的API
    const streamFetcher = () => apiSendMessage(
      payload.assistant_type,
      payload.message,
      payload.image,
      payload.history
    );

    currentSSEConnection = handleSSE(
      streamFetcher, // 依赖注入！
      (chunk) => {
        chatStore.updateLastAiMessage((prev) => prev + chunk);
      },
      () => {
        chatStore.setLoading(false);
        currentSSEConnection = null;
      },
      (err) => {
        console.error('来自SSE的错误回调:', err);
        chatStore.setError('服务暂时遇到问题，请重试。');
        chatStore.setLoading(false);
        currentSSEConnection = null;
      }
    );

  } catch (err) {
    console.error('前端发送逻辑错误:', err);
    chatStore.setError(`发送失败: ${err.message}`);
    chatStore.setLoading(false);
  }
};

/**
 * 重试最后一条消息 (最终版)
 */
const retryLastMessage = () => {
  // 先从UI上移除失败的AI消息占位符和错误提示
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].sender === 'ai') {
    chatStore.removeLastMessage();
  }
  chatStore.setError(null);

  // 找到最后一条用户消息
  const lastUserMessage = [...messages.value].reverse().find(m => m.sender === 'user');
  
  if (lastUserMessage) {
    // 调用核心函数，并标记为重试
    sendMessage(lastUserMessage.content, lastUserMessage.image, true);
  }
};

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (currentSSEConnection) {
    currentSSEConnection.abort();
    currentSSEConnection = null;
  }
});
</script>

<style scoped>
.bg-chat-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
  will-change: opacity;
  contain: strict;
}

.welcome-container {
  animation: fadeIn 0.5s ease-out;
  padding: 1rem;
  will-change: transform, opacity;
  contain: layout style;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
}

.welcome-avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.welcome-avatar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border: 3px solid white;
  z-index: 2;
}

.welcome-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.welcome-avatar-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 192, 203, 0.5) 40%, rgba(186, 1, 251, 0.2) 80%);
  opacity: 0.7;
  z-index: 2;
  animation: avatar-glow 3s infinite alternate;
  pointer-events: none;
}

.floating-hearts {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 3;
}

.floating-heart {
  position: absolute;
  width: 22px;
  height: 22px;
  color: rgba(236, 72, 153, 0.8);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
  animation: floating 6s infinite ease-in-out;
  z-index: 3;
}

.heart-1 {
  top: -5px;
  right: 10px;
  animation-delay: 0s;
}

.heart-2 {
  top: 25px;
  right: -8px;
  width: 18px;
  height: 18px;
  animation-delay: 1.5s;
}

.heart-3 {
  bottom: 15px;
  right: 5px;
  width: 16px;
  height: 16px;
  animation-delay: 3s;
}

@keyframes avatar-glow {
  0% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  100% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes floating {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(5deg);
  }
  50% {
    transform: translateY(-15px) rotate(0deg);
  }
  75% {
    transform: translateY(-7px) rotate(-5deg);
  }
}

.suggestion-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(186, 1, 251, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4a5568;
  contain: content;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(186, 1, 251, 0.1);
  border-color: rgba(186, 1, 251, 0.3);
  background-color: #fdf6ff;
}

.suggestion-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f0e5ff;
  color: #ba01fb;
  margin-right: 10px;
  flex-shrink: 0;
}

.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.message-container {
  height: 0; /* 让flex-1生效 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* 提升移动端滚动体验 */
}

.chat-input-section {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f8f8f8;
  border-top: 1px solid #eee;
  padding: 0.75rem 1rem;
  z-index: 10;
  contain: content;
  will-change: transform;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

/* 打字指示器动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  backdrop-filter: blur(4px);
  will-change: transform;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin: 0 2px;
  background-color: #ba01fb;
  animation: typingAnimation 1.4s infinite ease-in-out both;
  will-change: transform, opacity;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingAnimation {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .chat-input-section {
    padding: 0.5rem;
  }
}

/* 错误提示样式 */
.error-icon-container {
  position: relative;
  width: 24px;
  height: 24px;
}

.error-pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(248, 113, 113, 0.4);
  animation: error-pulse 2s infinite;
  will-change: transform, opacity;
}

@keyframes error-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
