import { fileToBase64 } from '../utils/api'; // <-- 1. 添加这行导入

<template>
  <div class="input-area">
    <!-- 主输入容器 -->
    <div class="input-container">
      <!-- 图片上传按钮 -->
      <label v-if="supportsImage" for="image-upload" class="action-btn image-upload-btn" :class="{ 'disabled': disabled }">
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleImageSelect"
          :disabled="disabled"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
      </label>
      
      <!-- 文本输入区域 -->
      <textarea
        v-model="inputText"
        class="message-input"
        placeholder="输入您的问题..."
        rows="1"
        ref="textareaRef"
        @input="adjustTextareaHeight"
        @keydown.enter.prevent="handleEnterKey"
        :disabled="disabled"
      ></textarea>
      
      <!-- 清除按钮 - 仅在有文本且未禁用时显示 -->
      <button 
        v-if="inputText.length > 0 && !disabled" 
        @click="clearInput" 
        class="action-btn clear-btn"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- 发送按钮 -->
      <button
        @click="sendMessage"
        class="action-btn send-btn"
        :class="{ 'disabled': shouldDisableSend }"
        :disabled="shouldDisableSend"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </div>
    
    <!-- 预览已选图片 -->
    <div v-if="selectedImage" class="image-preview">
      <img :src="imagePreview" alt="预览图片" class="preview-image" />
      <button @click="removeImage" class="remove-image-btn">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <!-- 简短提示 -->
    <div class="input-hint">
      <span>按 Enter 发送，Shift + Enter 换行</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  supportsImage: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send']);

const inputText = ref('');
const selectedImage = ref(null);
const imagePreview = ref('');
const textareaRef = ref(null);

// 计算发送按钮是否应该禁用
const shouldDisableSend = computed(() => {
  return props.disabled || (inputText.value.trim().length === 0 && !selectedImage.value);
});

// 监听输入框内容变化，自动调整高度
watch(inputText, () => {
  nextTick(() => {
    adjustTextareaHeight();
  });
});

// 组件挂载时设置初始高度
onMounted(() => {
  adjustTextareaHeight();
});

// 调整文本区域高度
const adjustTextareaHeight = () => {
  const textarea = textareaRef.value;
  if (!textarea) return;
  
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
};

// 处理Enter键按下
const handleEnterKey = (e) => {
  // 如果按住Shift键，则插入换行符
  if (e.shiftKey) {
    return;
  }
  
  // 否则发送消息
  sendMessage();
};

// 发送消息（--------------修改点----------------）
const sendMessage = async () => { // <-- 声明为 async
  if (shouldDisableSend.value) {
    return;
  }

  try {
    // 如果有选中的图片文件，先将其转换为Base64
    const imageBase64 = selectedImage.value 
      ? await fileToBase64(selectedImage.value) 
      : null;

    // 发射已经处理好的文本和Base64字符串
    emit('send', inputText.value, imageBase64);

    // 清理工作
    inputText.value = '';
    removeImage();
    nextTick(() => {
      adjustTextareaHeight();
    });
  } catch (error) {
    // 如果文件转换失败，在这里可以给用户提示
    console.error("在 InputArea 中转换图片失败:", error);
    alert("图片处理失败，请尝试其他图片。");
  }
};

// 处理图片选择
const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  selectedImage.value = file;
  imagePreview.value = URL.createObjectURL(file);
  
  // 重置文件输入以允许选择相同文件
  e.target.value = '';
};

// 移除已选图片
const removeImage = () => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
  }
  selectedImage.value = null;
  imagePreview.value = '';
};

// 清除输入
const clearInput = () => {
  inputText.value = '';
  nextTick(() => {
    adjustTextareaHeight();
  });
};
</script>

<style scoped>
.input-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  will-change: transform; /* 性能优化 */
}

.input-container {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 40px; /* 调整为更大的圆角效果 */
  border: 1px solid #ebebeb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: border-color 0.2s;
  padding: 5px;
  margin: 0 auto;
  max-width: 700px;
  width: 100%;
  contain: layout style;
  will-change: transform;
  transform: translateZ(0);
}

.input-container:focus-within {
  border-color: #ebebeb;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  min-height: 20px;
  max-height: 120px;
  padding: 9px 6px 9px 10px;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  background-color: transparent;
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.message-input::placeholder {
  color: #aaa;
}

.action-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0 2px;
}

.image-upload-btn {
  color: #777;
}

.image-upload-btn:hover:not(.disabled) {
  color: #555;
  background-color: #f7f7f7;
}

.send-btn {
  background-color: #ba01fb;
  color: white;
  margin-left: 2px;
  margin-right: 2px;
  transform: scale(1);
}

.send-btn:hover:not(.disabled) {
  background-color: #a400e0;
  transform: scale(1.05);
}

.send-btn.disabled {
  background-color: #e2e2e2;
  opacity: 0.8;
}

.icon {
  width: 20px;
  height: 20px;
}

.hidden {
  display: none;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 图片预览样式 */
.image-preview {
  position: relative;
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  max-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-left: auto;
  margin-right: auto;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  padding: 0;
}

.remove-image-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 简短提示文本 */
.input-hint {
  text-align: right;
  font-size: 11px;
  color: #a0aec0;
  margin-top: 4px;
  padding-right: 8px;
}

@media (max-width: 640px) {
  .input-container {
    padding: 4px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
  }
  
  .icon {
    width: 18px;
    height: 18px;
  }
  
  .message-input {
    font-size: 14px;
    padding: 7px 4px 7px 6px;
  }
  
  .input-hint {
    display: none; /* 在移动端隐藏提示 */
  }
}
</style>
