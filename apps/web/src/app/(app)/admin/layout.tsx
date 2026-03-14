import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AdminRightPanel } from "@/components/admin/admin-right-panel";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
         <AdminTopbar />
         <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
         </main>
      </div>
      <AdminRightPanel />
    </div>
  );
}
