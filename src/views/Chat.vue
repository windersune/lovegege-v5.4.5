<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssistantStore } from '../stores/assistantStore';
import { useChatStore } from '../stores/chatStore';
import { handleSSE } from '../utils/sse'; // 只需要 sse

const route = useRoute();
const router = useRouter();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();

// --- 解构 store 状态和 actions ---
const messages = computed(() => chatStore.messages);
const loading = computed(() => chatStore.loading);
const error = computed(() => chatStore.error);
const { 
  addMessage, 
  popMessage,
  appendLastMessageContent, 
  setLoading, 
  setError, 
  clearMessages, 
  finalizeUserMessageAsMultimodal 
} = chatStore;

// --- 其他辅助 ref 和 computed 保持不变 ---
const messageContainer = ref(null);
const assistant = computed(() => assistantStore.getAssistantById(route.params.assistantId));
// (您的 suggestions 相关代码也保持不变)
const suggestions = computed(() => {
    // ... 您的 suggestions 逻辑
    return []; // 示例
});


// --- 生命周期钩子和简单函数保持不变 ---
watch(messages, () => { /* ... */ }, { deep: true });
onMounted(() => { /* ... */ });
const goBack = () => { /* ... */ };
const startNewChat = () => { /* ... */ };
const usePromptSuggestion = (suggestion) => sendMessage(suggestion, null);

let currentSSEConnection = null;

// --- 重构的 sendMessage 函数 ---
async function sendMessage(text, imageFile) {
  if (loading.value) return;

  setLoading(true);
  setError(null);

  // 1. 创建用户消息对象（UI友好格式）
  addMessage({
    role: 'user',
    content: text,
    imageFile: imageFile // 携带文件对象，以便后续处理
  });

  // 2. 准备API历史记录（不含刚添加的这条）
  const historyForApi = messages.value.slice(0, -1);
  
  // 3. 添加助手占位消息
  addMessage({ role: 'assistant', content: '' });

  try {
    currentSSEConnection = handleSSE(
      'your_api_endpoint', // 这个URL现在只是一个标识符
      {
        assistant_type: assistant.value.id,
        message: text,
        image: imageFile, // 将文件对象直接传给sse
        history: historyForApi
      },
      // onMessage: 流式更新最后一条消息
      (chunk) => {
        appendLastMessageContent(chunk);
      },
      // onComplete: 对话完成，固化历史记录
      async () => {
        await finalizeUserMessageAsMultimodal(); // 这是最关键的一步！
        setLoading(false);
        currentSSEConnection = null;
      },
      // onError: 处理错误
      (err) => {
        setError(err.message || '通信错误');
        setLoading(false);
        popMessage(); // 移除助手占位符
        currentSSEConnection = null;
      }
    );
  } catch (err) {
    setError(err.message || '发送失败');
    setLoading(false);
  }
}

// ... retryLastMessage 和 onBeforeUnmount 保持不变 ...
const retryLastMessage = () => { /* ... */ };
onBeforeUnmount(() => { /* ... */ });
</script>
