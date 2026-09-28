# Suivi Relance Scan

App installable (PWA) qui réunit l'outil individuel et la vue collective de l'équipe :

- **Mon suivi** : liste des patients à contacter + export « scan yesterday » → dashboard → « Ajouter à l'historique ».
  L'historique est enregistré directement dans le dossier Google Drive partagé (un fichier `history-<personne>.json` par personne,
  plus les fichiers d'origine en `source-…`).
- **Tendances** : taux de scan par jour, commitment level, fiche docteur, top docteurs Scan rookie/NSPTM, Aircall, comparaison.
- **Équipe** (managers et admins) : comparaison entre équipes, détail par CX, fichiers de données, gestion des équipes/rôles (admin).

## Rôles

| Rôle | Tendances | Onglet Équipe | Gestion |
|---|---|---|---|
| CX | ses données + moyenne de son équipe (sans nom de collègue) | — | — |
| Manager | ses données, n'importe quelle équipe, toutes les équipes, détail par CX | oui | — |
| Admin | idem manager | oui | équipes, rôles, fichiers |

Les rôles se règlent dans Équipe → « Gérer les équipes et les rôles ». L'admin fixe est défini dans `app.js` (`ADMIN_EMAILS`).
Les rôles règlent l'affichage : toute personne ayant accès au dossier Drive peut techniquement en ouvrir les fichiers.

## Fichiers

- `index.html` — structure de la page
- `styles.css` — styles
- `i18n.js` — textes FR/EN et changelogs
- `app.js` — logique (croisement des fichiers, historique Drive, tendances, rôles)
- `manifest.webmanifest`, `icons/`, `sw.js` — installation en app et cache hors ligne (fichiers de l'app uniquement)
- `legacy/` — copies intactes des deux outils d'origine (non publiées)

## Déploiement

Chaque push sur `main` ou `claude/nice-lovelace-689jsr` publie le site sur GitHub Pages via `.github/workflows/pages.yml` :
`https://mherberger-sys.github.io/Scan-Reminder-Tracking/`

Prérequis Google Cloud : `https://mherberger-sys.github.io` dans les *Authorized JavaScript origins* du client OAuth.
