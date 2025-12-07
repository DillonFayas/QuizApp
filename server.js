const express = require('express');
const { readFileSync } = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/categories', async (req, res) => {
    const response = await fetch('https://opentdb.com/api_category.php');
    const data = (await response.json()).trivia_categories;
    const customQuizzes = JSON.parse(readFileSync('custom_quizzes.json', 'utf-8'));
    let customId = data.length + 1;
    const customCategories = customQuizzes.quizzes.map(quiz => ({
        id: customId++,
        name: quiz.category
    }));
    res.json(data.concat(customCategories));
});

app.get('/api/questions', async (req, res) => {
    const { category, amount, difficulty, type } = req.query;
    let apiURL = `https://opentdb.com/api.php?amount=${amount}`;
    
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});