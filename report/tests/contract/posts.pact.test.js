const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

const { like, string, integer } = MatchersV3;

const provider = new PactV3({
    consumer: 'Frontend',
    provider: 'Backend',
    dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Contract testing - Posts', () => {

    test('GET - Le frontend reçoit un post avec les bons champs', async () => {
        await provider
            .given('un post avec ID 1 existe')
            .uponReceiving('une requête pour récupérer le post 1')
            .withRequest({
                method: 'GET',
                path: '/posts/1',
            })
            .willRespondWith({
                status: 200,
                body: {
                    id: integer(1),
                    title: string('Premier post'),
                    body: string('Contenu 1'),
                    userId: integer(1),
                },
            })
            .executeTest(async (mockServer) => {
                const response = await axios.get(`${mockServer.url}/posts/1`);

                expect(response.status).toBe(200);
                expect(response.data.id).toBeDefined();
                expect(typeof response.data.title).toBe('string');
                expect(typeof response.data.body).toBe('string');
                expect(typeof response.data.userId).toBe('number');
            });
    });

    test('POST - Le frontend peut créer un post', async () => {
        await provider
            .given('le backend accepte un nouveau post')
            .uponReceiving('une requête pour créer un post')
            .withRequest({
                method: 'POST',
                path: '/posts',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    title: string('Nouveau post'),
                    body: string('Contenu'),
                    userId: integer(1),
                },
            })
            .willRespondWith({
                status: 201,
                body: {
                    id: integer(3),
                    title: string('Nouveau post'),
                    body: string('Contenu'),
                    userId: integer(1),
                },
            })
            .executeTest(async (mockServer) => {
                const response = await axios.post(`${mockServer.url}/posts`, {
                    title: 'Nouveau post',
                    body: 'Contenu',
                    userId: 1,
                });

                expect(response.status).toBe(201);
                expect(response.data.id).toBeDefined();
                expect(typeof response.data.title).toBe('string');
            });
    });

});