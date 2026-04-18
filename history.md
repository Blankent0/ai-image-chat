# AI Image Chat 项目开发历程

## 项目概述

这是一个基于豆包 Seedream 技术的对话式 AI 图片生成平台，支持图片上传分析和智能图片生成。用户可以在前端上传图片并输入文本描述，然后调用 Seedream 模型生成新的图片并返回到前端。

## 技术栈

- **前端**: Next.js 15+, TypeScript, Tailwind CSS 4
- **UI**: Lucide React 图标库
- **AI服务**: 豆包 Seedream API
- **模型**: `doubao-seed-2-0-lite-260215` (文本生成), `doubao-seedream-5-0-260128` (图片生成)
- **开发工具**: Cloudflared (内网穿透)

## 核心功能

1. **对话式界面** - 自然的聊天体验，支持连续对话
2. **图片上传分析** - 上传图片让 AI 分析内容和风格
3. **智能图片生成** - 基于描述或参考图片生成新设计
4. **迭代优化** - 基于生成结果继续对话改进
5. **响应式设计** - 适配桌面和移动设备

## 开发历程

### 初始阶段 - 项目搭建

- 使用 Next.js 15+ 搭建基础框架
- 集成 Tailwind CSS 4 进行样式设计
- 配置 TypeScript 类型系统
- 搭建基本的对话界面组件

### API 集成阶段

#### 豆包 API 配置
- 配置豆包 API 密钥 (`SEEDREAM_API_KEY`)
- 使用 OpenAI 兼容的客户端连接豆包服务
- API 端点: `https://ark.cn-beijing.volces.com/api/v3`

#### 核心 API 路由
1. **文本对话** (`/api/generate-design`)
   - 模型: `doubao-seed-2-0-lite-260215`
   - 功能: 处理纯文本设计咨询
   
2. **图片分析** (`/api/generate-from-image`)
   - 模型: 豆包多模态模型
   - 功能: 分析上传的图片并提供建议
   
3. **图片生成** (`/api/generate-image`)
   - 模型: `doubao-seedream-5-0-260128`
   - 功能: 基于文本或参考图片生成新图片

### 关键技术突破

#### 1. Next.js 15+ 动态路由参数处理
**问题**: Next.js 15+ 中动态路由参数变为 Promise 类型，导致 500 错误
```typescript
// 错误的写法
export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
)

// 正确的写法 
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> }
) {
    const params = await context.params;
    const filename = params.filename;
}
```

**解决方案**: 修改 `/src/app/temp/[filename]/route.ts` 中的参数处理逻辑

#### 2. 参考图传输方案（2026-04-18 简化）
**早期方案**: Seedream API 需要通过 URL 访问参考图片 → 把 base64 存成临时文件 + cloudflared 内网穿透，暴露公网 URL 给 Seedream 拉取。依赖 `tempFileStorage.ts`、`/temp/[filename]` 路由和 `PUBLIC_BASE_URL` 环境变量。

**当前方案**: Seedream API 的 `image` 字段直接支持 `data:image/<格式>;base64,<编码>` 形式的 data URL。两个路由（`generate-image`、`generate-from-image`）均改为把前端上传的 base64 直接包装成 data URL 透传，彻底去除临时文件、公网 URL、cloudflared 隧道三件套。

```typescript
// 参考图处理（base64 直传）
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

已删除：`src/utils/tempFileStorage.ts`、`src/app/temp/[filename]/route.ts`、`temp/` 目录、`uuid` / `@types/uuid` 依赖、`PUBLIC_BASE_URL` 环境变量。

### 主要技术难点及解决方案

#### 问题 1: 图片尺寸验证错误
**错误信息**: "expected the width to be at least 14px, but received a 1x1px image instead"
**原因**: 使用了无效的 1x1px 测试图片
**解决**: 使用有效的测试图片，确保图片尺寸符合 API 要求

#### 问题 2: 临时文件 URL 访问 500 错误
**原因**: Next.js 15+ 动态路由参数处理变化
**解决**: 更新路由处理器以正确处理 Promise 类型的参数

#### 问题 3: Base64 图片数据处理
**解决方案**: 实现完整的 base64 -> 临时文件 -> 公网 URL 的转换流程

### 成功验证的完整流程

1. **用户上传图片**: 前端处理图片为 base64 格式
2. **data URL 拼装**: 后端把 base64 包装成 `data:image/jpeg;base64,...`
3. **API 调用**: Seedream API 直接接收 data URL 作为参考图
4. **图片生成**: API 返回生成的图片 URL
5. **结果展示**: 前端展示生成的图片

### 最终测试结果

成功实现了完整的端到端图片生成流程：
- 输入: 文本描述 + 参考图片
- 输出: 生成的图片 URL
- 示例生成结果: `https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedream-5-0/...`

## 环境变量配置

```bash
# 豆包 Seedream API Key
SEEDREAM_API_KEY=your-doubao-seedream-api-key-here
```

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── generate-image/route.ts      # 图生图 API（首轮 + 后续轮）
│   └── page.tsx
├── components/
│   ├── ImageStudio.tsx                  # 主容器
│   └── studio/
│       ├── SourceUploader.tsx           # 3D 图上传
│       ├── StyleSelector.tsx            # 风格网格
│       ├── GenerationStream.tsx         # 右侧图片流
│       └── Toast.tsx                    # 错误提示
├── constants/
│   └── stylePresets.ts                  # 风格数据（待填充）
└── types/
    └── studio.ts                        # 核心类型
```

### 2026-04-18 重构：转型为 3D 风格化工作台
- **场景聚焦**：从通用设计助手改为「3D 模型图 → 预置风格 → 多轮加工」
- **UI 重写**：聊天气泡 → 左右分栏（左控制面板 + 右图片流）
- **多轮机制**：Seedream 图生图链式迭代 —— 每轮把上一张输出 URL 作为下一轮参考图，不走语言模型 messages 滑窗
- **裁剪**：删除 `generate-design` 和 `generate-from-image` 两个 API，场景里不再需要文本分析
- **锁定规则**：首轮锁定 3D 图 + 风格，后续仅输入调整指令；「重新开始」解锁

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 部署注意事项

1. **API 密钥配置**: 确保 `SEEDREAM_API_KEY` 正确配置
2. **网络访问**: 生产环境需要确保 Seedream API 能访问临时文件
3. **文件清理**: 定期清理过期的临时文件
4. **错误处理**: 完善的错误处理和日志记录

## 性能优化

1. **临时文件缓存**: 设置 1 小时的缓存时间
2. **自动清理**: 定期清理超过 1 小时的临时文件
3. **错误重试**: API 调用失败时的重试机制

## 安全考虑

1. **文件类型验证**: 仅支持常见的图片格式
2. **文件大小限制**: 防止大文件上传
3. **临时文件清理**: 定期清理避免磁盘空间耗尽
4. **API 密钥保护**: 环境变量存储敏感信息

## 未来优化方向

1. **用户认证**: 添加用户登录和会话管理
2. **历史记录**: 保存用户的对话和生成历史
3. **批量处理**: 支持批量图片生成
4. **模板系统**: 预设计的设计模板
5. **性能监控**: 添加性能监控和分析

## 问题排查指南

### 常见问题

1. **500 错误**: 检查 Next.js 路由参数处理
2. **图片访问失败**: 确认 cloudflared 隧道正常运行
3. **API 调用失败**: 检查 API 密钥和网络连接
4. **图片尺寸错误**: 确保上传的图片尺寸符合要求

### 调试方法

1. **查看控制台日志**: 详细的请求和响应日志
2. **网络面板**: 检查 API 请求和响应
3. **文件系统**: 确认临时文件正确生成
4. **隧道状态**: 确认 cloudflared 隧道正常

---

*此文档记录了项目从初始搭建到完整功能实现的全过程，包含所有关键技术决策和解决方案，便于后续开发和维护。*