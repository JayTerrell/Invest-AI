import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Watchlist() {
  const rows = [
    { t: "AAPL", c: "Apple Inc.", p: "$175.84", ch: "+1.24%", a: "Active" },
    { t: "MSFT", c: "Microsoft Corp.", p: "$420.10", ch: "-0.36%", a: "No Alerts" },
    { t: "GOOGL", c: "Alphabet Inc. (Class A)", p: "$153.28", ch: "+0.49%", a: "Active" },
    { t: "NVDA", c: "NVIDIA Corp.", p: "$950.30", ch: "+1.29%", a: "No Alerts" },
    { t: "AMZN", c: "Amazon.com Inc.", p: "$180.55", ch: "-0.50%", a: "Active" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Watchlist and Alerts</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">My Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 text-left">Ticker</th>
                    <th className="text-left">Company</th>
                    <th className="text-left">Price</th>
                    <th className="text-left">Change</th>
                    <th className="text-left">Alerts</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.t} className="border-b last:border-0">
                      <td className="py-3 font-medium">{r.t}</td>
                      <td>{r.c}</td>
                      <td>{r.p}</td>
                      <td className={r.ch.startsWith("-") ? "text-red-600" : "text-emerald-600"}>{r.ch}</td>
                      <td>{r.a}</td>
                      <td className="text-muted-foreground">✎ 🗑</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Stock & Set Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="e.g., TSLA, BTC-USD" />
              <Button>Add</Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">
                <span className="text-muted-foreground">Select Stock</span>
                <select className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm">
                  {rows.map((r) => (
                    <option key={r.t}>{r.t}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted-foreground">Alert Type</span>
                <select className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option>Price crosses above</option>
                  <option>Price crosses below</option>
                  <option>Percent change</option>
                </select>
              </label>
              <Button className="mt-2 w-full">Create Alert</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
