import { Link, NavLink, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, Search, User, LayoutDashboard, BarChart3, Newspaper, LineChart, Briefcase, Users } from "lucide-react";
import { PropsWithChildren } from "react";

const TOP_NAV = [
  { label: "Dashboard", to: "/" },
  { label: "Watchlist", to: "/watchlist" },
  { label: "Financials", to: "/financials" },
  { label: "Sector Analysis", to: "/sector" },
  { label: "CEO Analysis", to: "/ceo" },
  { label: "News & Sentiment", to: "/news" },
];

const LEFT_NAV = [
  { label: "Technical Analysis", to: "/", icon: LineChart },
  { label: "Watchlist & Alerts", to: "/watchlist", icon: Bell },
  { label: "Financial Statements", to: "/financials", icon: LayoutDashboard },
  { label: "Sector Performance", to: "/sector", icon: BarChart3 },
  { label: "CEO Performance", to: "/ceo", icon: Users },
  { label: "News & Sentiment", to: "/news", icon: Newspaper },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <aside className="w-60 shrink-0 border-r bg-card hidden md:block">
          <div className="p-3 text-sm font-semibold text-muted-foreground">Menu</div>
          <nav className="px-2 space-y-1">
            {LEFT_NAV.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <NavLink key={item.to} to={item.to} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm", active ? "bg-accent text-accent-foreground" : "hover:bg-muted/60")}> 
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto p-3 text-xs text-muted-foreground">
            <div className="space-y-2">
              <a className="flex items-center gap-2 hover:text-foreground" href="#">Link to Dashboard</a>
              <a className="flex items-center gap-2 hover:text-foreground" href="#">External Link</a>
            </div>
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 flex h-14 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">★</span>
          <span>StockPulse</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {TOP_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cn("transition-colors hover:text-foreground", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search stocks..." className="pl-8" />
          </div>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"><Bell className="h-4 w-4" /></button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"><User className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Resources</a>
          <a href="#" className="hover:text-foreground">Legal</a>
          <a href="#" className="hover:text-foreground">Connect</a>
        </div>
        <div className="flex gap-4">
          <span className="h-6 w-6 rounded bg-muted inline-block" />
          <span className="h-6 w-6 rounded bg-muted inline-block" />
          <span className="h-6 w-6 rounded bg-muted inline-block" />
        </div>
      </div>
    </footer>
  );
}
