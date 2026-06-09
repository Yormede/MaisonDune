# Maison Dune

Site vitrine statique pour Maison Dune.

## Lancer en local

```bash
python -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Assets

Les images de marque, photos produit et visuels privés ne sont pas versionnés dans ce dépôt public.
Voir `assets/README.md` pour les noms de fichiers attendus par le site.

## Déploiement

Le dossier `deploy/` contient un déploiement Docker/Nginx pour homelab.

1. Copier `deploy/.env.example` vers `deploy/.env`.
2. Remplir les valeurs privées dans `deploy/.env`.
3. Lancer `deploy/deploy.bat`.

Le fichier `.env` est ignoré par Git.

## Roadmap

Voir `ROADMAP.md`.
