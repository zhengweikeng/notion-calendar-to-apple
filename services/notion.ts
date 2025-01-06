import { Client } from '@notionhq/client';
import { PageObjectResponse, PartialPageObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionEvent, NotionCalendar } from '@/types/notion';
import CacheService from './cache';

class NotionService {
    private client: Client;
    private static instance: NotionService;
    private cacheService: CacheService;
    private readonly CACHE_KEY = 'notion_calendars';
    private isUpdating: boolean = false;

    public constructor() {
        if (!process.env.NOTION_API_KEY) {
            throw new Error('Missing Notion API key');
        }
        this.client = new Client({
            auth: process.env.NOTION_API_KEY
        });
        this.cacheService = CacheService.getInstance();
    }

    public static getInstance(): NotionService {
        if (!NotionService.instance) {
            NotionService.instance = new NotionService();
        }
        return NotionService.instance;
    }

    private getDatabaseIds(): string[] {
        const databaseIdsString = process.env.NOTION_DATABASE_IDS;
        return databaseIdsString ? databaseIdsString.split(',') : [];
    }

    private parseNotionPage(page: PageObjectResponse | PartialPageObjectResponse): NotionEvent | null {
        if (!('properties' in page)) {
            return null;
        }

        const titleProperty = page.properties.Name as {
            title: Array<{ plain_text: string }>;
        } | undefined;
        const dateProperty = page.properties.Date as {
            date: { start: string; end: string | null };
        } | undefined;
        const descriptionProperty = page.properties.Description as {
            rich_text: Array<{ plain_text: string }>;
        } | undefined;
        const locationProperty = page.properties.Location as {
            rollup: { array: Array<{ rich_text: Array<{ plain_text: string }> }> };
        } | {
            rich_text: Array<{ plain_text: string }>;
        } | undefined;
        const addressProperty = page.properties.Address as {
            rollup: { array: Array<{ rich_text: Array<{ plain_text: string }> }> };
        } | {
            rich_text: Array<{ plain_text: string }>;
        } | undefined;

        if (!titleProperty?.title?.[0]?.plain_text || !dateProperty?.date?.start) {
            return null;
        }

        let location: string | undefined;
        if (locationProperty) {
            if ('rich_text' in locationProperty) {
                location = locationProperty.rich_text[0]?.plain_text;
            } else if ('rollup' in locationProperty) {
                location = locationProperty.rollup.array[0]?.rich_text[0]?.plain_text;
            }
        }

        let address: string | undefined;
        if (addressProperty) {
            if ('rich_text' in addressProperty) {
                address = addressProperty.rich_text[0]?.plain_text;
            } else if ('rollup' in addressProperty) {
                address = addressProperty.rollup.array[0]?.rich_text[0]?.plain_text;
            }
        }

        return {
            title: titleProperty.title[0].plain_text,
            start: dateProperty.date.start,
            end: dateProperty.date.end || undefined,
            description: descriptionProperty?.rich_text[0]?.plain_text,
            location: location,
            address: address
        };
    }

    public async getCalendars(): Promise<NotionCalendar[]> {
        let notionCalendars = this.cacheService.getCache(this.CACHE_KEY);
        if (notionCalendars) {
            console.log('Calendars cache hit');
            return notionCalendars;
        }

        if (!this.isUpdating) {
            await this.updateCalendarCache();
        }

        return this.getCalendars();
    }

    public async updateCalendarCache(): Promise<void> {
        if (this.isUpdating) return;

        try {
            this.isUpdating = true;
            const notionCalendars = await this.fetchCalendarsFromNotion()
            this.cacheService.setCache(this.CACHE_KEY, notionCalendars);
        } catch (error) {
            console.error('Failed to update calendar cache:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    private async fetchCalendarsFromNotion(): Promise<NotionCalendar[]> {
        console.log('Fetching calendars from Notion');
        let notionCalendars = [];
        const databaseIds = this.getDatabaseIds();
        const startDate = process.env.CALENDAR_START_DATE
        const filter = startDate
            ? {
                property: "Date",
                date: {
                    on_or_after: startDate,
                },
            }
            : undefined;


        for (const databaseId of databaseIds) {
            let hasMore = true;
            let startCursor: string | undefined = undefined;
            let calendarEvents: NotionEvent[] = [];

            const database = await this.client.databases.retrieve({
                database_id: databaseId
            }) as DatabaseObjectResponse
            if (database.title.length === 0) {
                console.error(`Failed to retrieve database: ${databaseId}`);
                continue;
            }
            const title = database.title[0].plain_text;


            while (hasMore) {
                const response = await this.client.databases.query({
                    database_id: databaseId,
                    start_cursor: startCursor,
                    filter: filter,
                    sorts: [
                        {
                            property: "Date",
                            direction: "descending"
                        }
                    ],
                });

                const events = response.results
                    .filter((page): page is PageObjectResponse => 'properties' in page)
                    .map((page) => this.parseNotionPage(page))
                    .filter((event): event is NotionEvent => event !== null);

                calendarEvents = [...calendarEvents, ...events];

                hasMore = response.has_more;
                startCursor = response.next_cursor ?? undefined;

                // sleep 400ms to avoid rate limiting
                if (hasMore) {
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    continue
                }
                break
            }

            let notionCalendar: NotionCalendar = {
                databaseId: databaseId,
                events: calendarEvents,
                title: title
            };

            notionCalendars.push(notionCalendar);
        }

        return notionCalendars;
    }
}

export default NotionService;
