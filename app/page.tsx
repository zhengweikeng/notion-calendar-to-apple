import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import NotionService from '@/services/notion';
import { NotionCalendar } from "@/types/notion";

export const revalidate = 3600

export default async function Home() {
  const notionService = NotionService.getInstance();
  let calendars: NotionCalendar[] = [];
  try {
    calendars = await notionService.getCalendars();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Suspense fallback={<div>Loading...</div>}>
          <Dashboard calendars={calendars} />
        </Suspense>
      </main>
    </div>
  );
}
