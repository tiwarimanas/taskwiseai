'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bot } from "lucide-react";

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/tasks');
        }
    }, [user, loading, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Bot className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to TaskWise AI</CardTitle>
                    <CardDescription>Sign in to continue to your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={signInWithGoogle} className="w-full" disabled={loading}>
                        {loading ? 'Loading...' : 'Sign in with Google'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
