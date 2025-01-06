import { NotionCalendar } from '@/types/notion';

interface CacheData {
    calendars: NotionCalendar[];
    lastUpdated: Date;
}

class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheData>;
    private updateInterval: number; // 缓存更新间隔（毫秒）

    private constructor() {
        this.cache = new Map();
        // 从环境变量获取更新间隔（分钟），默认为60分钟（1小时）
        const intervalMinutes = Number(process.env.CACHE_UPDATE_INTERVAL_MINUTES) || 60;
        this.updateInterval = intervalMinutes * 60 * 1000;
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    public getUpdateIntervalMinutes(): number {
        return this.updateInterval / (60 * 1000);
    }

    public setCache(key: string, data: NotionCalendar[]): void {
        this.cache.set(key, {
            calendars: data,
            lastUpdated: new Date()
        });
        console.log(`Cache updated at ${new Date().toISOString()}. Next update in ${this.getUpdateIntervalMinutes()} minutes`);
    }

    public getCache(key: string): NotionCalendar[] | null {
        const cacheData = this.cache.get(key);
        if (!cacheData) return null;

        // 检查缓存是否过期
        const now = new Date();
        if (now.getTime() - cacheData.lastUpdated.getTime() > this.updateInterval) {
            return null;
        }

        return cacheData.calendars;
    }

    public clearCache(): void {
        this.cache.clear();
    }
}

export default CacheService;