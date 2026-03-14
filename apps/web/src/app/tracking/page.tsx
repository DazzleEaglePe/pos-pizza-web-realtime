"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Pizza, Ticket } from "lucide-react";
import { useTranslation } from "@/i18n";

function normalizeTicket(input: string) {
  const raw = input.trim();
  if (!raw) return "";

  // If user pastes a URL like /orders/track/TKT-...
  const match = raw.match(/(TKT-[A-Za-z0-9-]+)/i);
  const ticket = (match?.[1] || raw).trim();
  return ticket.toUpperCase();
}

export default function TrackingIndexPage() {
  const router = useRouter();
  const { t, setLocale } = useTranslation();
  const [ticketInput, setTicketInput] = useState("");
  const [touched, setTouched] = useState(false);

  const ticket = useMemo(() => normalizeTicket(ticketInput), [ticketInput]);

  const error = touched && !ticket ? t("tracking.ticketError") : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (lang === "en" || lang === "es") setLocale(lang);
  }, [setLocale]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!ticket) return;
    router.push(`/tracking/${encodeURIComponent(ticket)}`);
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 right-0 w-140 h-140 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-115 h-115 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Link
            href="/tracking"
            className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <div className="w-11 h-11 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
              <Pizza className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-black text-foreground leading-none tracking-tight">
                {t("common.appName")}
              </div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                {t("tracking.brandSubtitle")}
              </div>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground">
            {t("tracking.pasteHint")}
          </div>
        </header>

        <main className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12 items-start">
          <section className="lg:col-span-7">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.05]">
              {t("tracking.indexTitle")}
            </h1>
            <p className="mt-4 text-base sm:text-lg font-medium text-muted-foreground max-w-prose">
              {t("tracking.indexDesc")}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="bg-card/70 border border-border rounded-[1.5rem] p-5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center">
                  1
                </div>
                <div className="mt-3 font-black text-foreground">
                  {t("tracking.step1Title")}
                </div>
                <div className="mt-1 text-sm font-semibold text-muted-foreground">
                  {t("tracking.step1Desc")}
                </div>
              </div>

              <div className="bg-card/70 border border-border rounded-[1.5rem] p-5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center">
                  2
                </div>
                <div className="mt-3 font-black text-foreground">
                  {t("tracking.step2Title")}
                </div>
                <div className="mt-1 text-sm font-semibold text-muted-foreground">
                  {t("tracking.step2Desc")}
                </div>
              </div>

              <div className="bg-card/70 border border-border rounded-[1.5rem] p-5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center">
                  3
                </div>
                <div className="mt-3 font-black text-foreground">
                  {t("tracking.step3Title")}
                </div>
                <div className="mt-1 text-sm font-semibold text-muted-foreground">
                  {t("tracking.step3Desc")}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-card/60 border border-border rounded-[1.75rem] p-6">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t("tracking.tipTitle")}
              </div>
              <div className="mt-3 text-sm font-semibold text-foreground/70">
                {t("tracking.tipText")}
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <form
              onSubmit={onSubmit}
              className="bg-card rounded-[2rem] p-6 sm:p-7 shadow-[0_18px_55px_-28px_rgba(0,0,0,0.18)] w-full border border-border max-w-xl mx-auto lg:max-w-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-black text-foreground leading-none">
                    {t("tracking.yourTicket")}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    {t("tracking.ticketExample")}:{" "}
                    <span className="text-primary">TKT-260312-0006</span>
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="ticket"
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                >
                  {t("tracking.ticketLabel")}
                </label>
                <input
                  id="ticket"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onBlur={() => setTouched(true)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="go"
                  placeholder={t("tracking.ticketPlaceholder")}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "ticket-error" : undefined}
                  className="mt-2 w-full h-12 px-5 rounded-2xl border border-border bg-muted/70 font-black tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                />

                {error && (
                  <p
                    id="ticket-error"
                    className="mt-3 text-sm font-semibold text-red-500"
                  >
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="mt-6 w-full h-12 rounded-full bg-primary text-primary-foreground font-black tracking-tight flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
              >
                {t("tracking.viewStatus")} <ArrowRight className="w-4 h-4" />
              </button>

              <p className="mt-5 text-xs text-muted-foreground font-medium text-center">
                {t("tracking.footerHint")}
              </p>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
