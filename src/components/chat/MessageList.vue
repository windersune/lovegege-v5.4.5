<template>
  <div class="message-list">
    <div v-for="(message, index) in messages" :key="message.id" 
         class="message-container mb-4"
         :class="{ 'animate-message': index === messages.length - 1 }">
      <div class="flex items-start" :class="message.sender === 'user' ? 'justify-end' : 'justify-start'">
        <!-- 消息气泡 -->
        <div class="message-bubble" 
             :class="[
               message.sender === 'user' ? 'user-message' : 'ai-message',
               message.sender === 'user' ? 'user-bubble' : 'ai-bubble'
             ]">
          <!-- 如果是用户上传的图片 -->
          <div v-if="message.image" class="mb-3 image-container">
            <img :src="message.image" alt="用户上传图片" class="max-w-full rounded-lg shadow-sm">
          </div>
          
          <!-- 消息内容 -->
          <div v-if="message.sender === 'user'" class="message-text">
            {{ message.content }}
          </div>
          <div v-else class="markdown-content message-text" v-html="renderMarkdown(message.content)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { renderMarkdown } from '../../utils/markdown';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  userAvatar: {
    type: String,
    default: '/images/user-avatar.png'
  },
  assistantAvatar: {
    type: String,
    default: '/images/ai-avatar.png'
  }
});
</script>

<style scoped>
.message-text {
  line-height: 1.6;
}

.user-bubble {
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transform-origin: right center;
}

.ai-bubble {
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transform-origin: left center;
}

.user-message {
  background: linear-gradient(to right, #d4ebff, #e0f2ff);
  color: #2c5282;
  font-weight: 450;
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 85%;
  margin-left: auto;
}

.ai-message {
  background: linear-gradient(to right, #f3e8ff, #f8f4ff);
  color: #553c9a;
  font-weight: 450;
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 85%;
  margin-right: auto;
}

.image-container {
  max-width: 280px;
  overflow: hidden;
  transition: transform 0.3s ease;
  border-radius: 12px;
}

.image-container:hover {
  transform: scale(1.03);
}

/* 消息动画 */
.animate-message {
  animation: message-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes message-slide-in {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 修改 Markdown 渲染样式 */
:deep(.markdown-content a) {
  color: #8e00cc;
  text-decoration: none;
  border-bottom: 1px dashed #ba01fb;
  padding-bottom: 1px;
  transition: border-bottom 0.2s;
}

:deep(.markdown-content a:hover) {
  border-bottom: 1px solid #ba01fb;
}

:deep(.markdown-content pre) {
  background-color: #f9f5ff;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
  overflow-x: auto;
}

:deep(.markdown-content code) {
  background-color: #f9f5ff;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

:deep(.markdown-content p) {
  margin: 8px 0;
}

:deep(.markdown-content ul, .markdown-content ol) {
  padding-left: 20px;
  margin: 8px 0;
}

:deep(.markdown-content h1, .markdown-content h2, .markdown-content h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #553c9a;
}

:deep(.markdown-content blockquote) {
  border-left: 3px solid #e9d8fd;
  padding-left: 12px;
  color: #6b46c1;
  font-style: italic;
  margin: 12px 0;
}
</style>
