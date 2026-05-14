"use client";

import { useEffect, useRef } from "react";

const NODE_COUNT = 45;
const CONNECTION_DIST = 100;
const SPEED = 0.4;
const NODE_RGB = [206, 90, 58] as const;

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export function ConnectedCircles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let animId = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas!.width = W;
      canvas!.height = H;
    }

    resize();

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: 1.5 + Math.random() * 2,
    }));

    if (prefersReduced) {
      drawStatic(ctx, nodes, W, H);
      return;
    }

    function frame() {
      ctx!.clearRect(0, 0, W, H);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            const alpha = 0.12 * (1 - dist / CONNECTION_DIST);
            ctx!.strokeStyle = `rgba(${NODE_RGB[0]},${NODE_RGB[1]},${NODE_RGB[2]},${alpha})`;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${NODE_RGB[0]},${NODE_RGB[1]},${NODE_RGB[2]},0.22)`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(frame);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
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

function drawStatic(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECTION_DIST) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const alpha = 0.08 * (1 - dist / CONNECTION_DIST);
        ctx.strokeStyle = `rgba(${NODE_RGB[0]},${NODE_RGB[1]},${NODE_RGB[2]},${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }
  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${NODE_RGB[0]},${NODE_RGB[1]},${NODE_RGB[2]},0.18)`;
    ctx.fill();
  }
}
