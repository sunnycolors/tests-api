# Phase 1 — Bases des tests API avec Postman

## 1. Le cycle requête / réponse HTTP

Toute communication avec une API suit le même schéma :

```
Client (Postman) → Requête HTTP → Serveur API → Réponse HTTP → Client
```

Une **requête** contient :
- Une **méthode** (GET, POST, PUT, DELETE...)
- Une **URL** (l'adresse de la ressource)
- Des **headers** (métadonnées : Content-Type, Authorization...)
- Un **body** (données envoyées — uniquement sur POST, PUT, PATCH)

Une **réponse** contient :
- Un **code de statut** (200, 201, 404, 500...)
- Des **headers** de réponse
- Un **body** (données renvoyées, souvent en JSON)

---

## 2. Les méthodes HTTP

| Méthode | Rôle | Body | Idempotent |
|---|---|---|---|
| `GET` | Lire une ressource | Non | Oui |
| `POST` | Créer une ressource | Oui | Non |
| `PUT` | Remplacer entièrement | Oui | Oui |
| `PATCH` | Modifier partiellement | Oui | Non |
| `DELETE` | Supprimer une ressource | Non | Oui |

> **Idempotent** = exécuter plusieurs fois donne le même résultat.

---

## 3. Les codes de statut HTTP

| Famille | Signification | Exemples clés |
|---|---|---|
| `2xx` | Succès | `200 OK`, `201 Created`, `204 No Content` |
| `3xx` | Redirection | `301 Moved Permanently`, `304 Not Modified` |
| `4xx` | Erreur client | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests` |
| `5xx` | Erreur serveur | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

> Mémo rapide : **2xx = ✓ tout va bien · 4xx = ta faute · 5xx = faute du serveur**

---

## 4. Anatomie d'une requête

```http
POST /api/users HTTP/1.1
Host: api.exemple.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{
  "name": "Alice",
  "email": "alice@exemple.com"
}
```

Et la réponse typique :

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "usr_123",
  "name": "Alice",
  "email": "alice@exemple.com",
  "created_at": "2026-03-25T10:00:00Z"
}
```

---

## 5. Organisation de Postman

```
Workspace
└── Collection (1 par API testée)
    └── Dossier (1 par ressource : Users, Posts, Auth...)
        └── Requête (1 par cas de test)
```

### Convention de nommage des requêtes

```
[MÉTHODE] - Description de l'action - cas
```

**Exemples :**
- `GET - Récupérer post par ID valide`
- `GET - Récupérer post ID inexistant`
- `POST - Créer un post valide`
- `POST - Créer un post sans titre`
- `DELETE - Supprimer un post`

### Règles à retenir
- ✓ Toujours commencer par la méthode
- ✓ Décrire l'action, pas l'URL
- ✓ Préciser le cas (valide / erreur / limite)
- ✗ Éviter : `test1`, `new request`, `requête posts`

---

## 6. Les variables Postman

Les variables évitent de répéter l'URL de base dans chaque requête.

**Créer une variable de collection :**
- Clique sur la collection → onglet **Variables**
- Ajoute `baseUrl` avec la valeur de ton API

**Utiliser une variable dans une requête :**
```
{{baseUrl}}/posts/1
```

---

## 7. Les environments

Les environments permettent de switcher entre Dev, Staging et Production en un clic sans toucher aux requêtes.

| Environment | Rôle |
|---|---|
| **Dev** | Développement en cours, peut casser |
| **Staging** | Validation finale avant prod, copie de la prod |
| **Production** | Environnement réel des utilisateurs |

Le flux classique en entreprise :
```
Dev → Staging → Production
```

### Gérer plusieurs APIs dans un même environment

Quand tu as plusieurs APIs à tester, utilise une variable par API dans le même environment :

| Variable | Value |
|---|---|
| `baseUrl` | `https://jsonplaceholder.typicode.com` |
| `tmdbBaseUrl` | `https://api.themoviedb.org/3` |

Chaque collection utilise sa propre variable (`{{baseUrl}}` ou `{{tmdbBaseUrl}}`). C'est la pratique des grosses équipes QA.

> **Pourquoi `/3` dans l'URL TMDB ?** C'est le numéro de version de l'API. Versionner les URLs est une pratique courante pour faire évoluer une API sans casser les anciens clients. On voit souvent `/v1`, `/v2`, `/api/v3`...

---

## 8. L'authentification Bearer Token

Quasiment toutes les APIs en entreprise sont protégées. Le Bearer Token est le type d'auth le plus répandu.

**Configurer l'auth au niveau de la collection :**
1. Clique sur la collection → onglet **Authorization**
2. Type → **Bearer Token**
3. Colle ton token
4. Dans chaque requête → **Inherit auth from parent**

> L'avantage : toutes les requêtes héritent de l'auth automatiquement, tu n'as pas à recoller le token partout.

**Désactiver l'auth sur une requête spécifique :**
- Onglet **Authorization** de la requête → **No Auth**
- Utile pour tester les cas d'erreur 401

### Différence API Key vs Bearer Token (TMDB)

| Type | Format | Usage |
|---|---|---|
| **API Key** | Courte (`abc123...`) | Paramètre d'URL ou header |
| **Bearer Token** | Longue (`eyJ...`) | Header Authorization |

Pour Postman avec TMDB → toujours utiliser le **API Read Access Token** (le long).

---

## 9. Écrire des tests dans Postman

Les tests s'écrivent dans l'onglet **Tests** de chaque requête en JavaScript.

### Tester le code de statut
```javascript
pm.test("Statut est 200", function () {
    pm.response.to.have.status(200);
});
```

### Tester le contenu du body
```javascript
pm.test("Le body contient un id", function () {
    const json = pm.response.json();
    pm.expect(json.id).to.equal(1);
});

pm.test("Le title n'est pas vide", function () {
    const json = pm.response.json();
    pm.expect(json.title).to.be.a("string").and.not.empty;
});
```

### Tester une liste
```javascript
pm.test("La réponse contient une liste de films", function () {
    const json = pm.response.json();
    pm.expect(json.results).to.be.an("array").and.not.empty;
});

pm.test("Chaque film a un titre", function () {
    const json = pm.response.json();
    json.results.forEach(function(film) {
        pm.expect(film.title).to.be.a("string").and.not.empty;
    });
});
```

### Tester un cas d'erreur 401
```javascript
pm.test("Statut est 401", function () {
    pm.response.to.have.status(401);
});

pm.test("La réponse indique une clé invalide", function () {
    const json = pm.response.json();
    pm.expect(json.success).to.equal(false);
});
```

### Tester un cas d'erreur 404
```javascript
pm.test("Statut est 404", function () {
    pm.response.to.have.status(404);
});

pm.test("La réponse indique un échec", function () {
    const json = pm.response.json();
    pm.expect(json.success).to.equal(false);
});
```

---

## 10. Les tests négatifs — leçon clé

> En QA tu t'adaptes au comportement réel de l'API, pas à ce que tu supposais.

Exemple vécu : TMDB renvoie un `200` avec une liste vide quand on appelle `/search/movie` sans paramètre, au lieu d'un `422`. C'est un choix de conception valide — certaines APIs rejettent la requête, d'autres renvoient un résultat vide.

**La règle :** si le comportement te semble bizarre, tu le documentes et tu en parles à l'équipe dev. Tu n'inventes pas des codes de statut qui n'existent pas.

```javascript
pm.test("Statut est 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Les résultats sont vides sans paramètre", function () {
    const json = pm.response.json();
    pm.expect(json.results).to.be.an("array").and.empty;
});

pm.test("Total résultats est 0", function () {
    const json = pm.response.json();
    pm.expect(json.total_results).to.equal(0);
});
```

---

## 11. Le Collection Runner

Le Collection Runner exécute toute la suite de tests en une seule fois.

**Lancer le runner :**
1. Clique sur **...** à côté de ta collection
2. Clique sur **Run collection**
3. Vérifie que toutes les requêtes sont cochées
4. Clique sur **Run**

Tu obtiens un rapport complet : tests passés, échoués, temps d'exécution par requête. C'est ce rapport qu'un QA montre à son équipe.

---

## Ce qu'on verra en Phase 2

- Automatisation avec **Jest + Supertest** en JavaScript
- Gestion des données de test (test data management)
- Tests en chaîne — POST qui crée, PUT qui modifie, DELETE qui supprime le même ID
- Contract testing avec **Pact**
