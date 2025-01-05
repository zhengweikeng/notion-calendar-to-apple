// app/api/update-cache/route.ts
import { NextResponse } from 'next/server';
import NotionService from '@/services/notion';

// 用于验证请求的密钥
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
    try {
        // 验证请求是否来自可信源
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const notionService = NotionService.getInstance();
        await notionService.updateCalendarCache();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cache update failed:', error);
        return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 });
    }
}