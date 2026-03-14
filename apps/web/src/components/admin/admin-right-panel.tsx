import { User, MessageSquare, Briefcase, Phone, Mail, MoreHorizontal } from "lucide-react";

export function AdminRightPanel() {
  return (
    <aside className="w-85 h-full overflow-y-auto no-scrollbar bg-card border-l border-border flex-col pt-6 z-10 hidden xl:flex">
       
       {/* Notifications */}
       <div className="px-6 mb-10">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-foreground font-bold tracking-tight">Notifications</h3>
          </div>
          <div className="space-y-6 relative">
             <div className="absolute left-4 top-4 bottom-4 w-px bg-border z-0"></div>
             
             <NotificationItem 
               icon={<User className="w-4 h-4 text-primary" />} 
               title="56 New users registered." 
               time="Just now" 
               active
             />
             <NotificationItem 
               icon={<Briefcase className="w-4 h-4 text-[#68d391]" />} 
               title="132 Orders placed." 
               time="59 Minutes ago" 
             />
             <NotificationItem 
               icon={<div className="w-2 h-2 rounded-full bg-[#f6e05e]" />} 
               title="Funds have been withdrawn." 
               time="12 Hours ago" 
             />
             <NotificationItem 
               icon={<MessageSquare className="w-4 h-4 text-[#f56565]" />} 
               title="5 Unread messages." 
               time="Today, 11:59 PM" 
             />
          </div>
       </div>

       {/* Activities */}
       <div className="px-6 mb-10">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-foreground font-bold tracking-tight">Activities</h3>
          </div>
          <div className="space-y-6 relative">
             <div className="absolute left-4 top-4 bottom-4 w-px bg-border z-0"></div>
             
             <ActivityItem 
               avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Anna" 
               title="Changed the style." 
               time="Just now" 
             />
             <ActivityItem 
               avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Tom" 
               title="17 New products added." 
               time="47 Minutes ago" 
             />
             <ActivityItem 
               avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Brad" 
               title="11 Products have been archived." 
               time="1 Days ago" 
             />
             <ActivityItem 
               avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" 
               title="Page 'Toys' has been removed." 
               time="Feb 2, 2024" 
             />
          </div>
       </div>

       {/* Contacts of Managers */}
       <div className="px-6 pb-8">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-foreground font-bold tracking-tight">Contacts of your managers</h3>
          </div>
          <div className="space-y-2">
             <ManagerItem name="Daniel Craig" avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Dan" />
             <ManagerItem name="Kate Morrison" avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Kate" />
             
             {/* Active Highlighted Manager */}
             <div className="flex items-center justify-between p-2.5 rounded-2xl bg-muted border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)] group cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-muted overflow-hidden relative">
                      <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Nat" alt="Nat" className="w-full h-full object-cover"/>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-muted rounded-full"></div>
                   </div>
                   <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">Nataniel Donovan</span>
                </div>
                <div className="flex gap-2 text-foreground">
                   <button className="bg-muted hover:bg-accent p-2 rounded-xl transition-colors"><Mail className="w-4 h-4" /></button>
                   <button className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-xl transition-colors shadow-sm"><Phone className="w-4 h-4" /></button>
                </div>
             </div>
             
             <ManagerItem name="Elisabeth Wayne" avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Eli" />
             <ManagerItem name="Felicia Raspet" avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Fel" />
          </div>
       </div>
    </aside>
  );
}

function NotificationItem({ icon, title, time, active }: any) {
   return (
      <div className="flex gap-4 relative z-10 group cursor-pointer">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-card ${active ? 'bg-primary/20' : 'bg-muted group-hover:bg-accent transition-colors'}`}>
            {icon}
         </div>
         <div className="flex flex-col pt-1">
            <span className={`text-sm ${active ? 'text-foreground font-bold' : 'text-foreground/70 font-medium group-hover:text-foreground transition-colors'}`}>{title}</span>
            <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">{time}</span>
         </div>
      </div>
   );
}

function ActivityItem({ avatar, title, time }: any) {
   return (
      <div className="flex gap-4 relative z-10 group cursor-pointer">
         <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-4 border-card">
            <img src={avatar} alt="User" />
         </div>
         <div className="flex flex-col pt-1">
            <span className="text-sm text-foreground/70 font-medium group-hover:text-foreground transition-colors">{title}</span>
            <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">{time}</span>
         </div>
      </div>
   );
}

function ManagerItem({ name, avatar }: any) {
   return (
      <div className="flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:bg-accent/40 cursor-pointer transition-colors group">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
               <img src={avatar} alt={name} className="w-full h-full object-cover"/>
            </div>
            <span className="font-semibold text-muted-foreground text-sm group-hover:text-foreground transition-colors">{name}</span>
         </div>
         <MoreHorizontal className="text-muted-foreground/50 w-5 h-5 group-hover:text-foreground transition-colors" />
      </div>
   );
}
