import Link from "next/link";
import { redirect } from "next/navigation";
import { Phone, MessageSquare } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { listerRelances } from "@/app/(app)/clientes/actions";

export const metadata = { title: "Relances" };

export default async function PageRelances() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");
  const relances = await listerRelances();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Relances</h1>
      <p className="mb-4 text-sm text-ink/60">
        Clientes dont la prochaine visite estimée est dépassée.
      </p>

      {relances.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Aucune relance à faire. 🎉</p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {relances.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3">
              <Link href={`/clientes/${r.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{r.nom}</p>
                <p className="text-sm text-ink/50">
                  En retard de {r.joursRetard} jour{r.joursRetard > 1 ? "s" : ""}
                </p>
              </Link>
              {r.tel && (
                <div className="flex items-center gap-2">
                  <a href={`tel:${r.tel}`} className="rounded-full border border-perle p-2 text-ink/60 hover:text-ink" aria-label="Appeler">
                    <Phone size={16} />
                  </a>
                  <a href={`sms:${r.tel}`} className="rounded-full border border-perle p-2 text-ink/60 hover:text-ink" aria-label="Message">
                    <MessageSquare size={16} />
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
