
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import * as focusService from '@/services/focusService';
import type { FocusSession } from '@/lib/types';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const DEFAULT_FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export function FocusPageClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [focusDuration, setFocusDuration] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [timeLeft, setTimeLeft] = useState(focusDuration);

  const sessionType = session?.sessionType || 'focus';
  const currentDuration = sessionType === 'focus' ? focusDuration : BREAK_MINUTES * 60;

  const handleSessionEnd = () => {
    if (!user) return;
    
    if (sessionType === 'focus') {
      toast({
        title: "Focus Session Complete!",
        description: "Great work! Time for a 5-minute break.",
      });
      focusService.startFocusSession(user.uid, BREAK_MINUTES * 60, 'break');
    } else { // sessionType === 'break'
      toast({
        title: "Break's Over!",
        description: "Time to get back to it. Starting next focus session.",
      });
      focusService.startFocusSession(user.uid, focusDuration, 'focus');
    }
  };
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = focusService.streamFocusSession(user.uid, (focusSession) => {
      setSession(focusSession);
      if (focusSession && focusSession.isActive) {
        const serverEndTime = focusSession.endTime.getTime();
        const clientCurrentTime = Date.now();
        const remaining = Math.round((serverEndTime - clientCurrentTime) / 1000);
        setTimeLeft(Math.max(0, remaining));
        if (focusSession.sessionType === 'focus') {
          setFocusDuration(focusSession.duration);
        }
      } else {
        setTimeLeft(focusDuration);
      }
    });
    return () => unsubscribe();
  }, [user, focusDuration]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (session?.isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleSessionEnd();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (session?.isActive && timeLeft <= 0) {
        // This handles the case where the timer ends while the tab was inactive
        handleSessionEnd();
    }

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.isActive, timeLeft, user]);

  const handleStart = () => {
    if (!user) return;
    focusService.startFocusSession(user.uid, focusDuration, 'focus');
  };

  const handlePause = () => {
    if (!user) return;
    focusService.pauseFocusSession(user.uid, timeLeft);
  };

  const handleReset = () => {
    if (!user) return;
    focusService.resetFocusSession(user.uid);
    setTimeLeft(focusDuration);
  };

  const handleSkipBreak = () => {
    if (!user || sessionType !== 'break') return;
     toast({
        title: "Break Skipped!",
        description: "Starting next focus session.",
      });
    focusService.startFocusSession(user.uid, focusDuration, 'focus');
  }

  const progress = ((currentDuration - timeLeft) / currentDuration) * 100;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline">
            {sessionType === 'focus' ? 'Focus Timer' : 'Break Time'}
          </CardTitle>
          <CardDescription>
            {sessionType === 'focus' ? 'Your synced Pomodoro session.' : 'Relax and recharge!'}
          </CardDescription>
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
             {sessionType === 'break' && session?.isActive ? (
                <Button size="lg" variant="outline" onClick={handleSkipBreak}>
                    <SkipForward className="mr-2 h-5 w-5" /> Skip Break
                </Button>
            ) : (
                <Button size="lg" variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-5 w-5" /> Reset
                </Button>
            )}
          </div>
           <div className="w-full pt-4 space-y-4">
              <div className='flex justify-between items-center'>
                <Label htmlFor="duration" className="shrink-0">Focus Duration</Label>
                <span className="text-sm font-medium">{focusDuration / 60} minutes</span>
              </div>
              <Slider
                id="duration"
                min={5}
                max={120}
                step={5}
                value={[focusDuration / 60]}
                onValueChange={([value]) => setFocusDuration(value * 60)}
                disabled={session?.isActive}
              />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
