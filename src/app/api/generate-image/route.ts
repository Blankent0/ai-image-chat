import { NextRequest, NextResponse } from 'next/server';

interface GenerateImageBody {
    sourceImage?: string;        // 首轮: data URL
    functionPrompt?: string;     // 首轮: 功能模块默认 prompt（英文）
    userPrompt?: string;         // 首轮: 用户补充
    referenceImageUrl?: string;  // 后续轮: 上一张 Seedream URL
    adjustmentPrompt?: string;   // 后续轮: 调整指令
    resolution?: string;
}

function normalizeReferenceImage(raw: string): string {
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('data:image/')) return raw;
    return `data:image/jpeg;base64,${raw}`;
}

function buildFirstRoundPrompt(functionPrompt: string | undefined, userPrompt: string | undefined): string {
    const fn = functionPrompt?.trim();
    const user = userPrompt?.trim();
    if (fn && user) return `${fn} ${user}`;
    return fn || user || '';
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as GenerateImageBody;
        const {
            sourceImage,
            functionPrompt,
            userPrompt,
            referenceImageUrl,
            adjustmentPrompt,
            resolution,
        } = body;

        const apiKey = process.env.SEEDREAM_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'SEEDREAM_API_KEY not configured' }, { status: 500 });
        }

        const isFollowUp = Boolean(referenceImageUrl);
        let finalPrompt: string;
        let imageField: string;

        if (isFollowUp) {
            const adjust = adjustmentPrompt?.trim();
            if (!adjust) {
                return NextResponse.json({ error: 'adjustmentPrompt is required for follow-up rounds' }, { status: 400 });
            }
            if (!referenceImageUrl) {
                return NextResponse.json({ error: 'referenceImageUrl is required for follow-up rounds' }, { status: 400 });
            }
            finalPrompt = adjust;
            imageField = normalizeReferenceImage(referenceImageUrl);
        } else {
            if (!sourceImage) {
                return NextResponse.json({ error: 'sourceImage is required for first round' }, { status: 400 });
            }
            finalPrompt = buildFirstRoundPrompt(functionPrompt, userPrompt);
            if (!finalPrompt) {
                return NextResponse.json({ error: 'functionPrompt or userPrompt must be provided' }, { status: 400 });
            }
            imageField = normalizeReferenceImage(sourceImage);
        }

        const requestBody = {
            model: 'doubao-seedream-5-0-260128',
            prompt: finalPrompt,
            image: imageField,
            size: resolution || '2K',
            output_format: 'png',
            watermark: false,
        };

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Seedream API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Seedream API error', status: response.status, details: errorText },
                { status: 502 }
            );
        }

        const result = await response.json();
        const imageUrl = result?.data?.[0]?.url;
        if (!imageUrl) {
            console.error('Invalid Seedream response:', result);
            return NextResponse.json({ error: 'Invalid response from Seedream API' }, { status: 502 });
        }

        return NextResponse.json({
            imageUrl,
            metadata: {
                prompt: finalPrompt,
                isFollowUp,
            },
        });
    } catch (error: any) {
        console.error('generate-image failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate image', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
