import { Clock, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function KitchenPage() {
  return (
    <div className="flex gap-6 h-full w-max min-w-full">
       <OrderColumn title="New Orders" count={3} type="new" />
       <OrderColumn title="Preparing" count={2} type="progress" />
       <OrderColumn title="Ready / Done" count={1} type="done" />
    </div>
  );
}

function OrderColumn({ title, count, type }: any) {
   return (
      <div className="flex flex-col w-[380px] h-full">
         <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
               {title} <span className="text-sm bg-[#1c1c1c] text-primary px-3 py-1 rounded-full font-black border border-primary/20">{count}</span>
            </h2>
         </div>
         <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-12">
            {Array.from({ length: count }).map((_, i) => (
               <OrderTicket key={`${type}-${i}`} type={type} id={`#00${i+1}42A`} />
            ))}
         </div>
      </div>
   );
}

function OrderTicket({ type, id }: any) {
   const isNew = type === "new";
   const isProgress = type === "progress";
   const isDone = type === "done";

   return (
      <div className={`bg-[#1c1c1c] border rounded-2xl p-5 shadow-2xl transition-all ${
         isNew ? 'border-primary/50 ring-1 ring-primary/20' : 
         isProgress ? 'border-[#f6e05e]/50 ring-1 ring-[#f6e05e]/20' : 
         'border-white/5 opacity-50'
      }`}>
         <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black text-white">{id}</span>
                  <Badge className="bg-[#242426] text-white hover:bg-[#242426] border-white/10">Table 04</Badge>
                  {isNew && <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20 border-red-500/30">Urgent</Badge>}
               </div>
               <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> 12 mins ago • Dinning In
               </div>
            </div>
         </div>

         <div className="space-y-3 mb-6">
            <TicketItem qty={1} name="Caramel Java Frappuccino" note="Extra caramel, Less ice" done={isDone || isProgress} />
            <TicketItem qty={2} name="Original Cheese Burger" note="No onions" done={isDone} />
            <TicketItem qty={1} name="French Fries" done={isDone} />
         </div>

         <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            {isNew && (
               <>
                  <button className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-colors">Decline</button>
                  <button className="flex-1 py-3 rounded-xl bg-primary text-gray-900 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                     Accept <ChevronRight className="w-4 h-4" />
                  </button>
               </>
            )}
            {isProgress && (
               <button className="w-full py-3 rounded-xl bg-[#f6e05e] text-orange-950 font-bold shadow-[0_0_15px_rgba(246,224,94,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Mark Ready
               </button>
            )}
            {isDone && (
               <button className="w-full py-3 rounded-xl border border-white/10 text-white font-bold bg-[#242426] hover:bg-[#2a2a2c] transition-all flex items-center justify-center gap-2">
                  Completed
               </button>
            )}
         </div>
      </div>
   );
}

function TicketItem({ qty, name, note, done }: any) {
   return (
      <div className={`flex gap-3 group cursor-pointer ${done ? 'opacity-30 line-through' : ''}`}>
         <span className="font-black text-white text-lg w-6 shrink-0">{qty}x</span>
         <div>
            <span className={`font-bold text-md ${done ? 'text-gray-500' : 'text-gray-200'}`}>{name}</span>
            {note && <p className="text-xs text-red-400 font-semibold mt-0.5 max-w-[90%]">Note: {note}</p>}
         </div>
      </div>
   );
}
