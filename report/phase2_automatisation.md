# Phase 2 — Automatisation des tests API avec Jest

## 1. Pourquoi automatiser ?

Avec Postman, les tests tournent dans une interface graphique — tu cliques sur "Send" ou lances le Collection Runner manuellement. L'automatisation avec Jest permet de :

- Lancer les tests en ligne de commande (`npm test`)
- Les intégrer dans une pipeline CI/CD (Phase 3)
- Versionner les tests avec le code sur GitHub
- Tourner sans interface graphique, sur n'importe quel serveur

---

## 2. La stack

| Outil | Rôle |
|---|---|
| **Jest** | Framework de test — structure, assertions, rapports |
| **Axios** | Client HTTP — faire des requêtes vers des APIs externes |
| **Supertest** | Tester un serveur Express directement en mémoire |
| **Pact** | Contract testing entre Frontend et Backend |
| **dotenv** | Gérer les variables d'environnement (tokens, URLs...) |

---

## 3. Installation et configuration

```bash
npm init -y
npm install --save-dev jest supertest axios dotenv @pact-foundation/pact
npm install express
```

Dans `package.json` :

```json
"scripts": {
  "test": "jest"
},
"jest": {
  "testEnvironment": "node"
}
```

---

## 4. Structure des fichiers

```
tests-api/
├── .env                          # variables sensibles (non versionné)
├── .gitignore                    # node_modules/, .env, .DS_Store
├── server.js                     # serveur Express pour Supertest
├── package.json
└── tests/
    ├── jsonplaceholder/
    │   ├── posts.test.js         # tests Axios sur API externe
    │   └── server.test.js        # tests Supertest sur serveur local
    ├── tmdb/
    │   └── movies.test.js        # tests avec authentification
    └── contract/
        └── posts.pact.test.js    # contract testing Pact
```

---

## 5. Axios — tester une API externe

Axios fait de vraies requêtes HTTP vers un serveur externe. Les erreurs (4xx, 5xx) lèvent une exception — il faut un `try/catch`.

```javascript
const axios = require('axios');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('Posts API', () => {

  test('GET - Récupérer post par ID valide', async () => {
    const response = await axios.get(`${BASE_URL}/posts/1`);

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(1);
    expect(response.data.title).toBeTruthy();
  });

  test('GET - Récupérer post ID inexistant', async () => {
    try {
      await axios.get(`${BASE_URL}/posts/99999`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  test('POST - Créer un post valide', async () => {
    const response = await axios.post(`${BASE_URL}/posts`, {
      title: 'Mon premier post',
      body: 'Contenu de test',
      userId: 1
    });

    expect(response.status).toBe(201);
    expect(response.data.id).toBeDefined();
    expect(response.data.title).toBe('Mon premier post');
  });

});
```

---

## 6. Axios avec authentification Bearer Token

Pour les APIs protégées, on crée un client Axios configuré une seule fois avec le token.

```javascript
require('dotenv').config();
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${process.env.TMDB_TOKEN}`
  }
});

describe('Movies API', () => {

  test('GET - Récupérer les films populaires', async () => {
    const response = await client.get('/movie/popular');

    expect(response.status).toBe(200);
    expect(response.data.results).toBeInstanceOf(Array);
    expect(response.data.results.length).toBeGreaterThan(0);
    response.data.results.forEach(film => {
      expect(film.title).toBeTruthy();
    });
  });

  test('GET - Requête sans token', async () => {
    try {
      await axios.get('https://api.themoviedb.org/3/movie/popular');
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.success).toBe(false);
    }
  });

});
```

---

## 7. Variables d'environnement — sécuriser les tokens

Ne jamais mettre un token en dur dans le code — il partirait sur GitHub.

**Fichier `.env` (non versionné) :**
```
TMDB_TOKEN=eyJhbGci...
```

**Fichier `.gitignore` :**
```
node_modules/
.env
.DS_Store
```

**Utilisation dans le code :**
```javascript
require('dotenv').config();
const TOKEN = process.env.TMDB_TOKEN;
```

> En CI/CD (Phase 3), les tokens sont injectés via les **secrets** GitHub Actions — jamais dans le code.

---

## 8. Supertest — tester un serveur Express

Supertest teste le serveur directement en mémoire, sans réseau. Les erreurs 4xx/5xx ne lèvent pas d'exception — pas besoin de `try/catch`.

**Le serveur (`server.js`) :**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

const posts = [
  { id: 1, title: 'Premier post', body: 'Contenu 1', userId: 1 },
  { id: 2, title: 'Deuxième post', body: 'Contenu 2', userId: 1 }
];

app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ message: 'Post non trouvé' });
  res.status(200).json(post);
});

app.post('/posts', (req, res) => {
  const { title, body, userId } = req.body;
  if (!title) return res.status(400).json({ message: 'Le titre est requis' });
  const post = { id: posts.length + 1, title, body, userId };
  posts.push(post);
  res.status(201).json(post);
});

module.exports = app;
```

**Les tests (`server.test.js`) :**
```javascript
const request = require('supertest');
const app = require('../../server');

describe('Server API - Supertest', () => {

  test('GET - Récupérer post par ID valide', async () => {
    const response = await request(app).get('/posts/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  test('GET - Récupérer post ID inexistant', async () => {
    const response = await request(app).get('/posts/99999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Post non trouvé');
  });

  test('POST - Créer un post sans titre', async () => {
    const response = await request(app)
      .post('/posts')
      .send({ body: 'Contenu sans titre', userId: 1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Le titre est requis');
  });

});
```

### Axios vs Supertest

| | Axios | Supertest |
|---|---|---|
| **Usage** | API externe | Serveur local |
| **Réseau** | Oui | Non (en mémoire) |
| **Erreurs 4xx** | Exception → `try/catch` | Statut direct, pas d'exception |
| **Vitesse** | Dépend du réseau | Très rapide |
| **Accès au code** | Non nécessaire | Nécessite le code source |

---

## 9. Test data management

Le principe : partager des données entre tests via une variable `let` déclarée dans le `describe`.

```javascript
describe('Posts API', () => {
  let postId;

  test('POST - Créer un post', async () => {
    const response = await axios.post(`${BASE_URL}/posts`, {
      title: 'Post de test',
      body: 'Contenu',
      userId: 1
    });
    postId = response.data.id; // on stocke l'id
  });

  test('PUT - Modifier le post créé', async () => {
    expect(postId).toBeDefined(); // on vérifie que le POST a bien tourné avant
    const response = await axios.put(`${BASE_URL}/posts/${postId}`, {
      title: 'Titre modifié'
    });
    expect(response.status).toBe(200);
  });

  test('DELETE - Supprimer le post créé', async () => {
    expect(postId).toBeDefined();
    const response = await axios.delete(`${BASE_URL}/posts/${postId}`);
    expect(response.status).toBe(200);
  });
});
```

> Sur une vraie API, POST → PUT → DELETE sur le même `id` fonctionne parfaitement. JSONPlaceholder est une fausse API qui simule les réponses sans vraiment créer de données.

---

## 10. Contract testing avec Pact

Le contract testing évite les bugs de communication entre équipes Frontend et Backend.

**Le problème :** le Backend renomme `title` en `name` sans prévenir → le Frontend casse en production.

**La solution :** définir un contrat que les deux équipes s'engagent à respecter.

```javascript
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, string, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'Frontend',
  provider: 'Backend',
  dir: path.resolve(process.cwd(), 'pacts'),
});

test('GET - Le frontend reçoit un post avec les bons champs', async () => {
  await provider
    .given('un post avec ID 1 existe')
    .uponReceiving('une requête pour récupérer le post 1')
    .withRequest({ method: 'GET', path: '/posts/1' })
    .willRespondWith({
      status: 200,
      body: {
        id: integer(1),       // doit être un nombre entier
        title: string('...'), // doit être une string
        body: string('...'),  // doit être une string
        userId: integer(1),   // doit être un nombre entier
      },
    })
    .executeTest(async (mockServer) => {
      const response = await axios.get(`${mockServer.url}/posts/1`);
      expect(response.status).toBe(200);
      expect(typeof response.data.title).toBe('string');
    });
});
```

Pact génère automatiquement un fichier `pacts/Frontend-Backend.json` — c'est le contrat versionné sur Git et partagé entre les équipes.

---

## Ce qu'on verra en Phase 3

- Intégration CI/CD avec **GitHub Actions**
- Lancer `npm test` automatiquement à chaque push
- Gérer les secrets (tokens) dans GitHub Actions
- Générer des rapports **Allure**
- Exécuter les collections Postman avec **Newman**
