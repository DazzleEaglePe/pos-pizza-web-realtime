import { TrendingUp, ArrowRight, UserPlus, Phone, Mail, MoreHorizontal } from "lucide-react";

export default function AdminOverview() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
        <div className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          Today <span className="ml-2 text-[10px]">▼</span>
        </div>
      </div>

      {/* Top Value Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Net revenue" value="$3,131,021" percent="0.4%" isUp={true} />
        <MetricCard title="ARR" value="$1,511,121" percent="32%" isUp={true} />
        
        <div className="bg-muted rounded-2xl p-5 border border-border flex flex-col justify-between hover:border-border transition-colors">
           <h3 className="text-muted-foreground font-medium text-sm">Quarterly revenue goal</h3>
           <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                 <span className="text-3xl font-black text-foreground">71%</span>
                 <span className="text-xs text-muted-foreground font-medium">Goal: $1.1M</span>
              </div>
              <div className="relative w-14 h-14">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                       className="text-muted-foreground"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="4"
                    />
                    <path
                       className="text-primary"
                       strokeDasharray="71, 100"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="4"
                    />
                 </svg>
              </div>
           </div>
        </div>

        <MetricCard title="New orders" value="18,221" percent="11%" isUp={true} />
      </div>

      {/* Main Analytics Section row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Circular Sales Chart (Mocked) */}
         <div className="bg-muted rounded-2xl p-6 border border-border lg:col-span-2 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Sales Overview</h3>
                <MoreHorizontal className="text-muted-foreground w-5 h-5 cursor-pointer hover:text-foreground" />
            </div>
            
            <div className="flex gap-16 items-center">
               <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                       className="text-[#68d391]"
                       strokeDasharray="45, 100"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="6"
                    />
                    <path
                       className="text-[#f6e05e]"
                       strokeDasharray="25, 100"
                       strokeDashoffset="-45"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="6"
                    />
                    <path
                       className="text-[#48bb78]"
                       strokeDasharray="30, 100"
                       strokeDashoffset="-70"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="6"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-foreground">102k</span>
                     <span className="text-[10px] text-muted-foreground">Weekly Visits</span>
                  </div>
               </div>

               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="bg-primary/20 text-primary p-2 rounded-lg">
                        <span className="font-bold text-lg">$</span>
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Number of Sales</p>
                        <p className="text-2xl font-black text-foreground">$71,020</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                     <LegendItem color="bg-[#68d391]" label="Electronic" value="$55,640" />
                     <LegendItem color="bg-[#f6e05e]" label="Furniture" value="$11,420" />
                     <LegendItem color="bg-[#48bb78]" label="Clothes" value="$1,840" />
                     <LegendItem color="bg-[#f56565]" label="Shoes" value="$2,120" />
                  </div>
               </div>
            </div>
         </div>

         {/* Small Blocks */}
         <div className="space-y-6 flex flex-col">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-muted rounded-2xl p-5 border border-border cursor-pointer hover:bg-accent transition-colors">
                  <div className="bg-primary/20 w-8 h-8 rounded-full flex items-center justify-center mb-3">
                     <UserPlus className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">New customers:</p>
                  <p className="text-xl font-bold text-foreground">862 <span className="text-red-500 text-xs">-8%</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">Last Week</p>
               </div>
               <div className="bg-muted rounded-2xl p-5 border border-border cursor-pointer hover:bg-accent transition-colors">
                  <div className="bg-primary/20 w-8 h-8 rounded-full flex items-center justify-center mb-3">
                     <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Total profit:</p>
                  <p className="text-xl font-bold text-foreground">$25.6k <span className="text-primary text-xs">+42%</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">Weekly Profit</p>
               </div>
            </div>

            <div className="bg-muted rounded-2xl p-5 border border-border flex-1 relative overflow-hidden flex flex-col justify-between group">
               <div className="z-10 relative">
                  <h4 className="text-foreground text-sm font-bold">Total Profit:</h4>
                  <p className="text-3xl font-black text-foreground mt-1">$136,755.77</p>
               </div>
               
               {/* Decorative Area Chart svg */}
               <div className="absolute bottom-0 left-0 right-0 h-24 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                     <path d="M0 30 L0 15 Q 10 10, 20 20 T 40 10 T 60 25 T 80 5 T 100 15 L 100 30 Z" fill="rgba(var(--primary), 0.1)" />
                     <path d="M0 15 Q 10 10, 20 20 T 40 10 T 60 25 T 80 5 T 100 15" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />
                  </svg>
               </div>
            </div>
         </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-muted rounded-2xl p-6 border border-border lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Customer list</h3>
                <MoreHorizontal className="text-muted-foreground w-5 h-5 cursor-pointer hover:text-foreground" />
            </div>
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                     <th className="pb-3 font-medium">Name <span className="opacity-50 inline-block rotate-180">▲</span></th>
                     <th className="pb-3 font-medium">Deals <span className="opacity-50 inline-block rotate-180">▲</span></th>
                     <th className="pb-3 font-medium text-right">Total Deal Value <span className="opacity-50 inline-block rotate-180">▲</span></th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  <CustomerRow name="Danny Liu" email="danny@gmail.com" deals={1023} value="$37,431" />
                  <CustomerRow name="Bella Deviant" email="bella@gmail.com" deals={963} value="$30,423" />
                  <CustomerRow name="Darrell Steward" email="darrell@gmail.com" deals={843} value="$28,549" />
               </tbody>
            </table>
         </div>

         {/* Premium Ad Card */}
         <div className="rounded-2xl p-6 border border-border relative overflow-hidden bg-linear-to-br from-primary/20 to-primary/5">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
             
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30 flex items-center gap-2">
                   <span>⚡</span> Premium Plane
                </div>
                <MoreHorizontal className="text-primary/50 w-5 h-5 cursor-pointer hover:text-primary" />
             </div>

             <div className="relative z-10 flex flex-col h-full justify-between pb-8">
                <div>
                   <div className="flex items-end gap-2 text-foreground">
                      <span className="text-5xl font-black">$30</span>
                      <span className="text-xs text-muted-foreground mb-1 leading-tight border-l border-border pl-2">Per Month<br/>Per User</span>
                   </div>
                   <p className="text-sm text-foreground/80 mt-6 leading-relaxed w-[80%]">
                      Improve your workplace, view and analyze your profits and losses
                   </p>
                </div>

                <button className="bg-linear-to-r from-primary to-[#48bb78] w-full py-4 mt-8 rounded-xl font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform">
                   Get Started
                </button>
             </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, percent, isUp }: any) {
   return (
      <div className="bg-muted rounded-2xl p-5 border border-border flex flex-col hover:border-border transition-colors">
         <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
         <p className="text-3xl font-black text-foreground mt-3 mb-1">{value}</p>
         <div className="flex items-center gap-1">
            <TrendingUp className={`w-3 h-3 ${isUp ? 'text-primary' : 'text-red-500'} ${isUp ? '' : 'transform rotate-180'}`} />
            <span className={`text-xs font-bold ${isUp ? 'text-primary' : 'text-red-500'}`}>{percent}</span>
            <span className="text-xs text-muted-foreground ml-1">vs last month</span>
         </div>
      </div>
   );
}

function LegendItem({ color, label, value }: any) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${color}`}></span>
            {label}
         </div>
         <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
   );
}

function CustomerRow({ name, email, deals, value }: any) {
   return (
      <tr className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
         <td className="py-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name}`} alt={name} />
               </div>
               <div className="flex flex-col">
                  <span className="font-bold text-foreground">{name}</span>
                  <span className="text-xs text-muted-foreground">{email}</span>
               </div>
            </div>
         </td>
         <td className="py-4 text-foreground/70 font-medium">{deals}</td>
         <td className="py-4 text-right font-bold text-foreground">{value}</td>
      </tr>
   );
}
