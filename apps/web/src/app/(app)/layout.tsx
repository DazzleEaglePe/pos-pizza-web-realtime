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
         <main className="flex-1 overflow-y-auto ">
            {children}
         </main>
      </div>
    </div>
  );
}
