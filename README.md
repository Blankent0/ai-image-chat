# AI Image Chat — 3D 模型图风格化工作台

基于豆包 Seedream 的图生图工作台：上传 3D 模型图 → 选预置风格 → 生成风格化图 → 多轮链式加工。

面向室内设计师：暖色深色调 UI，香槟金强调色，衬线标题，编辑式画廊布局。

仓库：https://github.com/Blankent0/ai-image-chat

## 功能特性

- **3D 模型图上传** — 拖拽或点击，左侧预览，首轮锁定
- **预置风格选择** — 2 列卡片网格，首轮锁定（仅结构，占位数据）
- **可选补充提示词** — 首轮可为空，直接按风格生成
- **多轮链式加工** — 每轮以上一张输出 URL 为参考图继续迭代
- **左右分栏 + 底部常显对话框** — 左控制面板（1/4 宽）、右图片流（flex-1）、底部全宽 composer
- **无文本输出** — 场景聚焦图片产出，不返回分析文字

## 开发环境设置

```bash
git clone https://github.com/Blankent0/ai-image-chat.git
cd ai-image-chat
npm install

# 配置环境变量
cp .env.example .env.local   # 如无示例文件则手动新建
# 填入 SEEDREAM_API_KEY

npm run dev
```

> 本地代理可能劫持 `*.volces.com` 导致 TLS ECONNRESET。关闭代理或将该域名加入直连白名单。

## 环境变量

```bash
SEEDREAM_API_KEY=your-doubao-seedream-api-key-here
```

> 参考图以 `data:image/...;base64,...` 直传 Seedream，无需内网穿透/公网 URL。

## API

### `POST /api/generate-image`

**首轮入参**：
```json
{
  "sourceImage": "data:image/jpeg;base64,...",
  "stylePrompt": "cartoon render, cel-shaded",
  "userPrompt": "optional extra text"
}
```

**后续轮入参**：
```json
{
  "referenceImageUrl": "https://.../previous-output.png",
  "adjustmentPrompt": "把颜色换成暖色调"
}
```

**返回**：
```json
{
  "imageUrl": "https://.../generated.png",
  "metadata": { "prompt": "...", "isFollowUp": false }
}
```

## 技术栈

- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Lucide React 图标
- Inter + Noto Serif SC（next/font/google）
- 豆包 Seedream 5.0 (`doubao-seedream-5-0-260128`)

## 扩展预置风格

在 `src/constants/stylePresets.ts` 中追加：
```ts
{
  id: 'cyberpunk',
  name: '赛博朋克',
  promptFragment: 'cyberpunk style, neon lights, futuristic',
  thumbnail: '/styles/cyberpunk.jpg',  // 可选
}
```
UI 自动渲染新卡片到风格选择器。

## 项目结构

```
src/
├── app/
│   ├── api/generate-image/route.ts   # 图生图 API（首轮 + 后续轮）
│   ├── globals.css                   # 暖色深色调 CSS 变量
│   ├── layout.tsx                    # 字体加载
│   └── page.tsx
├── components/
│   ├── ImageStudio.tsx               # 主容器（状态 + 布局）
│   └── studio/
│       ├── SourceUploader.tsx        # 3D 图上传
│       ├── StyleSelector.tsx         # 风格网格
│       ├── GenerationStream.tsx      # 右侧编辑式图片流
│       └── Toast.tsx                 # 错误提示
├── constants/stylePresets.ts         # 风格数据（占位，待填充）
└── types/studio.ts                   # 核心类型
```

## 开发命令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

MIT
