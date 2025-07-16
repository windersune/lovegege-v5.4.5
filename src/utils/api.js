/**
 * API工具函数 - 前端JS实现版本（直接调用真实API）
 * 直接使用assistant文件夹中的六个助手配置
 */

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
 * 发送消息到AI助手
 * @param {string} assistantId - 助手ID
 * @param {string} message - 用户消息文本
 * @param {File|null} image - 可选的图片文件
 * @param {Array} history - 消息历史记录
 * @returns {Promise} - 返回Promise对象
 */
export async function sendMessage(assistantId, message, image = null, history = []) {
  try {
    // 获取对应助手的消息处理模块
    const getAssistantModule = assistantModules[assistantId];
    if (!getAssistantModule) {
      throw new Error(`未找到助手ID: ${assistantId}`);
    }

    // 动态导入对应的助手模块
    const assistantModule = await getAssistantModule();

    // 准备消息格式 - 包含历史记录
    const messages = [...history];
    
    // 添加当前消息
    if (message) {
      messages.push({
        role: 'user',
        content: message
      });
    }
    
    // 确保消息非空
    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: '你好'
      });
    }

    // 如果有图片，添加图片信息到最后一条用户消息
// 修正后的代码
    if (image && messages.length > 0) {
      // 直接使用传入的 image 变量，因为它已经是 Base64 格式的 URL
      const imageBase64 = image; 
      
      // 找到最后一条用户消息并附加图片
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          // 确保 messages[i] 存在并且是一个对象
          if (messages[i]) {
            messages[i].image = imageBase64;
          }
          break;
        }
      }
    }

    // 创建一个可读流
    const { readable, writable } = new TransformStream();
    
    // 创建响应对象
    const response = {
      ok: true,
      status: 200,
      body: readable,
      headers: new Headers({
        'Content-Type': 'text/event-stream'
      })
    };

    // 开始处理
    (async () => {
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      try {
        console.log('准备发送消息到助手:', { assistantId, msgCount: messages.length });
        
        // 直接调用真实API
        const stream = await assistantModule.getResponse(messages);
        
        // 处理流式响应
        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            // 将内容包装成SSE格式
            const content = chunk.choices[0].delta.content;
            const data = JSON.stringify({ content });
            writer.write(encoder.encode(`data: ${data}\n\n`));
          }
        }
      } catch (error) {
        console.error('助手响应处理错误:', error);
        // 发送错误信息
        const errorData = JSON.stringify({ error: true, content: error.message || '处理请求时出错' });
        writer.write(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        // 关闭流
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
 * 上传图片
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} - 返回包含图片URL的对象
 */
export async function uploadImage(file) {
  try {
    // 前端将图片转为Base64并存储，不需要上传到服务器
    const base64Image = await fileToBase64(file);
    
    // 返回图片URL（Base64格式）
    return {
      url: base64Image,
      success: true
    };
  } catch (error) {
    console.error('上传图片错误:', error);
    throw error;
  }
}

/**
 * 将图片文件转换为Base64
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 返回Base64编码的图片数据
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
