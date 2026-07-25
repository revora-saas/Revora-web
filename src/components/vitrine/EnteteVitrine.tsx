"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoRevora } from "./LogoRevora";

const LIENS = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/metiers", label: "Métiers" },
  { href: "/tarifs", label: "Tarifs" },
];

/** Header vitrine clair et compact, sticky. Menu hamburger sur mobile. */
export function EnteteVitrine() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-bordure/70 bg-ivoire/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Accueil Revora" onClick={() => setOuvert(false)}>
          <LogoRevora />
        </Link>

        {/* Navigation bureau */}
        <nav className="hidden items-center gap-8 md:flex">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-taupe transition-colors hover:text-prune"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/connexion"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-prune transition-colors hover:bg-lavande-clair md:inline-flex"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="inline-flex h-11 items-center justify-center rounded-full bg-violet px-5 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgb(118_86_201_/_0.6)] transition-colors hover:bg-violet-600"
          >
            Essayer gratuitement
          </Link>
          {/* Bouton menu mobile */}
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={ouvert}
            className="grid h-11 w-11 place-items-center rounded-full text-prune transition-colors hover:bg-lavande-clair md:hidden"
          >
            {ouvert ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Panneau mobile */}
      {ouvert && (
        <nav className="border-t border-bordure/70 bg-ivoire px-5 py-3 md:hidden">
          <ul className="flex flex-col">
            {LIENS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOuvert(false)}
                  className="flex min-h-11 items-center text-[15px] font-medium text-prune"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/connexion"
                onClick={() => setOuvert(false)}
                className="flex min-h-11 items-center text-[15px] font-medium text-prune"
              >
                Se connecter
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
