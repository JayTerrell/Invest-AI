import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Donut() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-52">
      <circle cx="60" cy="60" r="40" stroke="#e5e7eb" strokeWidth="20" fill="none" />
      <circle cx="60" cy="60" r="40" stroke="hsl(var(--primary))" strokeWidth="20" fill="none" strokeDasharray="150 100" strokeLinecap="round" transform="rotate(-90 60 60)" />
    </svg>
  );
}

function Trend() {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-52">
      <path d="M0 140 C 60 120, 120 110, 180 130 S 300 150, 360 135 480 130, 600 140" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
}

export default function News() {
  const articles = [
    { t: 'Tech Giant Reports Strong Q3 Earnings, Exceeding Expectations', s: 'Financial Times • 2 hours ago', sentiment: 'Positive' },
    { t: 'New Regulations Threaten Pharmaceutical Sector Profits', s: 'Bloomberg • 5 hours ago', sentiment: 'Negative' },
    { t: 'Automotive Innovator Unveils Breakthrough in EV Battery Technology', s: 'Reuters • 8 hours ago', sentiment: 'Positive' },
    { t: 'Supply Chain Disruptions Continue to Plague Retail Sector', s: 'The Wall Street Journal • 1 day ago', sentiment: 'Negative' },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">News and Sentiment Analysis</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Polarity</CardTitle>
          </CardHeader>
          <CardContent><Donut /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popularity Trend</CardTitle>
          </CardHeader>
          <CardContent><Trend /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Stock Ticker (e.g., MSFT)" />
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm">
              <option>All</option>
              <option>Positive</option>
              <option>Neutral</option>
              <option>Negative</option>
            </select>
            <Button>Apply Filters</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Latest News Articles</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {articles.map((a, i)=> (
            <div key={i} className="rounded-md border p-4">
              <div className="font-medium mb-1">{a.t}</div>
              <div className="text-sm text-muted-foreground mb-2">{a.s}</div>
              <span className={"text-xs px-2 py-1 rounded-full " + (a.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : a.sentiment === 'Neutral' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700')}>{a.sentiment}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Media Insights</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          {[1,2,3,4].map((i)=> (
            <div key={i} className="rounded-md border p-4">
              <div className="flex items-center gap-3 mb-2"><div className="h-9 w-9 rounded-full bg-muted" /><div><div className="font-medium">FinGuru</div><div className="text-muted-foreground">Twitter</div></div></div>
              <p>Just bought more $AAPL! New product releases looking great this quarter. #investing #stocks</p>
              <div className="mt-3 text-muted-foreground">1245 ❤️ 78 💬 32 ↩️</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
