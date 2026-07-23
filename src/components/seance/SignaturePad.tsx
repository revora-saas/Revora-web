"use client";

import { useRef, useState } from "react";

/** Capture de signature manuscrite sur écran (souris ou tactile). */
export function SignaturePad({ onSigne }: { onSigne: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dessine = useRef(false);
  const [vide, setVide] = useState(true);

  function position(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function debut(e: React.PointerEvent<HTMLCanvasElement>) {
    dessine.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = position(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function trace(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dessine.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = position(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0b1020";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setVide(false);
  }

  function fin() {
    dessine.current = false;
    if (!vide && canvasRef.current) onSigne(canvasRef.current.toDataURL("image/png"));
  }

  function effacer() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setVide(true);
    onSigne(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        onPointerDown={debut}
        onPointerMove={trace}
        onPointerUp={fin}
        onPointerLeave={fin}
        className="w-full touch-none rounded-[var(--radius-md)] border border-perle bg-white"
      />
      <button type="button" onClick={effacer} className="self-start text-sm text-ink/50 hover:underline">
        Effacer
      </button>
    </div>
  );
}
