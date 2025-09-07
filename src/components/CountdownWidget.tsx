'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import * as countdownService from '@/services/countdownService';
import { Countdown } from '@/lib/types';
import { differenceInDays, format } from 'date-fns';
import { PlusCircle, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];


function getNextNewYear(): Countdown {
  const today = new Date();
  const currentYear = today.getFullYear();
  return {
    id: 'new-year',
    title: 'New Year',
    date: new Date(currentYear + 1, 0, 1),
    color: COLORS[7],
  };
}

const AddCountdownForm = ({ onAdd, onClose }: { onAdd: (title: string, date: Date, color: string) => void; onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (title && date) {
      onAdd(title, date, color);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Custom Countdown</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Title
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="date" className="text-right">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn('w-full justify-start text-left font-normal col-span-3', !date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Color</Label>
          <div className="col-span-3 flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn('h-6 w-6 rounded-full border-2 transition-all', color === c ? 'border-primary' : 'border-transparent')}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={handleSubmit}>Add Countdown</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const CountdownCard = ({ countdown, isCustom, onDelete }: { countdown: Countdown; isCustom: boolean; onDelete?: (id: string) => void }) => {
  const daysRemaining = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(countdown.date);
    target.setHours(0, 0, 0, 0);
    return differenceInDays(target, today);
  }, [countdown.date]);

  return (
    <Card 
      className="w-40 flex-shrink-0 rounded-lg relative"
      style={{ backgroundColor: countdown.color ? `${countdown.color}20` : undefined, borderColor: countdown.color ? `${countdown.color}80` : undefined }}
    >
      <CardContent className="p-3">
        <p className="text-2xl font-bold">{daysRemaining}</p>
        <p className="text-xs text-muted-foreground truncate" title={countdown.title}>
          days until {countdown.title}
        </p>
      </CardContent>
      {isCustom && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0.5 right-0.5 h-6 w-6"
          onClick={() => onDelete(countdown.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </Card>
  );
};

export function CountdownWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customCountdowns, setCustomCountdowns] = useState<Countdown[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const allCountdowns = useMemo(() => {
    const combined = [getNextNewYear(), ...customCountdowns];
    return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [customCountdowns]);

  useEffect(() => {
    async function fetchCountdowns() {
      if (!user) return;
      setIsLoading(true);
      try {
        const userCountdowns = await countdownService.getCountdowns(user.uid);
        setCustomCountdowns(userCountdowns);
      } catch (error) {
        console.error('Failed to fetch countdowns:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your countdowns.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCountdowns();
  }, [user, toast]);

  const handleAddCountdown = async (title: string, date: Date, color: string) => {
    if (!user) return;
    try {
      const newCountdown = await countdownService.addCountdown(user.uid, { title, date, color });
      setCustomCountdowns((prev) => [...prev, newCountdown]);
      toast({
        title: 'Countdown Added!',
        description: `Your countdown for "${title}" has been created.`,
      });
    } catch (error) {
      console.error('Failed to add countdown:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your countdown.',
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteCountdown = async (id: string) => {
    if (!user) return;
    const originalCountdowns = [...customCountdowns];
    setCustomCountdowns(customCountdowns.filter((c) => c.id !== id));
    try {
      await countdownService.deleteCountdown(user.uid, id);
    } catch (error) {
      console.error('Failed to delete countdown:', error);
      setCustomCountdowns(originalCountdowns);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the countdown.',
      });
    }
  };

  return (
    <div className="mb-6">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {isLoading
              ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[76px] w-40 rounded-lg" />)
              : allCountdowns.map((cd) => (
                  <CountdownCard
                    key={cd.id}
                    countdown={cd}
                    isCustom={cd.id !== 'new-year'}
                    onDelete={handleDeleteCountdown}
                  />
                ))}
            <Button
              variant="outline"
              className="w-40 h-[76px] flex-shrink-0 rounded-lg flex-col gap-1"
              onClick={() => setIsFormOpen(true)}
            >
              <PlusCircle className="h-6 w-6" />
              <span className='text-xs'>Add Countdown</span>
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {isFormOpen && <AddCountdownForm onAdd={handleAddCountdown} onClose={() => setIsFormOpen(false)} />}
      </Dialog>
    </div>
  );
}
