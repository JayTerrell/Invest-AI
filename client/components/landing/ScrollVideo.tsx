import { MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Scroll-driven cinematic video background.
 *
 * The playhead is bound to page-scroll progress, but two things make it read
 * as smooth "flow" rather than twitch:
 *
 *  1. It is fed RAW scroll progress (monotonic), never a spring — a spring
 *     overshoots and oscillates on settle, and every wobble becomes a
 *     backward/forward seek that looks like jitter.
 *  2. A new seek is only issued once the previous one has finished
 *     (`!video.seeking`). Seeking a compressed video is asynchronous; firing a
 *     seek every animation frame piles them up and thrashes the decoder.
 *     Letting each seek complete turns "60 aborted seeks/sec" into as many
 *     exact frames as the decoder can actually present.
 *
 * `sources` are tried in order; put a self-hosted file first and a CDN copy
 * after it. For the smoothest possible scrub, the self-hosted file should be
 * encoded all-intra (every frame a keyframe) — see the note in the repo.
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
    if (!v) return;

    v.pause();

    // Prime the decode pipeline: some mobile browsers (iOS Safari) won't paint
    // a new frame on a currentTime change until the element has played once.
    const prime = () => {
      v.play()
        .then(() => v.pause())
        .catch(() => {});
    };
    if (v.readyState >= 2) prime();
    else v.addEventListener("loadeddata", prime, { once: true });

    if (!active) {
      try {
        v.currentTime = 0;
      } catch {
        /* metadata not ready yet */
      }
      return () => v.removeEventListener("loadeddata", prime);
    }

    let raf = 0;
    let smoothed = -1;

    const step = () => {
      const dur = v.duration;
      if (Number.isFinite(dur) && dur > 0 && v.readyState >= 1) {
        const progress = Math.min(0.9995, Math.max(0, scroll.get()));
        const target = progress * dur;
        if (smoothed < 0) smoothed = target; // seed on first valid frame

        // single, light smoothing so the playhead tracks the finger closely
        smoothed += (target - smoothed) * 0.2;

        // only seek when idle, and only past ~half a source-frame of drift,
        // so we never re-seek to a position we're effectively already at
        if (!v.seeking && Math.abs(smoothed - v.currentTime) > 1 / 48) {
          try {
            v.currentTime = smoothed;
          } catch {
            /* transient */
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadeddata", prime);
    };
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
