"use client";

import { useEffect, useRef } from "react";

const RGB = [206, 90, 58] as const;
const RING_INTERVAL = 1500;
const RING_DURATION = 5000;
const MAX_RADIUS_RATIO = 0.7;

export function RadarPing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let W = 0;
    let H = 0;
    let animId = 0;
    let lastRing = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas!.width = W;
      canvas!.height = H;
    }

    resize();

    interface Ring {
      born: number;
    }

    const rings: Ring[] = [];

    if (prefersReduced) {
      drawStatic(ctx, W, H);
      window.addEventListener("resize", () => {
        resize();
        drawStatic(ctx!, W, H);
      });
      return;
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, W, H);

      if (now - lastRing > RING_INTERVAL) {
        rings.push({ born: now });
        lastRing = now;
      }

      const cx = W / 2;
      const cy = H / 2;
      const maxR = Math.min(W, H) * MAX_RADIUS_RATIO;

      for (let i = rings.length - 1; i >= 0; i--) {
        const age = now - rings[i].born;
        if (age > RING_DURATION) {
          rings.splice(i, 1);
          continue;
        }
        const t = age / RING_DURATION;
        const r = t * maxR;
        const alpha = 0.27 * (1 - t);

        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${alpha})`;
        ctx!.lineWidth = 2.5 * (1 - t);
        ctx!.stroke();
      }

      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},0.4)`;
      ctx!.fill();

      animId = requestAnimationFrame(frame);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastRing = performance.now();
        animId = requestAnimationFrame(frame);
      }
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}

function drawStatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * MAX_RADIUS_RATIO;
  for (let i = 0; i < 3; i++) {
    const r = maxR * (0.25 + i * 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${0.15 - i * 0.035})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${RGB[0]},${RGB[1]},${RGB[2]},0.3)`;
  ctx.fill();
}
