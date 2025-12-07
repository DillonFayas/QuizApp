const express = require('express');
const { readFileSync, writeFileSync } = require('fs');
const app = express();

let maxapiId = 0;
let categories = [];
let questionCounts = [];

app.use(express.json());
app.use(express.static('public'));

app.get('/api/categories', async (req, res) => {
    // Grab categories from API
    const response = await fetch('https://opentdb.com/api_category.php');
    const data = (await response.json()).trivia_categories;

    // Save categories so we can easily reference them later
    data.forEach(element => {
        categories[element.id] = element.name;
        maxapiId = Math.max(maxapiId, element.id);
    });
    
    // Pull local custom quizzes and add them to categories from API
    const customQuizzes = JSON.parse(readFileSync('custom_quizzes.json', 'utf-8'));

    // Save these guys too
    customQuizzes.quizzes.forEach(quiz => {
        categories[quiz.id] = quiz.category;
        questionCounts[quiz.id] = {
            total_question_count: quiz.total_question_count,
            total_easy_question_count: quiz.total_easy_question_count,
            total_medium_question_count: quiz.total_medium_question_count,
            total_hard_question_count: quiz.total_hard_question_count
        };
    });
    
    // Combine both sets of categories and send to client
    const customCategories = customQuizzes.quizzes.map(quiz => ({
        id: quiz.id,
        name: quiz.category
    }));
    res.json(data.concat(customCategories));
});

app.get('/api/questionCounts', async(req, res) => {
    const categoryId = req.query.category;
    if (!questionCounts[categoryId]) {
        const response = await fetch(`https://opentdb.com/api_count.php?category=${categoryId}`);
        const data = await response.json();
        questionCounts[categoryId] = data.category_question_count;
    }
    res.json(questionCounts);
});

app.get('/api/questions', async (req, res) => {
    const { categoryId, amount, difficulty, type } = req.query;
    if (categoryId > maxapiId) {
        // Custom quiz
        const customQuizzes = JSON.parse(readFileSync('custom_quizzes.json', 'utf-8'));
        const quiz = customQuizzes.quizzes.find(q => q.id == categoryId);
        let filteredQuestions = quiz.questions;

        // Apply difficulty and type filters
        if (difficulty == 'easy') {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty === 'easy');
        } else if (difficulty == 'medium') {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty === 'medium');
        } else if (difficulty == 'hard') {
            filteredQuestions = filteredQuestions.filter(q => q.difficulty === 'hard');
        }
        if (type == 'multiplechoice') {
            filteredQuestions = filteredQuestions.filter(q => q.type === 'multiple');
        } else if (type == 'boolean') {
            filteredQuestions = filteredQuestions.filter(q => q.type === 'boolean');
        }

        // Scramble questions and limit to amount requested
        filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, amount);

        res.json(filteredQuestions);

    } else {
        // Standard API quiz
        let apiUrl = `https://opentdb.com/api.php?amount=${amount}`;
        if (categoryId && categoryId != -1) {
            apiUrl += `&category=${categoryId}`;
        }
        if (difficulty !== 'any') {
            apiUrl += `&difficulty=${difficulty}`;
        }
        if (type !== 'any') {
            apiUrl += `&type=${type}`;
        }
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.response_code !== 0) {
            res.status(204).send("Bad request");
            return;
        }
        res.json(data.results);
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

// Endpoint to accept new custom quizzes
app.post('/api/quizzes', (req, res) => {
    const body = req.body;
    
    const customQuizzes = JSON.parse(readFileSync('custom_quizzes.json', 'utf-8'));

    let newId; // yikes this is kinda rough but that's okay
    if (customQuizzes.quizzes.length == 0) {
        newId = maxapiId + 1;
    } else {
        newId = customQuizzes.quizzes[customQuizzes.quizzes.length - 1].id + 1;
    }

    const quiz = {
        id: newId,
        category: body.category,
        total_question_count: body.total_question_count || body.questions.length,
        total_easy_question_count: body.total_easy_question_count || body.questions.filter(q => q.difficulty === 'easy').length,
        total_medium_question_count: body.total_medium_question_count || body.questions.filter(q => q.difficulty === 'medium').length,
        total_hard_question_count: body.total_hard_question_count || body.questions.filter(q => q.difficulty === 'hard').length,
        questions: body.questions
    };

    customQuizzes.quizzes.push(quiz);

    // Write back to file
    writeFileSync('custom_quizzes.json', JSON.stringify(customQuizzes, null, 4), 'utf-8');

    res.status(201).send('Quiz created');
});