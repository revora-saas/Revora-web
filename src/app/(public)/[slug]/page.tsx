import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";

/**
 * Page de réservation publique d'un établissement (groupe de routes "public").
 * URL : revora.fr/<slug> — voir etablissements.slug dans le schéma.
 * Placeholder d'initialisation : la réservation cliente est construite au prompt 08.
 * La cliente ne crée jamais de compte (R7.1).
 *
 * Next.js 16 : params est asynchrone.
 */
export default async function ReservationPublique({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Réservation en ligne</CardTitle>
          <CardDescription>
            Établissement « {slug} » — page à construire (prompt 08).
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-ink/60">
          Ici, la cliente choisira une prestation puis un créneau réel, sans
          créer de compte.
        </p>
      </Card>
    </main>
  );
}
