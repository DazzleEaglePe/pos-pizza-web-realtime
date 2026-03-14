import Link from "next/link";
import { cookies } from "next/headers";
import {
   AlertTriangle,
   ArrowRight,
   BookOpen,
   Boxes,
   Gift,
   Package,
   PackagePlus,
   Settings2,
   ShieldCheck,
   Sparkles,
   Store,
   UtensilsCrossed,
} from "lucide-react";
import { API_URL } from "@/lib/config";

type CatalogProduct = {
   isActive: boolean;
   variants?: unknown[];
   modifierGroups?: unknown[];
};

type CatalogCategory = {
   isActive: boolean;
   products: CatalogProduct[];
};

type ModifierGroup = {
   isActive: boolean;
   modifiers: unknown[];
};

type InventoryItem = {
   isActive: boolean;
};

type AlertItem = {
   id: string;
   name: string;
   shortage: number;
   unitOfMeasure: string;
   urgency: "critical" | "warning";
};

type Promotion = {
   isActive: boolean;
};

async function fetchAdminData<T>(path: string, token: string | undefined) {
   try {
      const response = await fetch(`${API_URL}${path}`, {
         cache: "no-store",
         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) return null;
      return (await response.json()) as T;
   } catch (error) {
      console.error(`Failed to fetch ${path}:`, error);
      return null;
   }
}

export default async function AdminOverview() {
   const cookieStore = await cookies();
   const token = cookieStore.get("pos_access_token")?.value;

   const [catalog, modifierGroups, inventoryItems, alerts, promotions] =
      await Promise.all([
         fetchAdminData<CatalogCategory[]>("/catalog/admin", token),
         fetchAdminData<ModifierGroup[]>("/catalog/modifier-groups", token),
         fetchAdminData<InventoryItem[]>("/inventory/items", token),
         fetchAdminData<AlertItem[]>("/inventory/alerts", token),
         fetchAdminData<Promotion[]>("/promotions/all", token),
      ]);

   const categories = catalog ?? [];
   const groups = modifierGroups ?? [];
   const stockItems = inventoryItems ?? [];
   const stockAlerts = alerts ?? [];
   const comboList = promotions ?? [];

   const allProducts = categories.flatMap((category) => category.products);
   const activeCategories = categories.filter((category) => category.isActive).length;
   const activeProducts = allProducts.filter((product) => product.isActive).length;
   const variantCount = allProducts.reduce(
      (total, product) => total + (product.variants?.length ?? 0),
      0,
   );
   const assignedModifierGroups = allProducts.reduce(
      (total, product) => total + (product.modifierGroups?.length ?? 0),
      0,
   );
   const activeModifierGroups = groups.filter((group) => group.isActive).length;
   const activeModifiers = groups.reduce(
      (total, group) => total + group.modifiers.length,
      0,
   );
   const activeInventory = stockItems.filter((item) => item.isActive).length;
   const activePromotions = comboList.filter((promotion) => promotion.isActive).length;
   const criticalAlerts = stockAlerts.filter(
      (alert) => alert.urgency === "critical",
   ).length;
   const warningAlerts = stockAlerts.length - criticalAlerts;
   const highlightedAlerts = stockAlerts.slice(0, 3);

   const modules = [
      {
         href: "/admin/menu",
         title: "Catalogo",
         description:
            "Categorias, productos, variantes y modificadores en una sola vista.",
         metric: `${activeProducts} productos`,
         detail: `${activeCategories} categorias · ${variantCount} variantes`,
         icon: UtensilsCrossed,
         accent: "from-primary/20 via-primary/10 to-transparent",
      },
      {
         href: "/admin/promotions",
         title: "Combos y promos",
         description:
            "Configura campanas activas y paquetes visibles en operacion.",
         metric: `${activePromotions} activas`,
         detail: `${comboList.length} promociones registradas`,
         icon: Gift,
         accent: "from-amber-500/20 via-amber-500/10 to-transparent",
      },
      {
         href: "/admin/inventory",
         title: "Inventario",
         description:
            "Controla insumos, recetas, reposiciones y movimientos.",
         metric: `${activeInventory} insumos`,
         detail: `${stockAlerts.length} alertas por revisar`,
         icon: Package,
         accent: "from-sky-500/20 via-sky-500/10 to-transparent",
      },
      {
         href: "/admin/settings",
         title: "Negocio",
         description:
            "Ajusta parametros operativos, impuestos y comportamiento comercial.",
         metric: `${activeModifierGroups} grupos`,
         detail: `${activeModifiers} modificadores disponibles`,
         icon: Settings2,
         accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      },
   ];

   return (
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
         <section className="relative overflow-hidden rounded-[28px] border border-border bg-card px-7 py-7 md:px-8 md:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary),0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_28%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
               <div className="max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                     <Sparkles className="h-3.5 w-3.5" />
                     Centro de gestion
                  </div>
                  <div className="space-y-3">
                     <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                        Administra el POS sin salir de contexto.
                     </h1>
                     <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                        Este espacio concentra catalogo, promociones, stock y reglas del negocio para que gestion no se sienta como otra caja, sino como el panel operativo que sostiene la operacion.
                     </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                     <Badge label={`${activeCategories} categorias activas`} tone="primary" />
                     <Badge label={`${activeProducts} productos activos`} tone="neutral" />
                     <Badge label={`${activeModifierGroups} grupos configurados`} tone="success" />
                     <Badge label={`${stockAlerts.length} alertas de stock`} tone="warning" />
                  </div>
               </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-90">
                  <QuickAction
                     href="/admin/menu"
                     title="Ir a catalogo"
                     description="Actualizar menu y modificadores"
                     icon={UtensilsCrossed}
                  />
                  <QuickAction
                     href="/admin/inventory/alerts"
                     title="Revisar alertas"
                     description="Priorizar faltantes y reposicion"
                     icon={AlertTriangle}
                  />
               </div>
            </div>
         </section>

         <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
               title="Catalogo activo"
               value={String(activeProducts)}
               detail={`${activeCategories} categorias · ${variantCount} variantes`}
               icon={Store}
               tone="primary"
            />
            <StatCard
               title="Modificadores"
               value={String(activeModifiers)}
               detail={`${activeModifierGroups} grupos · ${assignedModifierGroups} asignaciones`}
               icon={Boxes}
               tone="success"
            />
            <StatCard
               title="Stock bajo"
               value={String(stockAlerts.length)}
               detail={`${criticalAlerts} criticas · ${warningAlerts} preventivas`}
               icon={AlertTriangle}
               tone="warning"
            />
            <StatCard
               title="Promociones vigentes"
               value={String(activePromotions)}
               detail={`${comboList.length} promociones registradas`}
               icon={Gift}
               tone="neutral"
            />
         </section>

         <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[24px] border border-border bg-card p-6">
               <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Modulos clave
                     </p>
                     <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        Prioridades de gestion
                     </h2>
                  </div>
                  <p className="max-w-sm text-right text-sm text-muted-foreground">
                     Cada bloque resume el estado actual y te lleva directo a la accion mas probable.
                  </p>
               </div>

               <div className="grid gap-4 md:grid-cols-2">
                  {modules.map((module) => (
                     <Link
                        key={module.href}
                        href={module.href}
                        className="group relative overflow-hidden rounded-[22px] border border-border bg-muted/30 p-5 transition-colors hover:border-primary/30 hover:bg-accent/40"
                     >
                         <div className={`absolute inset-0 bg-linear-to-br ${module.accent} opacity-80`} />
                        <div className="relative space-y-5">
                           <div className="flex items-start justify-between gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/80">
                                 <module.icon className="h-5 w-5 text-foreground" />
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-lg font-bold text-foreground">{module.title}</h3>
                              <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
                           </div>
                           <div className="flex items-end justify-between gap-4 border-t border-border/60 pt-4">
                              <div>
                                 <p className="text-xl font-black tracking-tight text-foreground">{module.metric}</p>
                                 <p className="text-xs font-medium text-muted-foreground">{module.detail}</p>
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                 Abrir
                              </span>
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <div className="rounded-[24px] border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                     <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                           Atencion inmediata
                        </p>
                        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                           Focos operativos
                        </h2>
                     </div>
                     <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        <ShieldCheck className="h-5 w-5" />
                     </div>
                  </div>

                  {highlightedAlerts.length === 0 ? (
                     <div className="mt-5 rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm font-semibold text-foreground">Sin alertas urgentes</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                           El inventario se mantiene por encima del minimo configurado.
                        </p>
                     </div>
                  ) : (
                     <div className="mt-5 space-y-3">
                        {highlightedAlerts.map((alert) => (
                           <div
                              key={alert.id}
                              className="rounded-[18px] border border-border bg-muted/30 p-4"
                           >
                              <div className="flex items-start justify-between gap-3">
                                 <div>
                                    <p className="font-semibold text-foreground">{alert.name}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                       Faltan {alert.shortage.toLocaleString()} {alert.unitOfMeasure}
                                    </p>
                                 </div>
                                 <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                                       alert.urgency === "critical"
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    }`}
                                 >
                                    {alert.urgency === "critical" ? "Critica" : "Preventiva"}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  <Link
                     href="/admin/inventory/alerts"
                     className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
                  >
                     Ver todas las alertas
                     <ArrowRight className="h-4 w-4" />
                  </Link>
               </div>

               <div className="rounded-[24px] border border-border bg-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                     Acciones rapidas
                  </p>
                  <div className="mt-5 space-y-3">
                     <InlineAction
                        href="/admin/inventory/restock"
                        icon={PackagePlus}
                        label="Registrar reposicion"
                        meta="Actualizar entradas de stock"
                     />
                     <InlineAction
                        href="/admin/inventory/recipes"
                        icon={BookOpen}
                        label="Revisar recetas"
                        meta="Validar consumo por producto"
                     />
                     <InlineAction
                        href="/admin/settings"
                        icon={Settings2}
                        label="Ajustar negocio"
                        meta="IGV, datos y parametros operativos"
                     />
                  </div>
               </div>
            </div>
         </section>
      </div>
   );
}

function Badge({
   label,
   tone,
}: {
   label: string;
   tone: "primary" | "neutral" | "success" | "warning";
}) {
   const toneClass = {
      primary: "border-primary/20 bg-primary/10 text-primary",
      neutral: "border-border bg-background/80 text-foreground",
      success:
         "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      warning:
         "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
   }[tone];

   return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
         {label}
      </span>
   );
}

function QuickAction({
   href,
   title,
   description,
   icon: Icon,
}: {
   href: string;
   title: string;
   description: string;
   icon: typeof UtensilsCrossed;
}) {
   return (
      <Link
         href={href}
         className="group rounded-[22px] border border-border bg-background/80 p-4 transition-colors hover:border-primary/30 hover:bg-background"
      >
         <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
               </div>
               <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
               </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
         </div>
      </Link>
   );
}

function StatCard({
   title,
   value,
   detail,
   icon: Icon,
   tone,
}: {
   title: string;
   value: string;
   detail: string;
   icon: typeof UtensilsCrossed;
   tone: "primary" | "success" | "warning" | "neutral";
}) {
   const toneClass = {
      primary: "bg-primary/10 text-primary",
      success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      neutral: "bg-muted text-foreground",
   }[tone];

   return (
      <div className="rounded-[22px] border border-border bg-card p-5">
         <div className="flex items-start justify-between gap-4">
            <div>
               <p className="text-sm font-medium text-muted-foreground">{title}</p>
               <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
               <Icon className="h-5 w-5" />
            </div>
         </div>
         <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      </div>
   );
}

function InlineAction({
   href,
   icon: Icon,
   label,
   meta,
}: {
   href: string;
   icon: typeof UtensilsCrossed;
   label: string;
   meta: string;
}) {
   return (
      <Link
         href={href}
         className="group flex items-center justify-between rounded-[18px] border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
      >
         <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background">
               <Icon className="h-4 w-4 text-foreground" />
            </div>
            <div>
               <p className="font-semibold text-foreground">{label}</p>
               <p className="text-sm text-muted-foreground">{meta}</p>
            </div>
         </div>
         <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
   );
}
