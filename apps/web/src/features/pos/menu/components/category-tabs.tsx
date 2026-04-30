"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, Utensils, Gift } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTranslation } from "@/i18n";
import { ICON_MAP, COMBOS_CATEGORY_ID } from "../types";
import type { CatalogCategory } from "../types";

interface CategoryTabsProps {
  categories: CatalogCategory[];
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  totalProductCount: number;
  promotionsCount: number;
  isComboView: boolean;
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onCategoryChange,
  totalProductCount,
  promotionsCount,
  isComboView,
}: CategoryTabsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile: horizontal tabs */}
      <div className="lg:hidden min-w-0 border-b border-border/40">
        <ScrollArea className="min-w-0 whitespace-nowrap -mx-3 px-3">
          <div className="flex w-max gap-0 pr-3">
            {categories.map((category) => {
              const Icon =
                category.id === "__all__"
                  ? LayoutGrid
                  : (category.icon && ICON_MAP[category.icon]) || Utensils;
              const isActive = category.id === selectedCategoryId;
              const count =
                category.id === "__all__" ? totalProductCount : (category.productCount ?? 0);
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {category.name}
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-0.5 text-[11px] font-bold tabular-nums",
                        isActive ? "text-primary" : "text-muted-foreground/60",
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
            {promotionsCount > 0 && (
              <button
                onClick={() => onCategoryChange(COMBOS_CATEGORY_ID)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                  isComboView
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Gift className="w-4 h-4" />
                {t("promotions.combos")}
                <span
                  className={cn(
                    "ml-0.5 text-[11px] font-bold tabular-nums",
                    isComboView ? "text-primary" : "text-muted-foreground/60",
                  )}
                >
                  {promotionsCount}
                </span>
                {isComboView && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Desktop: vertical category list */}
      <nav className="hidden lg:flex flex-col gap-0.5 flex-1 overflow-y-auto custom-scrollbar">
        {categories.map((category) => {
          const Icon =
            category.id === "__all__"
              ? LayoutGrid
              : (category.icon && ICON_MAP[category.icon]) || Utensils;
          const isActive = category.id === selectedCategoryId;
          const count =
            category.id === "__all__" ? totalProductCount : (category.productCount ?? 0);
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-sm text-[13px] font-medium transition-colors text-left",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{category.name}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-[11px] font-bold tabular-nums",
                    isActive ? "text-primary/70" : "text-muted-foreground/40",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {promotionsCount > 0 && (
          <button
            onClick={() => onCategoryChange(COMBOS_CATEGORY_ID)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-sm text-[13px] font-medium transition-colors text-left",
              isComboView
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{t("promotions.combos")}</span>
            <span
              className={cn(
                "text-[11px] font-bold tabular-nums",
                isComboView ? "text-primary/70" : "text-muted-foreground/40",
              )}
            >
              {promotionsCount}
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
