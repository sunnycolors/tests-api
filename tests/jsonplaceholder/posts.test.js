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

  test('PUT - Modifier un post existant', async () => {
    const response = await axios.put(`${BASE_URL}/posts/1`, {
      id: 1,
      title: 'Titre modifié',
      body: 'Contenu modifié',
      userId: 1
    });

    expect(response.status).toBe(200);
    expect(response.data.title).toBe('Titre modifié');
  });

  test('DELETE - Supprimer un post existant', async () => {
    const response = await axios.delete(`${BASE_URL}/posts/1`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({});
  });

});