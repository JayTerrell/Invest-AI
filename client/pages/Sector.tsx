import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function Radar() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-52">
      <polygon points="100,20 180,70 150,180 50,180 20,70" fill="hsl(var(--primary) / .15)" stroke="hsl(var(--primary))" />
      <polygon points="100,30 170,75 145,170 55,170 30,75" fill="#94a3b8" opacity=".2" stroke="#94a3b8" />
    </svg>
  );
}

function Line() {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-44">
      <path d="M0 150 C 100 120, 200 130, 300 125 S 500 110, 600 140" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
}

export default function Sector() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sector Performance Analysis and Benchmarking</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sector Overview</CardTitle>
          <CardDescription>The Technology sector typically exhibits high growth potential, driven by innovation and R&D.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            ["Avg. RSI (14-day)", "62.5", "+1.2"],
            ["Avg. Volatility", "2.1%", "+0.3%"],
            ["Momentum Score", "8.1/10", "+0.5"],
            ["Relative Strength", "1.25", "+0.02"],
            ["Avg. P/E Ratio", "35.2x", "-1.1x"],
            ["Avg. Revenue Growth", "18.5%", "+0.7%"],
            ["Avg. Net Profit Margin", "14.3%", "+0.2%"],
            ["Avg. Debt/Equity", "0.85", "-0.05"],
          ].map(([k, v, d]) => (
            <div key={k as string} className="rounded-md border p-3">
              <div className="text-muted-foreground">{k as string}</div>
              <div className="flex items-baseline gap-2"><span className="text-xl font-semibold">{v as string}</span><span className="text-emerald-600 text-sm">{d as string}</span></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Stock Benchmarking against Technology</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Price Performance</div>
              <Line />
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Fundamental Comparison (Normalized)</div>
              <Radar />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top/Bottom Stocks in Technology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["NVIDIA Corp", "+3.5%"],
              ["Microsoft Corp", "+1.2%"],
              ["Tesla Inc", "-0.8%"],
              ["Apple Inc", "+0.5%"],
              ["Amazon.com Inc", "-0.2%"],
            ].map(([n,p]) => (
              <div key={n as string} className="flex items-center justify-between">
                <span>{n as string}</span>
                <span className={(p as string).startsWith('-')? 'text-red-600':'text-emerald-600'}>{p as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
