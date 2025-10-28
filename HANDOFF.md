# Handoff Documentation - URL Shortener

## 1. Comment exécuter

### Prérequis

- Node.js v20.19+ ou v22.12+ (testé avec v22.5.1, warnings mineurs mais fonctionnel)
- npm v10+

### Installation

```bash
# Installer toutes les dépendances (root, client, server)
npm run install:all
```

### Démarrage

**Option 1 : Tout en même temps (recommandé pour la production)**

```bash
npm run dev
```

**Option 2 : Démarrage séparé (recommandé pour le développement)**

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### URLs d'accès

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001

---

## 2. Comment tester

### Tests manuels - Frontend

1. Ouvrir http://localhost:3000 dans un navigateur
2. Entrer une URL longue (ex: `https://www.google.com/search?q=test`)
3. Cliquer sur "Shorten"
4. Vérifier que l'URL raccourcie s'affiche
5. Cliquer sur l'URL raccourcie pour tester la redirection
6. Tester le bouton "Copy"

### Tests manuels - API Backend

**Créer une URL raccourcie :**

```bash
curl -X POST http://localhost:3001/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.example.com"}'
```

Réponse attendue :

```json
{
  "shortCode": "1",
  "shortUrl": "http://localhost:3001/1",
  "originalUrl": "https://www.example.com",
  "createdAt": "2025-10-28T..."
}
```

**Récupérer les infos d'une URL :**

```bash
curl http://localhost:3001/api/urls/1
```

Réponse :

```json
{
  "shortCode": "1",
  "originalUrl": "https://www.example.com",
  "createdAt": "2025-10-28T...",
  "clicks": 0
}
```

**Tester la redirection :**

```bash
curl -I http://localhost:3001/1
# Devrait retourner un 302 Found vers l'URL originale
```

### Tests des cas d'erreur

**URL vide :**

```bash
curl -X POST http://localhost:3001/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":""}'
# → 400 Bad Request: "URL cannot be empty"
```

**URL invalide :**

```bash
curl -X POST http://localhost:3001/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"not-a-url"}'
# → 400 Bad Request: "Invalid URL format"
```

**Protocole non supporté :**

```bash
curl -X POST http://localhost:3001/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"ftp://example.com"}'
# → 400 Bad Request: "URL must use http or https protocol"
```

**Code court inexistant :**

```bash
curl http://localhost:3001/xyz999
# → 404 Not Found: "Short URL not found"
```

---

## 3. Détails d'implémentation

### Architecture

```
server/src/
├── models/
│   └── UrlEntry.ts          # Interface TypeScript pour les URLs
├── services/
│   ├── UrlStore.ts          # Stockage en mémoire
│   └── UrlService.ts        # Logique métier
├── routes/
│   └── urls.ts              # Routes API Express
├── utils/
│   ├── base62.ts            # Encodage base62
│   └── validation.ts        # Validation d'URLs
└── index.ts                 # Point d'entrée + redirection
```

### Décisions clés

**Génération des codes courts :**

- Méthode : Compteur incrémental + encodage base62
- Caractères : 0-9, a-z, A-Z
- Exemples : 1 → "1", 62 → "10", 100 → "1C"
- Avantage : Aucune collision, codes très courts au début
- Trade-off accepté : Prédictible

**Stockage :**

- Structure : `Map<string, UrlEntry>` en mémoire
- Lookup O(1) pour performance optimale
- Trade-off : Données perdues au redémarrage

**Validation :**

- Classe native `URL` de JavaScript
- Protocoles acceptés : http et https uniquement
- localhost accepté

**API Design :**

- `POST /api/urls` : Créer une URL (201 Created)
- `GET /api/urls/:shortCode` : Récupérer infos + compteur clics (200 OK)
- `GET /:shortCode` : Redirection 302 (pas sous /api pour URLs courtes)

**Frontend :**

- React avec hooks
- Fetch API native
- États gérés : idle, loading, success, error
- CSS vanilla
- **React Router** : Gestion du routing pour les URLs raccourcies
  - Route `/` : Formulaire principal
  - Route `/:shortCode` : Redirection automatique ou page 404
  - Amélioration UX : feedback visuel pendant la redirection

---

## 4. Limitations connues

### Fonctionnelles

1. **Stockage en mémoire** : Les URLs sont perdues au redémarrage du serveur

   - Acceptable pour le MVP selon les exigences
   - Production nécessiterait une base de données

2. **Pas de détection de duplicatas** : La même URL peut générer plusieurs codes courts

   - Comportement identique à bit.ly et TinyURL
   - Simplifie l'implémentation (pas de recherche inverse nécessaire)

3. **Codes prédictibles** : Les codes sont séquentiels (1, 2, 3, a, b, c...)

   - Révèle le nombre total d'URLs créées
   - Production nécessiterait un élément aléatoire

### Techniques

4. **Pas de persistence** : Redémarrage = perte de données
5. **Pas de rate limiting** : Vulnérable aux abus
6. **Pas de validation DNS** : Ne vérifie pas que le domaine existe
7. **Pas de détection de liens malveillants** : Pas d'intégration avec Google Safe Browsing

---

## 5. Considérations de production

### Sécurité

- **Rate limiting** : Ajouter express-rate-limit pour prévenir les abus
- **Validation renforcée** : Vérifier l'existence des domaines
- **Détection malware** : Intégrer Google Safe Browsing API
- **CORS** : Configurer les origines autorisées

### Performance

- **Base de données** : Migrer vers une base de données avec index sur `shortCode`
- **Cache** : Ajouter Redis pour les redirections
- **Horizontal scaling** : Partager le compteur entre instances

### Fiabilité

- **Monitoring** : Ajouter logging structuré
- **Tests automatisés** : tests unitaires, end to end

### Fonctionnalités

- **Codes personnalisés** : Permettre `example.com/my-link` au lieu de `example.com/abc`
- **Expiration** : URLs temporaires avec TTL
- **Analytics avancées** : Géolocalisation, référents, user-agents
- **Dashboard** : Interface pour voir toutes les URLs créées
- **API d'authentification** : Limiter la création aux utilisateurs authentifiés

### Architecture

- **Monorepo** : Next.js pour unifier frontend + backend
- **TypeScript strict** : Activer `strict: true` dans tsconfig
- **Validation schema** : Zod ou Yup pour valider les inputs
- **ORM** : Prisma ou TypeORM pour la gestion de base de données

---

## 6. Améliorations futures

### Court terme (< 1 semaine)

1. **Élément aléatoire dans les codes** : Compteur + salt pour masquer la séquence
2. **Endpoint de statistiques** : `GET /api/stats` avec total URLs, total clics
3. **Validation améliorée** : Vérifier longueur max d'URL (2048 chars)
4. **Meilleure UX** : Toast notifications au lieu d'alerts
5. **Tests automatisés** : Couvrir les cas principaux

### Moyen terme (1-4 semaines)

1. **Base de données ** : Migration complète
2. **Cache Redis** : Pour les redirections
3. **QR Code** : Générer un QR code pour chaque URL
4. **API REST complète** : PATCH, DELETE endpoints
5. **Dashboard analytics** : Graphiques de clics par jour

### Long terme (> 1 mois)

1. **Architecture microservices** : Séparer création / redirection
2. **Machine learning** : Détection de spam/malware
3. **Custom domains** : Permettre `mybrand.short/xyz`
4. **API publique** : Authentification OAuth2, rate limiting par tier

---

## Notes supplémentaires

**Temps de développement** : ~2h

**Stack utilisée** :

- Backend : Express 5, TypeScript 5, tsx (dev)
- Frontend : React 19, Vite 7, TypeScript 5, React Router 6
- Pas de dépendances externes pour la logique métier (validation native, pas de librairie)

**Points forts de l'implémentation** :

- Architecture propre et séparée (models, services, routes, utils)
- Pas de sur-ingénierie (MVP focus)
- Code type-safe avec TypeScript
- Gestion d'erreurs cohérente
- Compteur de clics fonctionnel (nice-to-have implémenté)
- Routing frontend avec React Router (page 404 élégante pour codes inexistants)

**Contact** : Pour toute question, se référer au PROPOSAL.md pour les décisions d'architecture détaillées.
