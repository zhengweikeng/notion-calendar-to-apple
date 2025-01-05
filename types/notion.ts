export interface NotionEvent {
    title: string;
    start: string;
    end?: string;
    description?: string;
    location?: string;
    address?: string;
}

export interface NotionCalendar {
    databaseId: string;
    title: string;
    events: NotionEvent[];
}