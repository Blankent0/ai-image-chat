export interface FunctionModule {
    id: string;
    name: string;
    description: string;
    defaultPrompt: string;
    thumbnail?: string;
}

/**
 * 功能模块配置
 * ─────────────────────────────────────────────────────────────
 * 新增功能：复制一个对象，修改 id / name / description / defaultPrompt。
 * 优化现有：直接编辑对应条目的 defaultPrompt（英文效果更稳定）。
 *
 * Prompt 拼接规则：
 *   首轮：finalPrompt = defaultPrompt [+ ". " + 用户补充]
 *   后续轮：finalPrompt = 用户输入（defaultPrompt 不再重复注入）
 */
export const FUNCTION_MODULES: FunctionModule[] = [
    {
        id: 'interior-render',
        name: '室内渲染',
        description: '3D 模型或草图 → 摄影级室内效果',
        defaultPrompt:
            'Transform the input into a photorealistic interior rendering. Use natural lighting, realistic materials, high-end residential design quality, and professional architectural photography style. Preserve original composition, perspective and spatial layout.',
    },
    {
        id: 'line-to-image',
        name: '线稿生图',
        description: '手绘 / CAD 线稿 → 真实渲染',
        defaultPrompt:
            'Convert this line drawing into a photorealistic interior rendering. Preserve the original composition, perspective and spatial layout exactly. Add realistic materials, lighting, textures, shadows and depth.',
    },
    {
        id: 'floorplan-colorize',
        name: '户型图彩绘',
        description: '黑白户型图 → 彩色平面',
        defaultPrompt:
            'Colorize this architectural floor plan with clean soft pastel tones. Use distinct gentle colors for different functional zones (living room, bedrooms, kitchen, bathrooms). Maintain top-down 2D orthographic view, keep all walls, doors, windows and labels clear and accurate.',
    },
    {
        id: 'floorplan-furnish',
        name: '家装平面方案生成',
        description: '空户型 → 带家具布置的平面方案',
        defaultPrompt:
            'Generate a fully furnished interior floor plan from this empty layout. Add realistic furniture, appliances, rugs, plants and decor in every room following reasonable residential design. Preserve all original walls, doors and windows. Top-down 2D plan view with soft coloring.',
    },
    {
        id: 'dewatermark',
        name: '去水印',
        description: '去除水印 / logo / 文字标注',
        defaultPrompt:
            'Remove all watermarks, logos, signatures, captions and text overlays from this image. Preserve the original content, composition, lighting, colors and quality completely and seamlessly.',
    },
    {
        id: 'hd-upscale',
        name: '高清放大',
        description: '提升分辨率与细节',
        defaultPrompt:
            'Enhance this image to high resolution. Sharpen fine details, improve texture clarity and fidelity, reduce noise and artifacts. Preserve original composition, colors and style exactly without altering content.',
    },
    {
        id: 'exterior-enhance',
        name: '室外质感增强',
        description: '强化建筑外观材质与光影',
        defaultPrompt:
            'Enhance this exterior architectural image. Improve material textures (stone, glass, metal, wood, concrete), sharpen facade details, enrich natural lighting, shadows and atmospheric depth. Preserve original composition and design.',
    },
    {
        id: 'interior-enhance',
        name: '室内质感增强',
        description: '强化室内材质与光影',
        defaultPrompt:
            'Enhance this interior image. Improve material textures (fabric, wood, stone, metal, leather), sharpen fine details, refine lighting and color grading. Preserve original composition, layout and design intent.',
    },
    {
        id: 'white-model-render',
        name: '白膜出图',
        description: '无材质白模 → 带材质效果图',
        defaultPrompt:
            'Render this untextured white massing model into a photorealistic architectural visualization. Add realistic materials, finishes, lighting and environmental context. Preserve all geometry, proportions and composition exactly.',
    },
];

export function getFunctionById(id: string | null | undefined): FunctionModule | undefined {
    if (!id) return undefined;
    return FUNCTION_MODULES.find(m => m.id === id);
}
