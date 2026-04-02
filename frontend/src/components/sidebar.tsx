"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", color: "text-indigo-400" },
  { href: "/niches", label: "Niches", icon: "🎯", color: "text-purple-400" },
  { href: "/channels", label: "Channels", icon: "📺", color: "text-blue-400" },
  { href: "/videos", label: "Forensics", icon: "🔬", color: "text-rose-400" },
  { href: "/ideas", label: "Ideation", icon: "💡", color: "text-amber-400" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl shadow-2xl">
      <Link 
        href="/" 
        className="flex h-20 items-center gap-3 px-8 transition-all hover:bg-white/[0.02]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20">
          <span className="text-xl">🔬</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tighter leading-none text-white">
            NicheScope
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            Velocity Engine
          </span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-4 py-8">
        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-4 font-mono">
          Intelligence Platform
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive 
                  ? "bg-white/[0.05] text-white shadow-sm ring-1 ring-white/10" 
                  : "text-muted-foreground hover:bg-white/[0.03] hover:text-white"
              )}
            >
              <span className={cn(
                "text-xl transition-all duration-300", 
                isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "group-hover:scale-110 group-hover:drop-shadow-glow",
                item.color
              )}>
                {item.icon}
              </span>
              <span className="flex-1 tracking-tight">{item.label}</span>
              <div className={cn(
                "h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-20"
              )} />
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
          <div className="flex justify-center -space-x-2 mb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-6 rounded-full border border-background bg-muted text-[10px] flex items-center justify-center">
                🤖
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            AI Pipeline Active
          </p>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full w-2/3 bg-primary/20 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
}
