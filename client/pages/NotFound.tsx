import { Hexagon } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary glow-primary mb-6">
        <Hexagon className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <h1 className="font-display text-6xl font-bold text-gradient">404</h1>
      <p className="mt-3 text-muted-foreground">
        This instrument isn't listed. The route you requested doesn't exist.
      </p>
      <Link
        to="/terminal"
        className="mt-8 inline-flex items-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all glow-primary"
      >
        Back to the Terminal
      </Link>
    </div>
  );
}
