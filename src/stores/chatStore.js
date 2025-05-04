import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    loading: false,
    error: null
  }),
  actions: {
    addMessage(message) {
      this.messages.push(message)
    },
    clearMessages() {
      this.messages = []
    },
    setLoading(status) {
      this.loading = status
    },
    setError(error) {
      this.error = error
    },
    updateLastAiMessage(content) {
      const lastAiMessageIndex = [...this.messages].reverse().findIndex(msg => msg.sender === 'ai')
      if (lastAiMessageIndex !== -1) {
        const actualIndex = this.messages.length - 1 - lastAiMessageIndex
        if (typeof content === 'function') {
          this.messages[actualIndex].content = content(this.messages[actualIndex].content)
        } else {
          this.messages[actualIndex].content = content
        }
      }
    }
  }
})
