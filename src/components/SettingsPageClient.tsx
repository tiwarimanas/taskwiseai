'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import * as userService from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SettingsPageClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [knowledge, setKnowledge] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      setIsLoading(true);
      try {
        const profile = await userService.getUserProfile(user.uid);
        if (profile) {
          setKnowledge(profile.knowledge || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your profile information.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user, toast]);

  const handleSaveKnowledge = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await userService.updateUserProfile(user.uid, { knowledge });
      toast({
        title: 'Preferences Saved!',
        description: 'The AI will now use your scheduling preferences.',
      });
    } catch (error) {
      console.error('Failed to save knowledge:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your preferences.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app preferences.</p>
      </header>
      <main className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p>Theme</p>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Personalization</CardTitle>
            <CardDescription>
              Help the AI understand your schedule better. Provide your typical working hours, break times, or any other scheduling preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p>Loading preferences...</p>
            ) : (
              <>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="knowledge">My Schedule & Preferences</Label>
                  <Textarea
                    id="knowledge"
                    placeholder="e.g., I work from 9am to 5pm on weekdays. I prefer not to have meetings on Mondays. Lunch is from 12pm to 1pm."
                    value={knowledge}
                    onChange={(e) => setKnowledge(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button onClick={handleSaveKnowledge} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <div className="space-y-4">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Name:</strong> {user.displayName}
                </p>
                <Button variant="outline">Manage Account</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
