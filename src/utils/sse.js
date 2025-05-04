/**
 * 处理SSE（Server-Sent Events）流式响应
 * 前端版本 - 直接使用6个助手模块的实现
 * 
 * @param {string} url - 仅作为标识，实际不使用
 * @param {Object} data - 请求数据
 * @param {Function} onMessage - 接收消息片段的回调函数
 * @param {Function} onComplete - 完成时的回调函数
 * @param {Function} onError - 错误处理回调函数
 * @param {Object} options - 配置选项
 */
export function handleSSE(url, data, onMessage, onComplete, onError, options = {}) {
  const { assistant_type, message, image, history } = data;
  let aborted = false;

  // 创建中止控制器
  const controller = new AbortController();

  // 中止当前处理的函数
  const abort = () => {
    aborted = true;
    controller.abort();
  };

  // 处理流式响应
  const processStream = async () => {
    try {
      // 使用前端API获取响应
      const { sendMessage } = await import('./api.js');
      
      // 处理历史消息
      let formattedHistory = [];
      if (history && history.length > 0) {
        formattedHistory = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
      
      console.log('发送消息:', {
        assistant_type,
        message,
        imageExists: !!image,
        historyLength: formattedHistory.length
      });
      
      // 调用助手API
      const response = await sendMessage(assistant_type, message, image, formattedHistory);

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取响应的reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // 读取数据流
      while (!aborted) {
        const { done, value } = await reader.read();
        
        if (done) {
          // 处理缓冲区中剩余的数据
          if (buffer.trim()) {
            processChunk(buffer);
          }
          onComplete();
          break;
        }

        // 解码并处理数据
        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        // 处理完整的SSE消息
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的块

        for (const line of lines) {
          processChunk(line);
        }
      }
      
    } catch (error) {
      console.error('SSE处理错误:', error);
      
      // 如果中止则不处理错误
      if (aborted) {
        return;
      }
      
      onError(error);
    }
  };

  // 处理数据块
  const processChunk = (chunk) => {
    if (!chunk || chunk.trim() === '') return;
    
    try {
      // 尝试解析JSON
      if (chunk.startsWith('data: ')) {
        const jsonStr = chunk.substring(6);
        try {
          const data = JSON.parse(jsonStr);
          // 检查是否有错误标志
          if (data.error) {
            console.error('返回错误:', data.content);
            onError(new Error(data.content));
            return;
          }
          onMessage(data.content || data.text || jsonStr);
        } catch (e) {
          console.error('JSON解析错误:', e, 'raw:', jsonStr);
          // 如果不是JSON，直接传递文本
          onMessage(jsonStr);
        }
      } else {
        onMessage(chunk);
      }
    } catch (error) {
      console.error('Error processing SSE chunk:', error);
      onMessage(chunk); // 降级处理：直接传递原始文本
    }
  };

  // 开始处理
  processStream();
  
  // 返回中止函数，允许外部代码中止处理
  return { abort };
}
  