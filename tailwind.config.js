/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ba01fb', // 主色调：紫色
        'primary-light': '#e3b5ff', // 浅紫色
        'primary-dark': '#8e00cc', // 深紫色
        secondary: '#f3e8ff', // 辅助色：浅紫色
        background: '#f9fafb', // 背景色：浅灰色
        'user-message': '#e9f5ff', // 用户消息气泡背景色
        'ai-message': '#f3e8ff', // AI消息气泡背景色
        success: '#10b981', // 成功色：绿色
        warning: '#f59e0b', // 警告色：橙色
        error: '#ef4444', // 错误色：红色
        info: '#3b82f6', // 信息色：蓝色
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'button': '0 2px 5px 0 rgba(186, 1, 251, 0.2)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#333',
            a: {
              color: '#ba01fb',
              '&:hover': {
                color: '#8e00cc',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
