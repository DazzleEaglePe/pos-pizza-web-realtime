import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
         <Topbar />
         <main className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 lg:pb-8 pt-2">
            {children}
         </main>
      </div>
    </div>
  );
}
