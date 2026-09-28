# Suivi Relance Scan — Collab

Vue collective des exports JSON de l'outil individuel, stockés dans un dossier Google Drive partagé.
L'app est une page statique installable (PWA) : aucun serveur, aucune base de données.

## Déploiement

Chaque push sur `main` déclenche `.github/workflows/pages.yml`, qui publie le site sur GitHub Pages :
`https://mherberger-sys.github.io/Scan-Reminder-Tracking/`

Une seule fois :
1. **Settings → Pages → Build and deployment → Source : GitHub Actions.**
2. **Google Cloud Console → APIs & Services → Credentials →** le client OAuth
   `464525857093-…` **→ Authorized JavaScript origins :** ajouter `https://mherberger-sys.github.io`.
   Sans ça, la connexion Google échoue (`origin_mismatch`).

## Installer en app

- **Chrome / Edge (ordinateur)** : icône « Installer » dans la barre d'adresse.
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».
- **iPhone / iPad (Safari)** : Partager → « Sur l'écran d'accueil ».

## Fichiers

- `index.html` — l'application
- `manifest.webmanifest`, `icons/` — métadonnées d'installation
- `sw.js` — service worker (met en cache uniquement les fichiers de l'app ; les appels Google/Drive passent toujours par le réseau)
