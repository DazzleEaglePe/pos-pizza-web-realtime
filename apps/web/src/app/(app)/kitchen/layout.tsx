import { UtensilsCrossed } from "lucide-react";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] text-white overflow-hidden dark">
      <header className="flex items-center justify-between px-6 py-4 bg-[#1c1c1c] border-b border-white/5 shadow-sm z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
               <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div>
               <h1 className="font-black text-xl tracking-tight text-white leading-none">KDS Station</h1>
               <span className="text-xs text-primary font-bold">Pizza & Oven</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
               <span className="text-sm font-bold">12 Pending</span>
            </div>
            <div className="text-right">
               <div className="text-xl font-bold font-mono">11:05 PM</div>
               <div className="text-xs text-gray-400 font-medium">Monday, Oct 24</div>
            </div>
         </div>
      </header>
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
         {children}
      </main>
    </div>
  );
}
