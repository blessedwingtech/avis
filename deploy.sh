#!/bin/bash
# ==============================================================================
# Script de déploiement en production pour Avis-Hub (avis.bittonik.com)
# ==============================================================================

set -e

echo "?? Début du déploiement Avis-Hub..."

# 1. Récupération des dernières modifications Git
echo "?? Récupération du code source le plus récent..."
git pull origin main

# 2. Construction et redémarrage des conteneurs Docker
echo "?? Construction et démarrage des conteneurs Docker..."
docker compose up -d --build --remove-orphans

# 3. Nettoyage des anciennes images Docker
echo "?? Nettoyage des anciennes images Docker inutilisées..."
docker image prune -f

# 4. Vérification de l'état des conteneurs
echo "?? Vérification du statut des conteneurs :"
docker compose ps

echo "? Déploiement terminé avec succès ! Avis-Hub tourne sur le port 3006."
