const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = process.env.TMDB_TOKEN;

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${TOKEN}`
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

    test('GET - Accéder à une ressource inexistante', async () => {
        try {
            await client.get('/movie/99999999');
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.success).toBe(false);
        }
    });

    test('GET - Requête sans token', async () => {
        try {
            await axios.get(`${BASE_URL}/movie/popular`);
        } catch (error) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.success).toBe(false);
        }
    });

});