"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, MessageSquare, IndianRupee } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2Icon } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(user.role === "admin" ? "/admin/tickets" : "/author/books");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid min-h-[70vh] items-center gap-8 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold tracking-tight">
            Your publishing journey, <span className="text-primary">supported</span>
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Track royalties, manage your catalogue, and get answers from the BookLeaf team — all in one place.
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <p className="font-medium">Royalty transparency</p>
                <p className="text-sm text-muted-foreground">Per-transaction breakdown across platforms</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <p className="font-medium">Support tickets</p>
                <p className="text-sm text-muted-foreground">Track conversations with our team</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                <IndianRupee className="size-4" />
              </div>
              <div>
                <p className="font-medium">Payout tracking</p>
                <p className="text-sm text-muted-foreground">See earned, paid, and pending royalties</p>
              </div>
            </li>
          </ul>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your author or admin portal</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4">
                <ErrorAlert message={error} />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2Icon className="animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Demo accounts</p>
              <p>Author: priya.sharma@email.com</p>
              <p>Admin: admin@bookleaf.com</p>
              <p>Password: Password123!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
