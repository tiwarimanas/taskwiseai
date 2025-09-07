'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import * as focusService from '@/services/focusService';
import type { FocusSession } from '@/lib/types';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const SESSION_LENGTH = 25 * 60; // 25 minutes

export function FocusPageClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(SESSION_LENGTH);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = focusService.streamFocusSession(user.uid, (focusSession) => {
      setSession(focusSession);
      if (focusSession && focusSession.isActive) {
        const serverEndTime = focusSession.endTime.getTime();
        const clientCurrentTime = Date.now();
        const remaining = Math.round((serverEndTime - clientCurrentTime) / 1000);
        setTimeLeft(Math.max(0, remaining));
      } else {
        setTimeLeft(SESSION_LENGTH);
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (session?.isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            toast({
              title: "Focus Session Complete!",
              description: "Great work! Time for a short break.",
            });
            if(user) {
              focusService.resetFocusSession(user.uid);
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [session?.isActive, timeLeft, user, toast]);

  const handleStart = () => {
    if (!user) return;
    focusService.startFocusSession(user.uid, SESSION_LENGTH);
  };

  const handlePause = () => {
    if (!user) return;
    focusService.pauseFocusSession(user.uid, timeLeft);
  };

  const handleReset = () => {
    if (!user) return;
    focusService.resetFocusSession(user.uid);
    setTimeLeft(SESSION_LENGTH);
  };

  const progress = ((SESSION_LENGTH - timeLeft) / SESSION_LENGTH) * 100;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">Focus Timer</CardTitle>
          <CardDescription>Your synced Pomodoro session.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8">
          <div className="relative h-64 w-64">
            <Progress
              value={progress}
              className="absolute h-full w-full rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) 0)`,
                clipPath: 'circle(50% at 50% 50%)',
              }}
            />
            <div className="absolute inset-4 flex items-center justify-center rounded-full bg-background">
              <span className="text-6xl font-bold font-mono tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="flex w-full justify-center gap-4">
            {session?.isActive ? (
              <Button size="lg" onClick={handlePause} className="w-32">
                <Pause className="mr-2 h-5 w-5" /> Pause
              </Button>
            ) : (
              <Button size="lg" onClick={handleStart} className="w-32">
                <Play className="mr-2 h-5 w-5" /> Start
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
