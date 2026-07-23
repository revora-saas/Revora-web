import { Card, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";

/**
 * Tableau de bord de l'application authentifiée (groupe de routes "app").
 * Placeholder d'initialisation : les widgets adaptatifs sont construits au prompt 12.
 * L'accès sera protégé par l'authentification (prompt 02).
 */
export default function TableauDeBord() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Tableau de bord
        </h1>
        <Badge ton="primaire">En construction</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Rendez-vous du jour</CardTitle>
            <CardDescription>À construire (prompt 07)</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recette du jour</CardTitle>
            <CardDescription>À construire (prompt 11)</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Relances à faire</CardTitle>
            <CardDescription>À construire (prompt 09)</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
