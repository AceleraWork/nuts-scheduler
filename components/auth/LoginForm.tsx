"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithUsername } from "@/lib/supabase/auth";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await signInWithUsername(username, password);
    setIsSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-canvas px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-surface p-6 ring-1 ring-border"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/logo.png" alt="Nuts About You" width={56} height={56} className="rounded-full" />
          <h1 className="font-display text-base text-ink">Nuts About You</h1>
          <p className="text-sm text-ink-mute">Inicia sesión para planear los horarios.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
