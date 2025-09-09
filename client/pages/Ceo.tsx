import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Ceo() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">CEO Performance Analysis</h1>
      <Card>
        <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
          <Avatar className="h-20 w-20"><AvatarImage src="https://i.pravatar.cc/160?img=1" /><AvatarFallback>ER</AvatarFallback></Avatar>
          <div>
            <div className="text-xl font-semibold">Dr. Evelyn Reed</div>
            <div className="text-muted-foreground">Chief Executive Officer at StockPulse AI</div>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Overall Rating Exceptional</Badge>
          <p className="max-w-3xl text-sm text-muted-foreground">Dr. Evelyn Reed is a visionary leader with a proven track record of driving innovation and company growth, leveraging advanced analytics and AI to disrupt traditional markets.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          ["Average Company Growth", "+22.5%"],
          ["Innovation Index", "9.2/10"],
          ["Strategic Vision Score", "8.9/10"],
        ].map(([k,v]) => (
          <Card key={k as string}>
            <CardContent className="p-6"><div className="text-muted-foreground text-sm">{k as string}</div><div className="text-2xl font-semibold">{v as string}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leadership Track Record</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2">Company</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Years</th>
                  <th className="text-left">Key Achievements</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tech Innovations Inc.', 'CEO', '2022 -', 'Average revenue growth during tenure; grew market cap; launched successful product lines.'],
                  ['Global Ventures Group', 'COO', '2010 - 2015', 'Streamlined operations; reduced costs by 15%; expanded into new markets.'],
                  ['Fintech Solutions Ltd.', 'Head of Product', '2005 - 2010', 'Developed award-winning fintech platform; increased user engagement by 50%.'],
                  ['Startup X', 'VP Engineering', '2000 - 2005', 'Built initial engineering team and infrastructure from scratch.'],
                ].map((r,i)=> (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r[0]}</td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leadership Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Dr. Reed is renowned for her transformative leadership, with strong emphasis on data-driven decision-making and empowering cross-functional teams. She champions continuous learning and strategic foresight, enabling organizations to anticipate market shifts and capitalize on emerging opportunities.</p>
          <p>Her ability to articulate a compelling vision and rally diverse stakeholders has been instrumental in her success.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Executive Peer Comparison</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          {["Emily Chen","David Lee","Sarah Miller"].map((n, i)=> (
            <div key={i} className="flex items-center gap-3 border rounded-md p-3">
              <img className="h-10 w-10 rounded-full" src={`https://i.pravatar.cc/100?img=${i+2}`} alt="" />
              <div className="text-sm"><div className="font-medium">{n}</div><div className="text-muted-foreground">Quantum Analytics</div></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
