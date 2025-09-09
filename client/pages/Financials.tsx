import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function Bars() {
  const vals = [42, 55, 48, 60, 52, 66, 58, 70];
  return (
    <div className="h-48 w-full flex items-end gap-2">
      {vals.map((v, i) => (
        <div key={i} className="flex-1 bg-primary/20 rounded" style={{ height: `${v}%` }} />
      ))}
    </div>
  );
}

function Line() {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-48">
      <path d="M0 150 C 80 120, 160 110, 240 130 S 400 140, 600 110" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      <path d="M0 160 C 80 140, 160 135, 240 145 S 400 150, 600 130" fill="none" stroke="#94a3b8" strokeWidth="2" opacity=".6" />
    </svg>
  );
}

export default function Financials() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Financial Statement Comparison</h1>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Comparison Controls</CardTitle>
          <CardDescription>Select Companies for Comparison and set filters</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-wrap gap-2">
            {['AAPL','MSFT','GOOGL'].map(tag => (
              <span key={tag} className="px-2 py-1 rounded-md bg-accent text-sm">{tag}</span>
            ))}
            <button className="px-3 py-2 border rounded-md">+ Add</button>
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Primary Metric<select className="mt-1 h-10 w-full rounded-md border px-2 text-sm"><option>Revenue</option><option>EPS</option></select></label>
            <label className="text-sm">Financial Period<select className="mt-1 h-10 w-full rounded-md border px-2 text-sm"><option>Last 4 Quarters</option><option>Last 8 Quarters</option></select></label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quarterly Financial Data</CardTitle>
          <CardDescription>Side-by-side of selected financial metrics over the last 8 quarters.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 text-left">Company / Quarter</th>
                  {['Q1 2023','Q2 2023','Q3 2023','Q4 2023','Q1 2024','Q2 2024','Q3 2024','Q4 2024'].map((q)=> (
                    <th key={q} className="text-left">{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['AAPL','MSFT','GOOGL'].map((co)=> (
                  <tr key={co} className="border-b last:border-0">
                    <td className="py-2 font-medium">{co}</td>
                    {Array.from({length:8}).map((_,i)=> (
                      <td key={i}>${(50 + Math.round(Math.random()*60))}.00B</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quarterly Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent><Bars /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">EPS Trend Comparison</CardTitle>
          </CardHeader>
          <CardContent><Line /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gross Profit Margin Trends</CardTitle>
          </CardHeader>
          <CardContent><Line /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Revenue growth for Apple Inc. has shown consistent upward momentum over the last 8 quarters, outpacing Alphabet Inc. in most periods. Gross Profit Margin for Microsoft remains strong relative to sector averages, driven by cloud transformation. Amazon shows an increase in operational costs as competitive pricing continues to pressure margins.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debt-to-Equity Ratio</CardTitle>
          </CardHeader>
          <CardContent><Bars /></CardContent>
        </Card>
      </div>
    </div>
  );
}
