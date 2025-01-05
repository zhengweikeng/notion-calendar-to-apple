import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotionCalendar } from '@/types/notion';

interface DashboardProps {
    calendars: NotionCalendar[];
}

const Dashboard: React.FC<DashboardProps> = ({ calendars }) => {
    // 根据calendars分组展示总事件数量和本月事件数量，每个calendar是一个Card，每个card水平排列，当card过多时，自动换行
    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-wrap gap-4">
                {calendars.map(calendar => {
                    const totalEvents = calendar.events.length;
                    const currentMonth = new Date().getMonth();
                    const currentMonthEvents = calendar.events.filter(event => {
                        return new Date(event.start).getMonth() === currentMonth
                    }
                    ).length;

                    return (
                        <Card key={calendar.databaseId}>
                            <CardHeader>
                                <CardTitle>{calendar.title}</CardTitle>
                                <CardDescription>{calendar.databaseId}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl font-bold">总事件数量: {totalEvents}</p>
                                <p className="text-xl font-bold">本月事件数量: {currentMonthEvents}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;