// src/utils/sse.js

/**
 * 处理SSE（Server-Sent Events）流式响应 (已修复)
 */
export function handleSSE(url, data, onMessage, onComplete, onError, options = {}) {
  const { assistant_type, message, image, history } = data;
  let aborted = false;
  const controller = new AbortController();

  const abort = () => {
    aborted = true;
    controller.abort();
  };

  const processStream = async () => {
    try {
      const { sendMessage } = await import('./api.js');
      
      // 【关键修复点】: 直接传递完整的历史记录，不再 stripping 图片信息
      const formattedHistory = history || [];
      
      console.log('SSE层: 准备调用API, 载荷:', {
        assistant_type,
        message,
        image_exists: !!image,
        history_length: formattedHistory.length
      });
      
      // 调用助手API, `image` 参数已经是base64
      const response = await sendMessage(assistant_type, message, image, formattedHistory);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (!aborted) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer.trim()) processChunk(buffer);
          onComplete();
          break;
        }

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processChunk(line);
        }
      }
      
    } catch (error) {
      if (aborted) return;
      console.error('SSE处理错误:', error);
      onError(error);
    }
  };

  const processChunk = (chunk) => {
    if (!chunk || chunk.trim() === '') return;
    try {
      if (chunk.startsWith('data: ')) {
        const jsonStr = chunk.substring(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            onError(new Error(data.content));
            return;
          }
          onMessage(data.content || data.text || '');
        } catch (e) {
          onMessage(jsonStr);
        }
      } else {
        onMessage(chunk);
      }
    } catch (error) {
      onMessage(chunk);
    }
  };

  processStream();
  
  return { abort };
}
