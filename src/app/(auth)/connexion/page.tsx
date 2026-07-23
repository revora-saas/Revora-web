import { Suspense } from "react";
import { ConnexionClient } from "@/components/auth/ConnexionClient";

export const metadata = { title: "Connexion" };

export default function PageConnexion() {
  return (
    <Suspense>
      <ConnexionClient />
    </Suspense>
  );
}
