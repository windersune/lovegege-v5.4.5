import { defineStore } from 'pinia'

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    assistants: [
      {
        id: '1',
        name: 'GPT阿布',
        description: 'AI界的海盗王，gpt-4.0出身，我一出马，万事可成！',
        avatar: '/images/7.12-1.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '2',
        name: 'GPT女皇',
        description: '出身于gpt-4.1-mini，娇弱身姿压制GPT阿布。',
        avatar: '/images/7.12-2.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '3',
        name: '奇门老朽木',
        description: '老了，不中用了，只能讲讲格局了，唉~',
        avatar: '/images/qimen-assistant.jpg',
        available: true,
        supportsImage: false
      },
      
      {
        id: '4',
        name: 'GPT小孩哥',
        description: '出身于gpt-4.1，我是小小孩子哦',
        avatar: '/images/7.12-4.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '5',
        name: '老师傅',
        description: '继往圣之绝，开万世之太平。',
        avatar: '/images/7.12-6.jpg',
        available: true,
        supportsImage: false
      },
      {
        id: '6',
        name: 'dify小助手',
        description: '基于dify的各种玩法哦，目前使用gemini-2.5pro模型',
        avatar: '/images/general-assistant.jpg',
        available: true,
        supportsImage: true
      }
    ]
  }),
  getters: {
    getAssistantById: (state) => (id) => {
      return state.assistants.find(assistant => assistant.id === id) || null
    },
    availableAssistants: (state) => {
      return state.assistants.filter(assistant => assistant.available)
    }
  }
})
