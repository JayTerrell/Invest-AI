import { MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Scroll-driven cinematic video background.
 *
 * The video never free-plays: its playhead is bound to page scroll, smoothed
 * through an exponential follower so scrubbing feels weighted rather than
 * twitchy. Works on iOS (muted + playsInline allows programmatic seeking
 * without a user gesture).
 *
 * `sources` are tried in order by the browser — put a self-hosted file first
 * and a CDN copy after it, so deploys work before the asset is vendored.
 */
export function ScrollVideo({
  scroll,
  sources,
  className,
  active = true,
}: {
  scroll: MotionValue<number>;
  sources: string[];
  className?: string;
  /** When false (e.g. prefers-reduced-motion), holds the first frame. */
  active?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;

    let raf = 0;
    let current = 0;

    const tick = () => {
      const duration = v.duration;
      if (Number.isFinite(duration) && duration > 0 && v.readyState >= 2) {
        // leave a small tail so we never seek to the exact end (black frame risk)
        const target = scroll.get() * (duration - 0.08);
        current += (target - current) * 0.085;
        if (Math.abs(current - v.currentTime) > 0.002) {
          v.currentTime = current;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scroll, active]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    >
      {sources.map((src) => (
        <source key={src} src={src} type="video/mp4" />
      ))}
    </video>
  );
}
