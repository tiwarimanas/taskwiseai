'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { differenceInDays, format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function getNextNewYear() {
  const today = new Date();
  const currentYear = today.getFullYear();
  return new Date(currentYear + 1, 0, 1);
}

export function CountdownWidget() {
  const [newYearDate] = useState(getNextNewYear());
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [daysToNewYear, setDaysToNewYear] = useState(0);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newYear = getNextNewYear();
    newYear.setHours(0, 0, 0, 0);
    setDaysToNewYear(differenceInDays(newYear, today));
  }, []);

  const daysToCustomDate = useMemo(() => {
    if (!customDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(customDate);
    target.setHours(0, 0, 0, 0);
    return differenceInDays(target, today);
  }, [customDate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Days Until New Year</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{daysToNewYear}</p>
          <p className="text-sm text-muted-foreground">Until {format(newYearDate, 'MMMM d, yyyy')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Custom Countdown</CardTitle>
        </CardHeader>
        <CardContent>
          {customDate && daysToCustomDate !== null ? (
            <div>
              <p className="text-4xl font-bold">{daysToCustomDate}</p>
              <p className="text-sm text-muted-foreground">days until {format(customDate, 'MMMM d, yyyy')}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Select a date to start a countdown.</p>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn('w-full justify-start text-left font-normal mt-4', !customDate && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDate ? format(customDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDate} onSelect={setCustomDate} initialFocus />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    </div>
  );
}
