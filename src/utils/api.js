// src/utils/api.js

// 导入助手消息处理模块函数
const assistantModules = {
  1: () => import('../../assistant/assistant_id_1/message.js'),
  2: () => import('../../assistant/assistant_id_2/message.js'),
  3: () => import('../../assistant/assistant_id_3/message.js'),
  4: () => import('../../assistant/assistant_id_4/message.js'),
  5: () => import('../../assistant/assistant_id_5/message.js'),
  6: () => import('../../assistant/assistant_id_6/message.js')
};

/**
 * 发送消息到AI助手 (已修复)
 * @param {string} assistantId - 助手ID
 * @param {string} message - 用户消息文本
 * @param {string|null} imageBase64 - 【注意】这里接收的已经是处理好的Base64字符串
 * @param {Array} history - 消息历史记录
 * @returns {Promise}
 */
export async function sendMessage(assistantId, message, imageBase64 = null, history = []) {
  try {
    const getAssistantModule = assistantModules[assistantId];
    if (!getAssistantModule) {
      throw new Error(`未找到助手ID: ${assistantId}`);
    }

    const assistantModule = await getAssistantModule();

    const messages = [...history];
    
    const currentUserMessage = {
      role: 'user',
      content: message || '' // 确保 content 始终存在
    };
    
    // 【关键修复点】: 直接使用传入的base64字符串，不再重复转换
    if (imageBase64) {
      currentUserMessage.image = imageBase64;
    }

    messages.push(currentUserMessage);

    // 创建一个模拟的流式响应
    const { readable, writable } = new TransformStream();
    const response = {
      ok: true,
      status: 200,
      body: readable,
      headers: new Headers({ 'Content-Type': 'text/event-stream' })
    };

    (async () => {
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      try {
        console.log('API层: 准备发送消息到真实助手API, 消息数量:', messages.length);
        
        const stream = await assistantModule.getResponse(messages);
        
        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            const data = JSON.stringify({ content });
            writer.write(encoder.encode(`data: ${data}\n\n`));
          }
        }
      } catch (error) {
        console.error('助手响应处理错误:', error);
        const errorData = JSON.stringify({ error: true, content: error.message || '处理请求时出错' });
        writer.write(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        writer.close();
      }
    })();

    return response;
  } catch (error) {
    console.error('发送消息错误:', error);
    throw error;
  }
}

/**
 * 上传图片 (保持不变)
 */
export async function uploadImage(file) {
  try {
    const base64Image = await fileToBase64(file);
    return { url: base64Image, success: true };
  } catch (error) {
    console.error('上传图片错误:', error);
    throw error;
  }
}

/**
 * 将图片文件转换为Base64 (保持不变, 但现在只有 chat.vue 会调用它)
 */
export function fileToBase64(file) {
  // 【健壮性优化】: 增加对非Blob类型参数的防护
  if (!(file instanceof Blob)) {
    console.error("fileToBase64 接收到无效参数:", file);
    // 返回一个解析为 null 的 Promise，避免崩溃
    return Promise.resolve(null); 
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
