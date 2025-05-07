import { defineStore } from 'pinia'

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    assistants: [
      {
        id: '1',
        name: '招聘小柯',
        description: '你的面试，我来帮你搞定，相信我！',
        avatar: '/images/recruitment-assistant.jpg',  
        available: true,
        supportsImage: true
      },
      {
        id: '2',
        name: '奇门老朽木',
        description: '老了，不中用了，只能讲讲格局了，唉~',
        avatar: '/images/qimen-assistant.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '3',
        name: 'Gemini小美女',
        description: '出身于Gemini2.5pro-pre0325，娇弱身姿硬刚GPT，反应稍慢，但不在话下。',
        avatar: '/images/general-assistant.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '4',
        name: 'GPT小孩哥',
        description: 'AI界的扛把子，GPT-4o出身，我只要嘴角一咧，万事可成！',
        avatar: '/images/4.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '5',
        name: 'kimi小老头',
        description: '躬耕于kimi，小伙子急嘛，找我，，哈哈哈',
        avatar: '/images/thinking-assistant.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '6',
        name: '流浪小猪猪',
        description: '目前在流浪，没有师父配置我，呜呜呜',
        avatar: '/images/beiyong.jpg',
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
