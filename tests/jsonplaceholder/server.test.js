const request = require('supertest');
const app = require('../../server');

describe('Server API - Supertest', () => {

    test('GET - Lister tous les posts', async () => {
        const response = await request(app).get('/posts');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET - Récupérer post par ID valide', async () => {
        const response = await request(app).get('/posts/1');

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(1);
        expect(response.body.title).toBeTruthy();
    });

    test('GET - Récupérer post ID inexistant', async () => {
        const response = await request(app).get('/posts/99999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Post non trouvé');
    });

    test('POST - Créer un post valide', async () => {
        const response = await request(app)
            .post('/posts')
            .send({ title: 'Nouveau post', body: 'Contenu', userId: 1 });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.title).toBe('Nouveau post');
    });

    test('POST - Créer un post sans titre', async () => {
        const response = await request(app)
            .post('/posts')
            .send({ body: 'Contenu sans titre', userId: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Le titre est requis');
    });

    test('DELETE - Supprimer un post existant', async () => {
        const response = await request(app).delete('/posts/1');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Post supprimé');
    });

    test('DELETE - Supprimer un post inexistant', async () => {
        const response = await request(app).delete('/posts/99999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Post non trouvé');
    });

});