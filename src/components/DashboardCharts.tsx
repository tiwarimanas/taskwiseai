'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from './ui/skeleton';

interface DashboardChartsProps {
  data: {
    taskStatusData: { name: string; value: number; fill: string }[];
    tasksByCategoryData: { name: string; tasks: number; fill: string }[];
  };
  loading: boolean;
}

const statusChartConfig = {
  tasks: {
    label: 'Tasks',
  },
  Pending: {
    label: 'Pending',
    color: 'hsl(var(--chart-1))',
  },
  Completed: {
    label: 'Completed',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  tasks: {
    label: 'Tasks',
  },
  Work: { label: 'Work', color: 'hsl(var(--chart-1))' },
  Personal: { label: 'Personal', color: 'hsl(var(--chart-2))' },
  Shopping: { label: 'Shopping', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;


export function DashboardCharts({ data, loading }: DashboardChartsProps) {
  if (loading) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusChartConfig} className="min-h-[300px] w-full">
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={data.taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                  {data.taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryChartConfig} className="min-h-[300px] w-full">
            <BarChart data={data.tasksByCategoryData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="tasks" radius={4}>
                {data.tasksByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
