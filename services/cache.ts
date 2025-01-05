import { NotionCalendar } from '@/types/notion';

interface CacheData {
    calendars: NotionCalendar[];
    lastUpdated: Date;
}

class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheData>;

    private constructor() {
        this.cache = new Map();
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    public setCache(key: string, data: NotionCalendar[]): void {
        this.cache.set(key, {
            calendars: data,
            lastUpdated: new Date()
        });
        console.log(`Cache updated at ${new Date().toISOString()}`);
    }

    public getCache(key: string): NotionCalendar[] | null {
        const cacheData = this.cache.get(key);
        if (!cacheData) return null;

        return cacheData.calendars;
    }

    public clearCache(): void {
        this.cache.clear();
    }
}

export default CacheService;