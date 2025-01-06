import Dashboard from '@/components/Dashboard';
import NotionService from '@/services/notion';
import { NotionCalendar } from "@/types/notion";

export default async function Home() {
  const notionService = new NotionService();
  let calendars: NotionCalendar[] = [];
  try {
    calendars = await notionService.getCalendars();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Dashboard calendars={calendars} />
      </main>
    </div>
  );
}
