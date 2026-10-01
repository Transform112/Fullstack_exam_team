import { Heart, Sparkles } from "lucide-react";
/** Editorial sample artwork; no remote images or real recipient data. */
export function CelebrationCard({ variant = "pastel-dream", name = "Riya", compact = false, occasion = "birthday" }: {
  variant?: string;
  name?: string;
  compact?: boolean;
  occasion?: string;
}) {
  return <div className={`celebration-card celebration-${variant} ${compact ? "celebration-compact" : ""}`}>
    <span className="card-kicker">TODAY IS ALL ABOUT YOU</span>
    <Sparkles className="card-sparkle" size={28} strokeWidth={1} aria-hidden />
    <div className="card-greeting">Happy<br />
      <em>{occasion},</em>
      <br />
      <strong>{name}.</strong>
    </div>
    <div className="cake-art" aria-hidden>
      <span className="candle" />
      <span className="cake-top" />
      <span className="cake-base" />
      <span className="cake-plate" />
    </div>
    <p>Here’s to all the little things<br />that make you, you.</p>
    <div className="card-signature">
      <Heart size={12} /> MADE WITH LOVE, JUST FOR YOU</div>
  </div>;
}
