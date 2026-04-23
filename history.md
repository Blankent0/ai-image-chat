# AI Image Chat 项目开发历程

## 项目概述

面向室内设计师的 3D 模型图风格化工作台：上传 3D 模型渲染图 → 选预置风格 → 生成风格化效果图 → 多轮链式迭代加工。交付物仅图片，不返回分析文本。

## 技术栈

- **前端**：Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI**：Lucide React 图标 + Inter / Noto Serif SC 字体
- **AI 服务**：豆包 Seedream (`doubao-seedream-5-0-260128`)
- **API 端点**：`https://ark.cn-beijing.volces.com/api/v3/images/generations`

## 核心功能

1. **3D 模型图上传** — 首轮锁定，作为所有后续轮次的原始参考
2. **预置风格选择** — 网格卡片，首轮锁定
3. **可选补充提示词** — 首轮可为空，直接按风格生成
4. **多轮链式加工** — 每轮以上一张 CDN URL 为参考图继续迭代
5. **左右分栏 + 底部对话框** — 左控制面板、右图片流、底部常显 composer

## 开发历程

### 阶段 1：初版通用对话式设计助手（已废弃）

- 聊天气泡 UI，同时返回分析文本 + 图片
- 三个 API：`generate-design`（纯文本）/ `generate-from-image`（图片分析）/ `generate-image`（图生图）
- 依赖 `tempFileStorage.ts` + `/temp/[filename]` 路由 + cloudflared 隧道暴露参考图公网 URL

### 阶段 2：去除 cloudflared，base64 直传（2026-04-18）

**发现**：Seedream API 的 `image` 字段原生支持 `data:image/<格式>;base64,<编码>` 形式 data URL。

**改造**：
- 两个图生图路由改为把前端 base64 直接包装成 data URL 透传
- 彻底删除 `src/utils/tempFileStorage.ts`、`src/app/temp/[filename]/route.ts`、`temp/` 目录
- 移除 `uuid` / `@types/uuid` 依赖、`PUBLIC_BASE_URL` 环境变量、cloudflared 三件套

```typescript
if (referenceImage) {
    if (referenceImage.startsWith('http')) {
        requestBody.image = referenceImage;
    } else if (referenceImage.startsWith('data:image/')) {
        requestBody.image = referenceImage;
    } else {
        requestBody.image = `data:image/jpeg;base64,${referenceImage}`;
    }
}
```

**坑点**：本地 Clash/代理劫持 `*.volces.com` 走海外出口 → TLS ECONNRESET。解决：关代理或加入直连白名单。

### 阶段 3：重构为 3D 风格化工作台（2026-04-18）

**背景**：通用"对话式设计助手"过于宽泛。用户需求聚焦为：上传 3D 图 → 选风格 → 可选补充 prompt → 生图 → 多轮加工。

**多轮策略选型**（调研 `example/` 下 Flovart / OpenLovart / MeiGen 后得出结论）：

- ❌ **OpenAI messages 滑窗**：Seedream 图生图只有 `prompt + image` 两字段，不支持 messages 数组
- ❌ **宿主 LLM 维护上下文**：场景是"对图做加工"，不是"对话"，不需要语言记忆
- ✅ **图生图链式迭代**：每轮把上一张输出 CDN URL 作为下一轮参考图，文字只传本轮"调整指令"

**范围**：
- 废弃 `DesignChat.tsx`，新建 `ImageStudio.tsx` + `studio/*` 子组件
- 删除 `generate-design` 和 `generate-from-image` 两个 API
- 新建 `src/types/studio.ts`、`src/constants/stylePresets.ts`
- 改写 `generate-image` 路由：支持首轮（`sourceImage + stylePrompt + userPrompt`）和后续轮（`referenceImageUrl + adjustmentPrompt`）

**锁定规则**：首轮一旦生成，`sourceImage` 和 `selectedStyleId` 锁死（UI 禁用），保证链式语义一致。「重新开始」清空 `generations` 并解锁。

### 阶段 4：UI 迭代（2026-04-18）

前端布局经历三轮调整：

1. **初版**：左控制面板 + 右图片流，底部无常显输入 → 用户反馈调整指令入口不够显眼
2. **第二版**：把所有输入移到底部 composer（上传 + 风格 + 文字）→ 用户反馈要求左右分栏
3. **第三版**（最终）：
   - **左侧 1/4 宽**：SourceUploader（上）+ StyleSelector（下）
   - **右侧 flex-1**：GenerationStream 编辑式画廊（01 Origin / 02 Iteration 1 …，oldest-first，生成时自动滚到底部）
   - **底部全宽 composer**：textarea + 提交按钮，Enter 提交 / Shift+Enter 换行
4. **视觉升级**：用户指出纯白页面不符合室内设计师审美诉求
   - 改为暖色深色调：`--color-canvas: #0E0C0A` / `--color-surface: #171411`
   - 香槟金强调色：`--color-accent: #C9A56F`
   - 衬线标题：Noto Serif SC，标题为 "Atelier"
   - 编号采用衬线大数字 + 全大写小字标签（"01 · Origin"）

### 阶段 5：推送 GitHub（2026-04-18）

- 新建 `.gitignore`，排除 `.env.local`、`node_modules`、`.next`、`.claude/`
- 仓库：https://github.com/Blankent0/ai-image-chat
- 推送时远程已有自动生成的 README，用 `git merge --allow-unrelated-histories -X ours origin/main` 合并
- 最终提交：`d1e311a`（合并）+ `fff948a`（工作台初版）

## 数据结构

```typescript
// src/types/studio.ts
interface StylePreset {
    id: string;
    name: string;
    promptFragment: string;
    thumbnail?: string;
}
interface SourceImage {
    dataUrl: string;
    name: string;
}
interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    adjustmentText?: string;
    createdAt: number;
}
interface StudioState {
    sourceImage: SourceImage | null;
    selectedStyleId: string | null;
    generations: GeneratedImage[];  // 新 → 旧存储，UI 层反转为旧 → 新展示
    adjustmentInput: string;
    isGenerating: boolean;
}
```

## API 设计

### `POST /api/generate-image`

**首轮**：前端传 `sourceImage`（data URL）+ `stylePrompt`（从选中 preset 取）+ `userPrompt`（可空）。后端拼：
```
userPrompt ? `${userPrompt}. ${stylePrompt}` : stylePrompt
```

**后续轮**：前端传 `referenceImageUrl`（上一张 CDN URL）+ `adjustmentPrompt`。后端直接把 `adjustmentPrompt` 作 prompt（风格已固化在参考图里）。

**返回**：`{ imageUrl, metadata: { prompt, isFollowUp } }`

## 环境变量

```bash
SEEDREAM_API_KEY=your-doubao-seedream-api-key-here
```

## 项目结构

```
src/
├── app/
│   ├── api/generate-image/route.ts    # 唯一 API
│   ├── globals.css                    # 暖色深色调 CSS 变量
│   ├── layout.tsx                     # 字体加载
│   └── page.tsx
├── components/
│   ├── ImageStudio.tsx                # 主容器（状态 + 布局）
│   └── studio/
│       ├── SourceUploader.tsx         # 3D 图上传（拖拽 + 点击）
│       ├── StyleSelector.tsx          # 风格 2 列网格
│       ├── GenerationStream.tsx       # 编辑式画廊 + 骨架屏
│       └── Toast.tsx                  # 右上角错误提示
├── constants/stylePresets.ts          # 风格数据（占位，待填充）
└── types/studio.ts                    # 核心类型
```

## 验证流程

1. `npm run dev`（先关本地代理）
2. 上传 3D 图 + 选风格 → 点生成 → 右侧出现首张风格化图
3. 输入"把颜色换成暖色调" → 右侧追加新图（基于上一张）
4. 多轮进行中：上传区 + 风格区灰显禁用
5. 点「重新开始」→ 清空右侧并解锁左侧
6. 断网点生成 → 右上角 toast 提示，骨架屏消失
7. `npx tsc --noEmit` 零错误

## 未做 / 未来方向

- **未做**：后端持久化、下载导出、风格内容填充、移动端自适应、用户认证
- **风格库**：需要设计师补充 `stylePresets.ts`（现代简约 / 北欧 / 日式侘寂 / 工业风等）
- **批量生成**：一次选多个风格，并行产出对比
- **历史记录**：跨会话保存生成链

## 问题排查

| 现象 | 原因 | 解决 |
|---|---|---|
| TLS ECONNRESET | 本地代理劫持 `*.volces.com` | 关代理或加直连白名单 |
| `SEEDREAM_API_KEY not configured` | `.env.local` 未配置 | 填入火山引擎 Ark Key |
| 图片尺寸错误 | 上传图小于 14×14 | 换有效尺寸图 |
| `.next` 类型陈旧 | 删文件后缓存未更新 | `rm -rf .next` |

---

*最后更新：2026-04-18*
