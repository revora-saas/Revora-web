"use client";

import { useEffect, useRef } from "react";

/**
 * Apparition douce au défilement. N'utilise pas de state React (on bascule
 * une classe CSS via la ref) pour rester léger et compatible SSR.
 * Respecte prefers-reduced-motion via la feuille de styles (.v-reveal).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("is-visible");
            obs.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={`v-reveal ${className}`}>
      {children}
    </Component>
  );
}
