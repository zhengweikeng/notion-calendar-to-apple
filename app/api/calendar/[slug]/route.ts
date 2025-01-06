import { NextResponse } from 'next/server';
import ical, { ICalCalendar } from 'ical-generator';
import { NotionCalendar } from '@/types/notion';
import NotionService from '@/services/notion';

function generateICalFeed(notionCalendarId: string, notionCalendars: NotionCalendar[]): ICalCalendar {
    // const timezone = process.env.TIMEZONE || 'Asia/Shanghai';
    const calendar = ical();

    notionCalendars.forEach((notionCalendar) => {
        if (notionCalendar.databaseId !== notionCalendarId) {
            return;
        }

        if (notionCalendar.title) {
            calendar.name(notionCalendar.title);
        }

        notionCalendar.events.forEach((event) => {
            calendar.createEvent({
                start: new Date(event.start),
                end: event.end ? new Date(event.end) : new Date(event.start),
                summary: event.title,
                location: event.location,
                description: `Detailed Address: ${event.location}${event.address || ''}`,
                // timezone: timezone,
            });
        });
    });

    return calendar;
}

export async function GET(
    _: Request,
    { params }: { params: { slug: string } }
): Promise<NextResponse> {
    try {
        const notionCalendarId = params.slug;
        if (!notionCalendarId) {
            return new NextResponse('Missing calendarId parameter', { status: 400 });
        }

        const notionService = NotionService.getInstance();
        const calendars = await notionService.getCalendars();
        const appleCalendar = generateICalFeed(notionCalendarId, calendars);

        return new NextResponse(appleCalendar.toString(), {
            headers: {
                'Content-Type': 'text/calendar',
                'Content-Disposition': 'attachment; filename="notion-calendar.ics"',
            },
        });
    } catch (error) {
        console.error('Calendar generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
    }
}