"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Euro,
  Tag,
  Package,
  LineChart,
  Bell,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";
import { deconnexion } from "@/app/(auth)/actions";

type Lien = { href: string; label: string; icone: typeof Home };

/**
 * Navigation de l'application : liens principaux (bureau) avec état actif,
 * et barre d'onglets mobile à 5 entrées (Accueil, Agenda, Clients, Caisse,
 * Plus). « Plus » ouvre un tiroir vers les sections secondaires. Présentation
 * uniquement — aucune logique de données.
 */
export function NavApp({ motClient }: { motClient: string }) {
  const pathname = usePathname();
  const [plus, setPlus] = useState(false);

  const nomClient = motClient.charAt(0).toUpperCase() + motClient.slice(1);

  const principaux: Lien[] = [
    { href: "/tableau-de-bord", label: "Accueil", icone: Home },
    { href: "/agenda", label: "Agenda", icone: Calendar },
    { href: "/clientes", label: nomClient, icone: Users },
    { href: "/catalogue", label: "Catalogue", icone: Tag },
    { href: "/caisse", label: "Caisse", icone: Euro },
    { href: "/stock", label: "Stock", icone: Package },
    { href: "/finance", label: "Finance", icone: LineChart },
  ];

  const secondaires: Lien[] = [
    { href: "/catalogue", label: "Catalogue", icone: Tag },
    { href: "/stock", label: "Stock", icone: Package },
    { href: "/finance", label: "Statistiques", icone: LineChart },
    { href: "/relances", label: "Relances", icone: Bell },
    { href: "/reglages", label: "Réglages", icone: Settings },
  ];

  const actif = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const plusActif = secondaires.some((l) => actif(l.href));

  return (
    <>
      {/* Liens principaux — bureau */}
      <nav className="hidden items-center gap-1 md:flex">
        {principaux.map((l) => {
          const a = actif(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={a ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                a ? "bg-primary-50 text-primary" : "text-ink/60 hover:bg-surface-muted hover:text-ink"
              }`}
            >
              <l.icone size={16} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Barre d'onglets — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-perle bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg">
          <Onglet href="/tableau-de-bord" label="Accueil" icone={Home} actif={actif("/tableau-de-bord")} />
          <Onglet href="/agenda" label="Agenda" icone={Calendar} actif={actif("/agenda")} />
          <Onglet href="/clientes" label={nomClient} icone={Users} actif={actif("/clientes")} />
          <Onglet href="/caisse" label="Caisse" icone={Euro} actif={actif("/caisse")} />
          <button
            type="button"
            onClick={() => setPlus(true)}
            aria-haspopup="dialog"
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              plusActif ? "text-primary" : "text-ink/55"
            }`}
          >
            <MoreHorizontal size={22} />
            Plus
          </button>
        </div>
      </nav>

      {/* Tiroir « Plus » — mobile */}
      {plus && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Plus">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setPlus(false)}
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] border-t border-perle bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-perle" />
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-heading text-base font-semibold text-ink">Menu</p>
              <button
                type="button"
                onClick={() => setPlus(false)}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {secondaires.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setPlus(false)}
                  className="flex flex-col items-center gap-2 rounded-[16px] border border-perle bg-surface-muted/40 px-2 py-4 text-center"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-50 text-primary">
                    <l.icone size={18} />
                  </span>
                  <span className="text-xs font-medium text-ink">{l.label}</span>
                </Link>
              ))}
            </div>
            <form action={deconnexion} className="mt-3">
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-perle text-sm font-medium text-ink/70"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Onglet({
  href,
  label,
  icone: Icone,
  actif,
}: {
  href: string;
  label: string;
  icone: typeof Home;
  actif: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium capitalize transition-colors ${
        actif ? "text-primary" : "text-ink/55"
      }`}
    >
      <Icone size={22} strokeWidth={actif ? 2.4 : 2} />
      {label}
    </Link>
  );
}
