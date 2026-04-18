# AI Image Chat - 3D 模型图风格化工作台

基于豆包 Seedream 的图生图工作台：上传 3D 模型图 → 选预置风格 → 生成风格化图 → 多轮链式加工。

## 功能特性

- **3D 模型图上传** - 拖拽或点击上传，左侧预览
- **预置风格选择** - 网格卡片选风格（当前为占位，可扩展）
- **可选补充提示词** - 首轮可为空，直接按风格生成
- **多轮链式加工** - 每轮以上一张生成图为参考图，持续调整
- **左右分栏 UI** - 左控制面板，右图片流

## 开发环境设置

```bash
npm install

# 配置环境变量
cp .env.example .env.local
# 填入 SEEDREAM_API_KEY

npm run dev
```

## 环境变量

```bash
SEEDREAM_API_KEY=your-doubao-seedream-api-key-here
```

> 参考图以 `data:image/...;base64,...` 形式直传 Seedream，本地开发无需内网穿透。

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

- Next.js 16, TypeScript, Tailwind CSS 4
- Lucide React 图标
- 豆包 Seedream 5.0 (`doubao-seedream-5-0-260128`)

## 扩展预置风格

在 `src/constants/stylePresets.ts` 中添加：
```ts
{
  id: 'cyberpunk',
  name: '赛博朋克',
  promptFragment: 'cyberpunk style, neon lights, futuristic',
}
```
UI 会自动把新风格渲染到选择器。

## 开发命令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

MIT
