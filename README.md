# 多入口AI聊天H5应用 - 前端

## 项目结构
```
frontend/
├── public/              # 静态资源
│   ├── favicon.ico
│   └── images/          # 图片资源（助手头像等）
├── src/
│   ├── assets/          # 项目资源
│   ├── components/      # 组件
│   │   ├── common/      # 通用组件
│   │   ├── home/        # 主页组件
│   │   └── chat/        # 聊天页面组件
│   ├── stores/          # Pinia状态管理
│   ├── views/           # 页面视图
│   │   ├── Home.vue     # 主页
│   │   └── Chat.vue     # 聊天页面
│   ├── utils/           # 工具函数
│   │   ├── api.js       # API调用
│   │   ├── markdown.js  # Markdown处理
│   │   └── sse.js       # SSE处理
│   ├── router/          # 路由配置
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── .env                 # 环境变量
├── package.json         # 项目依赖
└── vite.config.js       # Vite配置
```

## 组件设计

### 主页组件
- `AssistantCard.vue`: 助手入口卡片组件，展示助手信息和状态
- `AssistantList.vue`: 助手列表组件，包含所有助手卡片

### 聊天页面组件
- `ChatHeader.vue`: 聊天页面顶部栏，包含返回按钮和新建对话按钮
- `MessageList.vue`: 消息列表组件，展示所有对话消息
- `MessageItem.vue`: 单条消息组件，区分用户消息和AI消息
- `InputArea.vue`: 输入区域组件，包含文本输入框、发送按钮和上传图片按钮
- `MarkdownRenderer.vue`: Markdown渲染组件，处理AI回复中的Markdown格式

### 通用组件
- `LoadingIndicator.vue`: 加载指示器组件
- `ErrorMessage.vue`: 错误消息组件
- `ImageUploader.vue`: 图片上传组件

## 状态管理 (Pinia)
- `assistantStore.js`: 管理助手信息和状态
- `chatStore.js`: 管理聊天消息和状态
- `uiStore.js`: 管理UI状态（如加载状态、错误状态等）

## 路由设计
- `/`: 主页，展示所有助手入口
- `/chat/:assistantId`: 聊天页面，与特定助手对话

## API调用
- `sendMessage(assistantId, text, image)`: 发送消息给特定助手
- `receiveStreamResponse(assistantId)`: 接收流式响应
- `uploadImage(file)`: 上传图片
