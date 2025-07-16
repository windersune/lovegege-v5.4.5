// src/utils/api.js

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
 * @param {string|null} imageBase64 - 【重要】这里接收的已经是处理好的Base64字符串
 * @param {Array} history - 完整的消息历史记录
 * @returns {Promise<Response>}
 */
export async function sendMessage(assistantId, message, imageBase64 = null, history = []) {
  try {
    const getAssistantModule = assistantModules[assistantId];
    if (!getAssistantModule) {
      throw new Error(`未找到助手ID: ${assistantId}`);
    }

    const assistantModule = await getAssistantModule();

    // 准备消息格式，从历史记录开始
    const messages = [...history];
    
    // 创建当前用户的消息
    const currentUserMessage = {
      role: 'user',
      content: message || '' // 确保 content 始终存在
    };
    
    // 【关键修复点】: 直接使用传入的base64字符串，不再重复转换
    if (imageBase64) {
      currentUserMessage.image = imageBase64;
    }

    // 将当前用户的完整消息添加到数组末尾
    messages.push(currentUserMessage);

    // 创建一个模拟的流式响应
    const { readable, writable } = new TransformStream();
    const response = new Response(readable, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' }
    });

    (async () => {
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      try {
        const stream = await assistantModule.getResponse(messages);
        
        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            const data = JSON.stringify({ content });
            writer.write(encoder.encode(`data: ${data}\n\n`));
          }
        }
      } catch (error) {
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
 * 将图片文件转换为Base64 (增加健壮性)
 */
export function fileToBase64(file) {
  if (!(file instanceof Blob)) {
    return Promise.resolve(null); // 如果传入的不是文件或Blob，直接返回null，避免崩溃
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
