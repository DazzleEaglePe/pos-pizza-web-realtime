"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { API_URL } from "@/lib/config";
import { saveTokens } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Store tokens (access + refresh) in localStorage + cookie
      saveTokens(data.access_token, data.refresh_token);
      localStorage.setItem("pos_user", JSON.stringify(data.user));

      // Route to POS seamlessly
      router.push("/pos");
    } catch (err: any) {
      posAlert.fire({
        icon: "error",
        title: t("login.accessDenied"),
        text: err.message || t("login.invalidCredentials"),
        confirmButtonText: t("login.tryAgain"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-foreground font-bold text-sm"
        >
          {t("login.emailLabel")}
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-muted/50 border-border rounded-sm focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
          placeholder="admin@pospizza.com"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-foreground font-bold text-sm"
        >
          {t("login.passwordLabel")}
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-muted/50 border-border rounded-sm focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? t("login.authenticating") : t("login.signIn")}
      </Button>
    </form>
  );
}
