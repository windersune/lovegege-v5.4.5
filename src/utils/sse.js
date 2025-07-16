/**
 * 处理SSE（Server-Sent Events）流式响应 (最终修复版 - 解决循环依赖)
 * 采用依赖注入模式，由调用者提供获取数据流的函数。
 *
 * @param {Function} streamFetcher - 一个【函数】，当被调用时，它必须返回一个 Promise，该 Promise 解析为一个包含流式 body 的 Response 对象。
 * @param {Function} onMessage - 接收消息片段的回调函数。
 * @param {Function} onComplete - 完成时的回调函数。
 * @param {Function} onError - 错误处理回调函数。
 */
export function handleSSE(streamFetcher, onMessage, onComplete, onError) {
  let aborted = false;
  // AbortController 仍然是可选的，但好的实践是保留它
  const controller = new AbortController(); 

  const abort = () => {
    aborted = true;
    controller.abort(); // 如果 streamFetcher 内部使用了 signal，这将非常有用
    console.log('SSE stream aborted by caller.');
  };

  const processStream = async () => {
    try {
      // 不再动态导入！直接执行调用者提供的函数来获取响应。
      console.log('SSE层: 执行 streamFetcher 以获取响应...');
      const response = await streamFetcher();

      if (!response || !response.ok) {
        // 尝试从失败的响应中读取错误信息
        const errorText = await response?.text() || 'Unknown HTTP error';
        throw new Error(`HTTP error! status: ${response?.status}, message: ${errorText}`);
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
      console.error('SSE处理或网络请求错误:', error);
      onError(error);
    }
  };

  const processChunk = (chunk) => {
    if (!chunk || chunk.trim() === '') return;
    
    try {
      if (chunk.startsWith('data: ')) {
        const jsonStr = chunk.substring(6);
        // 增加对特殊标记 `[DONE]` 的处理（如果后端使用）
        if (jsonStr.trim() === '[DONE]') {
          return;
        }
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            console.error('SSE流中返回错误:', data.content);
            onError(new Error(data.content));
            return;
          }
          onMessage(data.content || data.text || '');
        } catch (e) {
          // 如果解析失败，可能只是纯文本块
          onMessage(jsonStr);
        }
      } else {
        // 处理非 'data:' 开头的行（虽然不常见，但为了健壮性）
        onMessage(chunk);
      }
    } catch (error) {
      console.error('处理SSE块时出错:', error);
      onMessage(chunk); // 降级处理
    }
  };

  processStream();
  
  // 返回中止函数，允许外部代码中止处理
  return { abort };
}
