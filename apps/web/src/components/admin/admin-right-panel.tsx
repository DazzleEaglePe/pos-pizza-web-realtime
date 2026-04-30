"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
   Bell,
   Activity,
   Users,
   ChevronLeft,
   ChevronRight,
   Package,
   ArrowRightLeft,
   XCircle,
   Mail,
   Loader2,
   type LucideIcon,
} from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/* ─── Types ───────────────────────────────────────────── */

interface AuditLog {
   id: string;
   action: string;
   entityType: string;
   entityId: string;
   details: Record<string, unknown> | null;
   userName: string;
   userEmail: string;
   createdAt: string;
}

interface TeamUser {
   id: string;
   name: string;
   email: string;
   role: string;
   isActive: boolean;
   lastLoginAt: string | null;
}

/* ─── Helpers ─────────────────────────────────────────── */

function timeAgo(ts: number): string {
   const diff = Math.floor((Date.now() - ts) / 1000);
   if (diff < 60) return "Justo ahora";
   if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
   if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
   if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
   return new Date(ts).toLocaleDateString("es", { day: "numeric", month: "short" });
}

const NOTIF_ICON: Record<Notification["type"], LucideIcon> = {
   order_created: Package,
   order_status: ArrowRightLeft,
   order_cancelled: XCircle,
   info: Bell,
};

const NOTIF_DOT: Record<Notification["type"], string> = {
   order_created: "bg-primary",
   order_status: "bg-blue-500",
   order_cancelled: "bg-destructive",
   info: "bg-muted-foreground",
};

const ACTION_LABELS: Record<string, string> = {
   CREATE: "creó",
   UPDATE: "actualizó",
   DELETE: "eliminó",
   LOGIN: "inició sesión",
   LOGOUT: "cerró sesión",
};

const ENTITY_LABELS: Record<string, string> = {
   order: "pedido",
   product: "producto",
   user: "usuario",
   category: "categoría",
   promotion: "promoción",
   table: "mesa",
   inventory: "insumo",
   cash_register: "caja",
   config: "configuración",
};

const ROLE_LABELS: Record<string, string> = {
   ADMIN: "Admin",
   CAJERO: "Cajero",
   COCINA: "Cocina",
};

/* ─── Storage key ─────────────────────────────────────── */

export const PANEL_COLLAPSED_KEY = "admin_right_panel_collapsed";

type TabId = "notifications" | "activity" | "team";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
   { id: "notifications", label: "Notificaciones", icon: Bell },
   { id: "activity", label: "Actividad", icon: Activity },
   { id: "team", label: "Equipo", icon: Users },
];

/* ─── Main Component ──────────────────────────────────── */

export function AdminRightPanel({
   collapsed,
   onToggle,
}: {
   collapsed: boolean;
   onToggle: () => void;
}) {
   const [activeTab, setActiveTab] = useState<TabId>("notifications");
   const contentRef = useRef<HTMLDivElement>(null);

   /* ── Notifications from existing store ── */
   const { items: notifications, fetchInitial } = useNotifications();
   useEffect(() => { fetchInitial(); }, [fetchInitial]);

   /* ── Audit logs (Activities) ── */
   const [activities, setActivities] = useState<AuditLog[]>([]);
   const [activitiesLoading, setActivitiesLoading] = useState(true);

   const fetchActivities = useCallback(async () => {
      try {
         setActivitiesLoading(true);
         const data = await apiFetch<{ data: AuditLog[] }>("/audit-logs?limit=10&page=1");
         setActivities(data.data ?? []);
      } catch {
         // silent
      } finally {
         setActivitiesLoading(false);
      }
   }, []);

   useEffect(() => { fetchActivities(); }, [fetchActivities]);

   /* ── Team members ── */
   const [team, setTeam] = useState<TeamUser[]>([]);
   const [teamLoading, setTeamLoading] = useState(true);

   const fetchTeam = useCallback(async () => {
      try {
         setTeamLoading(true);
         const data = await apiFetch<TeamUser[] | { data: TeamUser[] }>("/users");
         const users: TeamUser[] = Array.isArray(data) ? data : (data.data ?? []);
         setTeam(users.filter((u) => u.isActive));
      } catch {
         // silent
      } finally {
         setTeamLoading(false);
      }
   }, []);

   useEffect(() => { fetchTeam(); }, [fetchTeam]);

   /* ── GSAP tab content animation ── */
   useGSAP(
      () => {
         if (!contentRef.current) return;
         gsap.from(contentRef.current.children, {
            y: 8,
            opacity: 0,
            stagger: 0.03,
            duration: 0.3,
            ease: "power2.out",
         });
      },
      { scope: contentRef, dependencies: [activeTab] },
   );

   /* ── Collapsed view ── */
   if (collapsed) {
      return (
         <aside className="w-14 h-full bg-background shadow-[-1px_0_0_0_oklch(0.93_0_0)] dark:shadow-[-1px_0_0_0_oklch(0.20_0_0)] z-10 hidden xl:flex flex-col items-center py-4 gap-2">
            <button
               onClick={onToggle}
               className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
               title="Expandir panel"
            >
               <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="mt-3 flex flex-col items-center gap-1.5">
               {TABS.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => { onToggle(); setActiveTab(tab.id); }}
                     className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                     title={tab.label}
                  >
                     <tab.icon className="w-3.5 h-3.5" />
                  </button>
               ))}
            </div>
         </aside>
      );
   }

   const recentNotifs = notifications.slice(0, 8);

   /* ── Expanded view ── */
   return (
      <aside className="w-80 h-full overflow-hidden bg-background shadow-[-1px_0_0_0_oklch(0.93_0_0)] dark:shadow-[-1px_0_0_0_oklch(0.20_0_0)] flex-col z-10 hidden xl:flex">
         {/* Header */}
         <div className="shrink-0">
            <div className="flex items-center justify-between px-5 py-4">
               <h3 className="text-sm font-bold">Actualizaciones</h3>
               <button
                  onClick={onToggle}
                  className="w-7 h-7 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
                  title="Contraer panel"
               >
                  <ChevronRight className="w-3.5 h-3.5" />
               </button>
            </div>
            <div className="px-4 pb-3">
               <div className="flex items-center bg-muted/60 rounded-xl p-1 gap-0.5">
                  {TABS.map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                           "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                           activeTab === tab.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                        )}
                     >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span className="hidden 2xl:inline">{tab.label}</span>
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Content */}
         <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2">
            {activeTab === "notifications" && (
               <NotificationsTab notifications={recentNotifs} />
            )}
            {activeTab === "activity" && (
               <ActivityTab activities={activities} loading={activitiesLoading} />
            )}
            {activeTab === "team" && (
               <TeamTab team={team} loading={teamLoading} />
            )}
         </div>
      </aside>
   );
}

/* ─── Tab Contents ────────────────────────────────────── */

function NotificationsTab({ notifications }: { notifications: Notification[] }) {
   if (notifications.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">Sin notificaciones recientes</p>;
   }

   return (
      <div className="space-y-3">
         {notifications.map((n) => {
            const Icon = NOTIF_ICON[n.type];
            return (
               <div key={n.id} className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="relative mt-0.5 shrink-0">
                     <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                     )}>
                        <Icon className="w-3.5 h-3.5" />
                     </div>
                     {!n.read && (
                        <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full", NOTIF_DOT[n.type])} />
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className={cn("text-sm leading-tight", n.read ? "text-muted-foreground" : "text-foreground font-medium")}>
                        {n.title}
                     </p>
                     <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                     <p className="text-[11px] text-muted-foreground/70 mt-0.5">{timeAgo(n.timestamp)}</p>
                  </div>
               </div>
            );
         })}
      </div>
   );
}

function ActivityTab({ activities, loading }: { activities: AuditLog[]; loading: boolean }) {
   if (loading) {
      return (
         <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (activities.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">Sin actividad registrada</p>;
   }

   return (
      <div className="space-y-3">
         {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-muted/50 transition-colors">
               <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold shrink-0 mt-0.5">
                  {(a.userName || a.userEmail || "?").charAt(0).toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight text-muted-foreground">
                     <span className="font-medium text-foreground">{a.userName || a.userEmail}</span>{" "}
                     {ACTION_LABELS[a.action] || a.action.toLowerCase()} un {ENTITY_LABELS[a.entityType] || a.entityType}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{timeAgo(new Date(a.createdAt).getTime())}</p>
               </div>
            </div>
         ))}
      </div>
   );
}

function TeamTab({ team, loading }: { team: TeamUser[]; loading: boolean }) {
   if (loading) {
      return (
         <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (team.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">No hay usuarios activos</p>;
   }

   const now = Date.now();
   return (
      <div className="space-y-1">
         {team.map((u) => {
            const isOnline = u.lastLoginAt ? now - new Date(u.lastLoginAt).getTime() < 86400000 : false;
            return (
               <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
               >
                  <div className="flex items-center gap-2.5 min-w-0">
                     <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                           {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        {isOnline && (
                           <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                        )}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                           {u.name || u.email}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                           {ROLE_LABELS[u.role] || u.role}
                        </span>
                     </div>
                  </div>
                  <a
                     href={`mailto:${u.email}`}
                     className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:bg-muted hover:text-foreground transition-colors"
                     title={u.email}
                  >
                     <Mail className="w-3.5 h-3.5" />
                  </a>
               </div>
            );
         })}
      </div>
   );
}