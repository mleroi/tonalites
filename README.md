# Tonalités

Application Vue 3 + Vite, avec Tailwind CSS v4 et Tone.js.

## Prérequis

- Node.js (v22+ recommandé — testé avec v22.23.0)
- npm

## Installation

```bash
npm install
```

## Commandes utiles

### Serveur local de développement (avec hot reload / watch)

```bash
npm run dev
```

Lance le serveur de dev Vite sur `http://localhost:5173`. Le rechargement à chaud
est activé : toute modification d'un fichier source est reflétée automatiquement.

> Note : le watcher utilise le polling (voir `vite.config.js`) car la limite
> `fs.inotify.max_user_watches` de la machine est saturée. Si le rechargement
> semble lent, c'est attendu.

### Build de production

```bash
npm run build
```

Génère les fichiers optimisés dans le dossier `dist/`.

### Prévisualiser le build de production en local

```bash
npm run preview
```

Sert le contenu de `dist/` localement pour vérifier le rendu de production
avant déploiement.

## Déploiement en production

> ⚠️ Aucun déploiement de production n'est encore configuré.

Pour déployer, générer d'abord le build (`npm run build`) puis servir le
contenu du dossier `dist/`. À compléter une fois la cible de prod choisie
(serveur web local, serveur distant via rsync/ssh, ou hébergeur géré).
