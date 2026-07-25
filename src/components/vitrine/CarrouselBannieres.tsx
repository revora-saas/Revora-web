"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BANNIERES = [
  { src: "/bannieres/banniere-1.webp", alt: "Revora — système anti no-show : rappels, acompte et score de fiabilité" },
  { src: "/bannieres/banniere-2.webp", alt: "Revora — aperçu de l'application de gestion beauté" },
  { src: "/bannieres/banniere-3.webp", alt: "Revora — agenda et rendez-vous" },
  { src: "/bannieres/banniere-4.webp", alt: "Revora — suivi de l'activité" },
  { src: "/bannieres/banniere-5.webp", alt: "Revora — réservation et liste d'attente" },
  { src: "/bannieres/banniere-6.webp", alt: "Revora — l'espace pro tout-en-un" },
];

/**
 * Carrousel des bannières marketing (6 images). Défilement automatique doux,
 * navigation par flèches, points et glissement tactile. Respecte
 * prefers-reduced-motion (pas d'avance auto).
 */
export function CarrouselBannieres() {
  const [index, setIndex] = useState(0);
  const [pause, setPause] = useState(false);
  const startX = useRef<number | null>(null);
  const n = BANNIERES.length;

  const aller = (i: number) => setIndex((i + n) % n);

  useEffect(() => {
    if (pause) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 5000);
    return () => clearInterval(t);
  }, [pause, n]);

  return (
    <div
      className="relative w-full overflow-hidden bg-prune"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Bannières Revora"
      onPointerEnter={() => setPause(true)}
      onPointerLeave={() => setPause(false)}
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startX.current !== null) {
          const d = e.clientX - startX.current;
          if (d > 40) aller(index - 1);
          else if (d < -40) aller(index + 1);
        }
        startX.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {BANNIERES.map((b, i) => (
          <div key={b.src} className="relative aspect-[1672/941] w-full shrink-0 select-none">
            <Image
              src={b.src}
              alt={b.alt}
              fill
              draggable={false}
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Flèches (bureau) */}
      <button
        type="button"
        onClick={() => aller(index - 1)}
        aria-label="Bannière précédente"
        className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-prune backdrop-blur transition hover:bg-white sm:grid"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => aller(index + 1)}
        aria-label="Bannière suivante"
        className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-prune backdrop-blur transition hover:bg-white sm:grid"
      >
        <ChevronRight size={18} />
      </button>

      {/* Points */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {BANNIERES.map((b, i) => (
          <button
            key={b.src}
            type="button"
            onClick={() => aller(i)}
            aria-label={`Aller à la bannière ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
