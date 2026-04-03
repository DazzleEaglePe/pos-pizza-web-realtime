"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { API_URL } from "@/lib/config";
import { saveTokens } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      saveTokens(data.access_token, data.refresh_token);
      localStorage.setItem("pos_user", JSON.stringify(data.user));

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-bold text-sm">
          {t("login.emailLabel")}
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
          placeholder={t("login.emailPlaceholder") || "admin@pospizza.com"}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-bold text-sm">
          {t("login.passwordLabel")}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-primary text-foreground placeholder:text-muted-foreground pr-11"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4.5 h-4.5" />
            ) : (
              <Eye className="w-4.5 h-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? t("login.authenticating") : t("login.signIn")}
      </Button>
    </form>
  );
}
