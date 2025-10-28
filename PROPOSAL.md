# Proposition - Raccourcisseur d'URL

## 1. Questions de clarification

Si c'était un vrai projet, je poserais ces questions avant de commencer :

**Contexte et volume :**

- Utilisateurs cibles ? (grand public vs développeurs) → _Hypothèse : utilisateurs techniques pour POC_
- Volume attendu ? (dizaines vs millions d'URLs) → _Hypothèse : quelques centaines maximum_
- Durée de vie des URLs ? (permanentes vs expiration) → _Décision MVP : permanentes_

**Comportement fonctionnel :**

- Même URL raccourcie 2 fois → même code ou nouveau ? → _Décision : nouveau code (comme bit.ly), plus simple_
- Validation : format seul ou DNS lookup ? → _Décision : format uniquement, localhost accepté_
- Détection liens malveillants ? → _Hors scope MVP, critique pour production_

**Considérations techniques :**

- Performance attendue ? → _< 100ms, stockage en-mémoire suffit_
- Analytics requis ? → _Compteur de clics simple si temps disponible_

**Approche :** En l'absence de réponses, je fais des hypothèses pragmatiques orientées MVP et les documente clairement.

---

## 2. Périmètre du MVP

### Dans le scope (fonctionnalités essentielles)

**Backend :**

- API POST `/api/urls` pour créer une URL raccourcie
  - Validation du format d'URL
  - Génération automatique de code court
  - Retour du code et de l'URL complète
- Endpoint GET `/:shortCode` pour la redirection
  - Lookup en O(1) avec Map
  - Gestion erreur 404 si code inexistant
- Gestion d'erreurs appropriée
  - 400 pour URLs invalides ou manquantes
  - 404 pour codes inexistants
  - 500 pour erreurs serveur
- Stockage en mémoire (Map)
  - Structure : `Map<shortCode, UrlEntry>`
  - UrlEntry contient : originalUrl, shortCode, createdAt, clicks

**Frontend :**

- Formulaire de saisie d'URL
  - Input + bouton submit
  - Validation côté client basique
- Affichage de l'URL raccourcie
  - Lien cliquable
  - Bouton "copier" (si temps)
- Gestion des états
  - Loading pendant la requête
  - Messages d'erreur clairs
  - État de succès avec résultat

**Technique :**

- Stack fournie (Vite + React + Express + TypeScript)
- Génération de codes courts : compteur + base62
- Tests manuels (pas de tests automatisés)

**Justification :**
Ces fonctionnalités constituent la version minimum pour démontrer que le service fonctionne de bout en bout.

---

### Hors scope MVP (à ne PAS implémenter)

- Authentification, codes personnalisés, détection de duplicatas
- Expiration automatique, suppression/édition d'URLs
- Analytics avancées (géoloc, référents), liste complète des URLs
- Détection liens malveillants, rate limiting
- Base de données persistante, tests automatisés, Docker, CI/CD

**Justification :** Contrainte de temps (3-4h). Important pour la production mais pas nécessaire pour démontrer le concept.

---

### Nice-to-have (si temps restant < 30 min)

1. Compteur de clics (15 min) : montre la valeur analytics
2. Bouton copier dans presse-papier (10 min) : meilleure UX
3. Validation DNS (20 min) : vérifie existence domaine, mais ajoute latence
4. Endpoint GET `/api/urls/:shortCode` (15 min) : récupérer infos sans rediriger

**Principe :** Si tout fonctionne à 2h30, je considère ces ajouts. Sinon, je documente et m'arrête.

---

## 3. Approche technique

### Génération des codes courts

**Méthode : Compteur incrémental + encodage Base62**

- Compteur auto-incrémenté (1, 2, 3...) encodé en base62 (0-9, a-z, A-Z)
- Exemple : 1 → "1", 62 → "10", 100 → "1C"

**Avantages :**

- Aucune collision (unicité mathématique)
- Codes très courts : 1 char pour les 62 premières URLs
- Simple à implémenter
- Scalable : 62^6 = ~56 milliards d'URLs avec 6 caractères

**Trade-off accepté :** Prédictible et révèle le volume. En production, j'ajouterais un élément aléatoire.

---

### Gestion des collisions

**Pas de gestion nécessaire** : le compteur incrémental garantit l'unicité mathématiquement. Gain de temps ~15-20 minutes par rapport à une approche avec gestion de collisions.

---

### Structure de données

**Map<string, UrlEntry> pour le stockage en mémoire**

- Clé : code court (string)
- Valeur : objet UrlEntry `{ originalUrl, shortCode, createdAt, clicks }`
- Compteur global pour génération d'IDs

**Avantages :** Lookup O(1), API native JavaScript, type-safe avec TypeScript, extensible.

**Trade-off :** Pas de détection de duplicatas (même URL = codes multiples). Justification : comportement standard de bit.ly/TinyURL.

---

### Décisions architecturales clés

**1. Séparation en 3 couches**

- `models/` : Types TypeScript
- `services/` : UrlStore (stockage), UrlService (génération/validation)
- `routes/` : Handlers Express
- `utils/` : Validation

Justification : testable, maintenable, changements localisés.

**2. Design API REST**

- `POST /api/urls` → 201 avec `{ shortCode, shortUrl, originalUrl, createdAt }`
- `GET /:shortCode` → 302 redirect (pas sous /api pour URLs courtes)
- Codes HTTP : 201, 302, 400, 404, 500

**3. Validation d'URL**

- Classe native `URL` de JavaScript (pas de dépendance)
- Protocole http/https uniquement, localhost accepté
- Pas de DNS lookup (gain de temps MVP)

**4. Gestion d'erreurs**

- Middleware Express centralisé
- ValidationError custom pour distinguer erreurs client/serveur
- Réponses JSON cohérentes : `{ "error": "message" }`

---

## 4. Approches alternatives

J'ai considéré d'autres approches avant de choisir la solution la plus adaptée au MVP :

**Génération de codes :**

- **Aléatoire (nanoid)** : Non prédictible et masque le volume d'URLs, mais nécessite une boucle de vérification d'unicité avec retry en cas de collision → rejeté pour simplicité MVP
- **Hash de l'URL** : Déterministe (même URL → même code), mais collisions possibles à gérer et comportement rigide → pas flexible pour notre use case
- **Hybride (compteur + salt aléatoire)** : Combine unicité garantie et imprévisibilité, mais code plus complexe et codes pas minimaux → sur-ingénierie pour MVP

**Stockage :**

- **Double Map bidirectionnelle** : Permettrait de détecter les duplicatas (URL → code et code → URL), mais double la mémoire et nécessite synchronisation → hors scope MVP
- **Base de données (PostgreSQL, Redis)** : Persistance et scalabilité production-ready, mais 30-45min de setup (config, migrations) → README dit explicitement "mémoire OK"

**Stack technique :**

- **Next.js** : SSR, API routes intégrées, un seul serveur, mais 30min de setup et migration du template → template fourni est optimal pour time-box 3-4h
- **Autres frameworks (Remix, SvelteKit)** : Fonctionnalités modernes mais temps d'apprentissage et pas de valeur ajoutée claire pour ce use case simple

**Principe de décision :** Pour chaque choix, j'ai priorisé la simplicité d'implémentation, la minimisation des dépendances, les conventions standards, et l'extensibilité sans sur-ingénierie. Le MVP doit démontrer le concept, pas anticiper tous les besoins production.

---

## 5. Estimation du temps

### Répartition pour 2h30-3h de codage

**Backend (1h15)**

- Setup et structure : 10 min
- Core (base62, UrlStore, UrlService) : 40 min
- Routes Express (POST /api/urls, GET /:shortCode) : 15 min
- Gestion d'erreurs : 10 min

**Frontend (1h)**

- Composant principal (formulaire + affichage) : 30 min
- Gestion des états (loading, error, success) : 20 min
- Intégration API : 10 min

**Tests et debug (30 min)**

- Tests manuels backend (curl) : 10 min
- Tests frontend (flow complet) : 10 min
- Debug et ajustements : 10 min

**Buffer (15-30 min)** : Imprévus ou nice-to-have si en avance

---

### Points de décision

**Si en avance (< 2h30) :** Ajouter compteur de clics (15min) + bouton copier (10min)

**Si en retard (> 2h45) :** Simplifier frontend, documenter ce qui manque dans HANDOFF.md

**Principe :** Je m'arrête à 3h de code quoi qu'il arrive et documente l'état actuel.

---
