import { CheckCircle2, CircleDashed, Pizza, Clock, ChevronLeft, Ticket } from "lucide-react";
import Link from "next/link";

export default function TrackingPage() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f5f7f9] text-slate-800 max-w-md mx-auto shadow-2xl relative overflow-hidden">
       {/* Mobile App Header */}
       <header className="flex items-center justify-between p-6 bg-white shrink-0 relative z-10">
          <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
             <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
             <Pizza className="w-5 h-5 text-primary" />
             <span className="font-bold tracking-tight text-lg">POS Pizza</span>
          </div>
          <div className="w-10"></div> {/* Spacer to center */}
       </header>

       {/* Main Tracking Content */}
       <main className="flex-1 overflow-y-auto px-6 pt-8 pb-12 relative z-10 w-full no-scrollbar">
          
          <div className="text-center mb-8">
             <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Order #00242A</h1>
             <p className="text-gray-500 mt-2 font-medium">Estimated ready time: <span className="font-bold text-primary">11:15 PM</span></p>
          </div>

          {/* Stepper Tracking Visualizer */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] w-full mb-8 relative">
             <div className="absolute top-12 bottom-12 left-[3.25rem] w-1 bg-gray-100/50 -translate-x-1/2 rounded-full z-0"></div>
             {/* Progress Bar Active */}
             <div className="absolute top-12 bottom-12 left-[3.25rem] w-1 bg-primary -translate-x-1/2 rounded-full z-0 h-[45%]"></div>
             
             <div className="space-y-12 relative z-10">
                <TrackingStep 
                   status="done"
                   title="Order Placed" 
                   time="10:45 PM" 
                   desc="We have received your order."
                />
                <TrackingStep 
                   status="done"
                   title="Preparing" 
                   time="10:50 PM" 
                   desc="Your items are being prepared."
                />
                <TrackingStep 
                   status="active"
                   title="In the Oven" 
                   time="In Progress" 
                   desc="Almost there, baking to perfection."
                />
                <TrackingStep 
                   status="pending"
                   title="Ready to Pickup" 
                   time="--:--" 
                   desc="Wait for the counter notification."
                />
             </div>
          </div>

          {/* Receipt Data */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">
                <Ticket className="w-5 h-5 text-primary" />
                <h3>Order Summary</h3>
             </div>
             <div className="space-y-3 mb-6">
                <div className="flex justify-between font-semibold text-[15px] text-gray-700">
                   <span>1x Caramel Java Frappuccino</span>
                   <span>$35.00</span>
                </div>
                <div className="flex justify-between font-semibold text-[15px] text-gray-700">
                   <span>2x Original Cheese Burger</span>
                   <span>$47.98</span>
                </div>
             </div>
             
             <div className="flex justify-between font-black text-lg text-gray-900 pt-4 border-t border-dashed border-gray-200">
                <span>Total</span>
                <span>$82.98</span>
             </div>
          </div>
       </main>
       
       {/* Background decorative blob */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none z-0"></div>
    </div>
  );
}

function TrackingStep({ status, title, time, desc }: any) {
   const isDone = status === "done";
   const isActive = status === "active";
   const isPending = status === "pending";

   return (
      <div className="flex gap-6 w-full group">
         <div className="relative shrink-0 flex items-center justify-center pt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 transition-colors duration-500
               ${isDone ? 'bg-primary text-white ' : isActive ? 'bg-white border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-gray-100 border-gray-50 text-gray-300'}`}>
               {isDone && <CheckCircle2 className="w-5 h-5 text-gray-900" />}
               {isActive && <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute"></div>}
               {isActive && <div className="w-3 h-3 bg-primary rounded-full relative z-10"></div>}
               {isPending && <CircleDashed className="w-5 h-5 stroke-[3]" />}
            </div>
         </div>
         
         <div className={`flex flex-col pt-0.5 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
             <h4 className={`text-lg tracking-tight font-black leading-none ${isActive ? 'text-primary' : 'text-gray-900'}`}>{title}</h4>
             <span className={`text-[13px] font-bold mt-1.5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{time}</span>
             <p className="text-sm font-medium text-gray-500 mt-1 leading-snug pr-4">{desc}</p>
         </div>
      </div>
   );
}
