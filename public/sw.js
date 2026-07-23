// Service worker Revora — cache du shell, consultation hors-ligne, push.
const CACHE = "revora-v1";
const SHELL = ["/hors-ligne", "/icones/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Ressources statiques : cache d'abord.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icones")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((r) => {
            const copie = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
            return r;
          }),
      ),
    );
    return;
  }

  // Navigations (pages) : réseau d'abord, repli sur le cache, puis page hors-ligne.
  // Permet de consulter l'agenda du jour déjà visité sans connexion.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copie = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
          return r;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/hors-ligne"))),
    );
  }
});

// Notifications push (nouveaux rendez-vous, annulations).
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = {};
  }
  const titre = data.title || "Revora";
  e.waitUntil(
    self.registration.showNotification(titre, {
      body: data.body || "",
      icon: "/icones/icon-192.png",
      badge: "/icones/icon-192.png",
      data: data.url || "/tableau-de-bord",
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return clients.openWindow(e.notification.data || "/tableau-de-bord");
    }),
  );
});
