import { defineStore } from 'pinia'

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    assistants: [
      {
        id: '1',
        name: 'GPT阿布',
        description: 'AI界的海盗王，GPT出身，我一出马，万事可成！',
        avatar: '/images/7.12-1.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '2',
        name: 'GPT女皇',
        description: '出身于GPT，娇弱身姿压制GPT阿布。',
        avatar: '/images/7.12-2.jpg',
        available: true,
        supportsImage: false
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
        description: '我只能在公共网络/wifi情况下使用，移动网络不行哦',
        avatar: '/images/7.12-4.jpg',
        available: true,
        supportsImage: false
      },
      {
        id: '5',
        name: 'Gemini大美女（wifi版）',
        description: '我只能在公共网络/wifi情况下使用，移动网络不行哦',
        avatar: '/images/7.12-5.jpg',
        available: false,
        supportsImage: false
      },
      {
        id: '6',
        name: '老师傅',
        description: '继往圣之绝，开万世之太平。',
        avatar: '/images/7.12-6.jpg',
        available: true,
        supportsImage: false
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
