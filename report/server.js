const express = require('express');
const app = express();

app.use(express.json());

const posts = [
    { id: 1, title: 'Premier post', body: 'Contenu 1', userId: 1 },
    { id: 2, title: 'Deuxième post', body: 'Contenu 2', userId: 1 }
];

app.get('/posts', (req, res) => {
    res.status(200).json(posts);
});

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

app.delete('/posts/:id', (req, res) => {
    const index = posts.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Post non trouvé' });
    posts.splice(index, 1);
    res.status(200).json({ message: 'Post supprimé' });
});

module.exports = app;