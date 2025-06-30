import { defineStore } from 'pinia'

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    assistants: [
      {
        id: '1',
        name: 'GPT小孩哥',
        description: 'AI界的扛把子，GPT-4o出身，我只要嘴角一咧，万事可成！',
        #avatar: '/images/recruitment-assistant.jpg',  
        avatar: '/images/4.jpg',
        available: true,
        supportsImage: true
      },
      {
        id: '2',
        name: 'Gemini小美女',
        description: '出身于Gemini2.5falsh，娇弱身姿硬刚GPT，反应稍慢，但不在话下。',
        avatar: '/images/general-assistant.jpg',
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
        name: '流浪小猪猪',
        description: '目前在流浪，没有师父配置我，呜呜呜',
        avatar: '/images/beiyong.jpg',
        available: true,
        supportsImage: false
      },
      {
        id: '5',
        name: '流浪小猪猪',
        description: '目前在流浪，没有师父配置我，呜呜呜',
        avatar: '/images/beiyong.jpg',
        available: true,
        supportsImage: false
      },
      {
        id: '6',
        name: '流浪小猪猪',
        description: '目前在流浪，没有师父配置我，呜呜呜',
        avatar: '/images/beiyong.jpg',
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
