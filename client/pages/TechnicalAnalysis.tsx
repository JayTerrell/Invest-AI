import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function LineChart() {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-56">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 140 C 60 130, 120 120, 180 110 S 300 100, 360 105 480 120, 600 115" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      <path d="M0 150 C 60 140, 120 135, 180 125 S 300 115, 360 120 480 130, 600 125" fill="none" stroke="#9CA3AF" strokeDasharray="4 4" />
      <path d="M0 120 C 60 110, 120 105, 180 95 S 300 85, 360 90 480 105, 600 100" fill="none" stroke="#9CA3AF" strokeDasharray="4 4" />
    </svg>
  );
}

export default function TechnicalAnalysis() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Technical Analysis Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Microsoft Corporation (MSFT)</CardTitle>
            <CardDescription>Daily Price Chart with 144 MA & Standard Deviation Bands</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-foreground inline-block"/>Price</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted inline-block"/>144 MA</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted inline-block"/>Lower Band</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted inline-block"/>Upper Band</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Gainers</CardTitle>
            <CardDescription>Performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm">
              {[
                { n: "Roma Green Finance Lim", t: "ROMA", p: "+50.53%", v: "$2.34" },
                { n: "YD Bio Limited Ordinary", t: "YDBS", p: "+28.35%", v: "$7.52" },
                { n: "Fury Gold Mines Limited", t: "FURY", p: "+21.49%", v: "$0.67" },
                { n: "Macy's, Inc.", t: "M", p: "+17.72%", v: "$15.88" },
                { n: "Beyond Meat, Inc.", t: "BYND", p: "+15.19%", v: "$7.20" },
              ].map((g) => (
                <li key={g.t} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.n}</div>
                    <div className="text-muted-foreground">{g.t}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{g.v}</div>
                    <div className="text-emerald-600">{g.p}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Technical Metrics</CardTitle>
            <CardDescription>Derived from historical data and MA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Avg. Time Deviation (MA)</span><span className="font-semibold">+3.5%</span></div>
            <div className="flex items-center justify-between"><span>Peak</span><span className="font-semibold">18 days</span></div>
            <div className="flex items-center justify-between"><span>Volatility Index (ATR)</span><span className="font-semibold">2.12</span></div>
            <div className="flex items-center justify-between"><span>Sustainability</span><Badge variant="secondary">High</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Profile</CardTitle>
            <CardDescription>Snapshot of key financial figures</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Market Cap", "$3.74T"],
              ["P/E Ratio", "36.87"],
              ["Prev Close", "$502.12"],
              ["52W Range", "$344.79"],
              ["Open", "$555.45"],
              ["Day Range", "$503.89"],
              ["Volume", "7.7M"],
              ["Dividend Yield", "0.66%"],
              ["EPS (TTM)", "$13.64"],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Developments</CardTitle>
            <CardDescription>Latest news and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { t: "Quarterly dividend payment approaches", h: "12 hours ago" },
              { t: "Federal contract saves billions", h: "6 hours ago" },
              { t: "AI stake acquisition discussions continue", h: "19 hours ago" },
            ].map((n, i) => (
              <div key={i}>
                <div className="font-medium">{n.t}</div>
                <div className="text-muted-foreground">{n.h}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
