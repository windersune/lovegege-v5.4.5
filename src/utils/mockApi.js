// 模拟数据，用于测试前端UI
const mockAssistants = [
  {
    id: 'general',
    name: '通用助手',
    description: '可以回答各种问题的通用AI助手',
    avatar: '/images/general-assistant.png',
    available: true,
    supportsImage: true
  },
  {
    id: 'recruitment',
    name: '招聘助手',
    description: '专注于招聘、简历筛选和面试问题的AI助手',
    avatar: '/images/recruitment-assistant.png',
    available: true,
    supportsImage: true
  },
  {
    id: 'qimen',
    name: '奇门师傅',
    description: '精通奇门遁甲和传统文化知识的AI助手',
    avatar: '/images/qimen-assistant.png',
    available: true,
    supportsImage: true
  },
  {
    id: 'thinking',
    name: '思考专家',
    description: '擅长深度思考和分析问题的AI助手',
    avatar: '/images/thinking-assistant.png',
    available: true,
    supportsImage: true
  },
  {
    id: 'backup1',
    name: '备用助手1',
    description: '敬请期待',
    avatar: '/images/backup-assistant.png',
    available: false,
    supportsImage: true
  },
  {
    id: 'backup2',
    name: '备用助手2',
    description: '敬请期待',
    avatar: '/images/backup-assistant.png',
    available: false,
    supportsImage: true
  },
  {
    id: 'backup3',
    name: '备用助手3',
    description: '敬请期待',
    avatar: '/images/backup-assistant.png',
    available: false,
    supportsImage: true
  },
  {
    id: 'backup4',
    name: '备用助手4',
    description: '敬请期待',
    avatar: '/images/backup-assistant.png',
    available: false,
    supportsImage: true
  }
];

// 模拟API响应
export function mockApiResponse(assistantId, message, image = null) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = {
        general: `这是通用助手的回复。您问的是: "${message}"${image ? '\n\n我看到您上传了一张图片。' : ''}`,
        recruitment: `这是招聘助手的回复。关于您的问题: "${message}"${image ? '\n\n我已收到您上传的图片，看起来像是一份简历。' : ''}`,
        qimen: `这是奇门师傅的回复。您询问的: "${message}"${image ? '\n\n您上传的图片我已查看。' : ''}`,
        thinking: `这是思考专家的回复。对于您的问题: "${message}"，我需要深入思考一下。${image ? '\n\n您提供的图片对分析很有帮助。' : ''}`
      };
      
      resolve(responses[assistantId] || `这是AI助手的回复。您的消息是: "${message}"`);
    }, 1000);
  });
}

// 模拟流式响应
export function mockStreamResponse(assistantId, message, onChunk, onComplete) {
  const fullResponse = {
    general: `这是通用助手的回复。您问的是: "${message}"。\n\n我可以回答各种问题，包括科学、历史、文化、技术等多个领域的内容。如果您有任何其他问题，请随时向我提问。`,
    recruitment: `这是招聘助手的回复。关于您的问题: "${message}"。\n\n我专注于招聘相关问题，可以帮助您筛选简历、设计面试问题、评估候选人等。如果您需要更多招聘方面的帮助，请告诉我。`,
    qimen: `这是奇门师傅的回复。您询问的: "${message}"。\n\n奇门遁甲是中国古代的一种预测学，结合了天文、地理、阴阳五行等多种学说。我可以为您解答相关问题，或进行简单的奇门预测。`,
    thinking: `这是思考专家的回复。对于您的问题: "${message}"，我需要深入思考一下。\n\n让我们从多个角度分析这个问题：\n\n1. 首先，我们需要明确问题的核心\n2. 其次，我们可以考虑不同的解决方案\n3. 最后，我们可以评估每种方案的优缺点\n\n经过综合分析，我认为...`
  };
  
  const response = fullResponse[assistantId] || `这是AI助手的回复。您的消息是: "${message}"`;
  const chunks = response.split('');
  
  let i = 0;
  const interval = setInterval(() => {
    if (i < chunks.length) {
      onChunk(chunks[i]);
      i++;
    } else {
      clearInterval(interval);
      onComplete();
    }
  }, 50);
  
  return () => clearInterval(interval); // 返回清理函数
}
