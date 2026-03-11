"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pospizza.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Store JWT in LocalStorage for client components (Zustand, pure React)
      localStorage.setItem("pos_access_token", data.access_token);
      localStorage.setItem("pos_user", JSON.stringify(data.user));

      // Store JWT in Cookies so Next.js Server Components (like the POS catalog fetcher) can read it
      document.cookie = `pos_access_token=${data.access_token}; path=/; max-age=28800; SameSite=Lax`;

      // Route to POS seamlessly
      router.push("/pos");
      
    } catch (err: any) {
      posAlert.fire({
        icon: 'error',
        title: t("login.accessDenied"),
        text: err.message || t("login.invalidCredentials"),
        confirmButtonColor: '#ff5757',
        confirmButtonText: t("login.tryAgain")
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-bold text-sm">{t("login.emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl focus-visible:ring-primary text-gray-900 dark:text-white placeholder:text-gray-400"
          placeholder="admin@pospizza.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-bold text-sm">{t("login.passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl focus-visible:ring-primary text-gray-900 dark:text-white placeholder:text-gray-400"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? t("login.authenticating") : t("login.signIn")}
      </Button>
    </form>
  );
}
