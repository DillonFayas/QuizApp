const server = "localhost";
const getQuizCategoriesURL = `http://${server}:3000/api/categories`;
const getQuestionCountsURL = `http://${server}:3000/api/questionCounts`;
const getQuizQuestionsURL = `http://${server}:3000/api/questions`;
const postQuizURL = `http://${server}:3000/api/quizzes`;

let currentQuestions = [];

const showHomePage = () => {
    document.getElementById("home").classList.remove("visually-hidden");
    document.getElementById("quiz").classList.add("visually-hidden");
    document.getElementById("results").classList.add("visually-hidden");
    document.getElementById("quizBuilder").classList.add("visually-hidden");
    populateCategoryDropdown();
}

const showQuizPage = () => {
    document.getElementById("home").classList.add("visually-hidden");
    document.getElementById("quiz").classList.remove("visually-hidden");
    document.getElementById("results").classList.add("visually-hidden");
    document.getElementById("quizBuilder").classList.add("visually-hidden");
}

const showResultsPage = () => {
    document.getElementById("home").classList.add("visually-hidden");
    document.getElementById("quiz").classList.add("visually-hidden");
    document.getElementById("results").classList.remove("visually-hidden");
    document.getElementById("quizBuilder").classList.add("visually-hidden");
}

const getSelectedDifficulty = () => {
    const difficultySelection = document.getElementById("difficultySelection");
    const selectedButton = difficultySelection.querySelector("input[name='difficulty']:checked");
    return selectedButton.value;
}

const getSelectedType = () => {
    const typeSelection = document.getElementById("typeSelection");
    const selectedButton = typeSelection.querySelector("input[name='type']:checked");
    return selectedButton.value;
}

const showQuizBuilderPage = () => {
    document.getElementById("home").classList.add("visually-hidden");
    document.getElementById("quiz").classList.add("visually-hidden");
    document.getElementById("results").classList.add("visually-hidden");
    document.getElementById("quizBuilder").classList.remove("visually-hidden");
}

const createQuestionCard = () => {
    const container = document.createElement('div');
    container.className = 'card p-3 mb-2';
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <h6>Question</h6>
            <div>
                <button class="btn btn-sm btn-outline-danger remove-question">Remove</button>
            </div>
        </div>
        <div class="mb-2">
            <textarea class="form-control builder-question-text" rows="2" placeholder="Enter question text"></textarea>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-6">
                <label class="form-label small">Difficulty</label>
                <select class="form-select builder-difficulty">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
            <div class="col-6">
                <label class="form-label small">Type</label>
                <select class="form-select builder-type">
                    <option value="multiple">Multiple Choice</option>
                    <option value="boolean">True / False</option>
                </select>
            </div>
        </div>
        <div class="mb-2">
            <label class="form-label small">Correct Answer</label>
            <input class="form-control builder-correct" placeholder="Correct answer">
        </div>
        <div class="mb-2 incorrect-group">
            <label class="form-label small">Incorrect Answers</label>
            <input class="form-control builder-incorrect mb-1" placeholder="Incorrect answer 1">
            <input class="form-control builder-incorrect mb-1" placeholder="Incorrect answer 2">
            <input class="form-control builder-incorrect mb-1" placeholder="Incorrect answer 3">
        </div>
    `;

    const typeSelect = container.querySelector('.builder-type');
    const incorrectGroup = container.querySelector('.incorrect-group');
    const correctInput = container.querySelector('.builder-correct');
    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'boolean') {
            incorrectGroup.classList.add('visually-hidden');
            correctInput.placeholder = 'True or False';
        } else {
            incorrectGroup.classList.remove('visually-hidden');
            correctInput.placeholder = 'Correct answer';
        }
    });

    container.querySelector('.remove-question').addEventListener('click', () => {
        container.remove();
    });

    return container;
}

const addQuestion = () => {
    const questionArea = document.getElementById('builderQuestions');
    const card = createQuestionCard();
    questionArea.appendChild(card);
}

const collectQuizData = () => {
    const category = document.getElementById('builderCategory').value.trim();
    const questionCards = Array.from(document.querySelectorAll('#builderQuestions .card'));
    const questions = [];
    for (const card of questionCards) {
        const questionText = card.querySelector('.builder-question-text').value.trim();
        const difficulty = card.querySelector('.builder-difficulty').value;
        const type = card.querySelector('.builder-type').value;
        const correct = card.querySelector('.builder-correct').value.trim();
        if (!questionText || !correct) {
            return { error: 'All questions must have text and a correct answer.' };
        }
        let incorrect_answers = [];
        if (type === 'multiple') {
            const incorrectInputs = Array.from(card.querySelectorAll('.builder-incorrect'));
            incorrect_answers = incorrectInputs.map(i => i.value.trim()).filter(v => v.length > 0);
            if (incorrect_answers.length < 1) {
                return { error: 'Multiple choice questions require at least one incorrect answer.' };
            }
        } else if (type === 'boolean') {
            incorrect_answers = [correct.toLowerCase() === 'true' ? 'False' : 'True'];
        }

        questions.push({
            type: type,
            difficulty: difficulty,
            question: questionText,
            incorrect_answers: incorrect_answers,
            correct_answer: correct
        });
    }

    if (!category) {
        return { error: 'Quiz must have a category/name.' };
    }
    if (questions.length === 0) {
        return { error: 'Add at least one question before publishing.' };
    }

    const total_question_count = questions.length;
    const total_easy_question_count = questions.filter(q => q.difficulty === 'easy').length;
    const total_medium_question_count = questions.filter(q => q.difficulty === 'medium').length;
    const total_hard_question_count = questions.filter(q => q.difficulty === 'hard').length;

    return {
        category,
        total_question_count,
        total_easy_question_count,
        total_medium_question_count,
        total_hard_question_count,
        questions
    };
}

const publishQuiz = async () => {
    const msg = document.getElementById('builderMessage');
    msg.classList.add('visually-hidden');
    const newQuizData = collectQuizData();
    if (newQuizData.error) {
        msg.className = 'alert alert-danger mt-3';
        msg.textContent = newQuizData.error;
        msg.classList.remove('visually-hidden');
        return;
    }

    try {
        const response = await fetch(postQuizURL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newQuizData)
        });
        if (!response.ok) return;
        msg.className = 'alert alert-success mt-3';
        msg.textContent = `Quiz published!`;
        msg.classList.remove('visually-hidden');
        document.getElementById('builderQuestions').innerHTML = '';
        document.getElementById('builderCategory').value = '';
        showHomePage();
    } catch (err) {
        msg.className = 'alert alert-danger mt-3';
        msg.textContent = `Unable to publish quiz: ${err.message}`;
        msg.classList.remove('visually-hidden');
    }
}

const getQuizCategories = async () => {
    const response = await fetch(getQuizCategoriesURL);
    if (!response.ok) {
        return getQuizCategories();
    }
    const data = await response.json();
    return data;
}

const populateCategoryDropdown = async () => {
    const categories = await getQuizCategories();
    const categorySelect = document.getElementById("categorySelection");
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

let knownQuestionCounts = {};
const validateQuestionCount = async () => {
    const questionCountInput = document.getElementById("questionCount");
    const categorySelection = document.getElementById("categorySelection");
    const questionCountFeedback = document.getElementById("questionCountFeedback");
    const takeQuizError = document.getElementById("takeQuizError");
    takeQuizError.classList.toggle("visually-hidden", true);
    const questionCount = questionCountInput.value;
    if (questionCount <= 0 || questionCount > 50 || isNaN(questionCount)) {
        questionCountInput.classList.toggle("is-invalid", true);
        questionCountFeedback.textContent = "Please enter a valid number of questions(1-50).";
        return;
    } else {
        questionCountInput.classList.toggle("is-invalid", false);
    }
    const category = categorySelection.value;
    if (category == -1) {
        questionCountInput.toggleAttribute("is-invalid", false);
        return;
    }
    if (!knownQuestionCounts[category]) {
        const response = await fetch(`${getQuestionCountsURL}?category=${category}`);
        const data = await response.json();
        knownQuestionCounts = data;
    }
    const difficultySelection = getSelectedDifficulty();
    if (difficultySelection === 'any') {
        questionCountInput.classList.toggle("is-invalid", questionCount > knownQuestionCounts[category].total_question_count);
        questionCountFeedback.textContent = `Maximum questions available for the selected category and difficulty is ${knownQuestionCounts[category].total_question_count}.`;
    } else if (difficultySelection === 'easy') {
        questionCountInput.classList.toggle("is-invalid", questionCount > knownQuestionCounts[category].total_easy_question_count);
        questionCountFeedback.textContent = `Maximum questions available for the selected category and difficulty is ${knownQuestionCounts[category].total_easy_question_count}.`;
    } else if (difficultySelection === 'medium') {
        questionCountInput.classList.toggle("is-invalid", questionCount > knownQuestionCounts[category].total_medium_question_count);
        questionCountFeedback.textContent = `Maximum questions available for the selected category and difficulty is ${knownQuestionCounts[category].total_medium_question_count}.`;
    } else if (difficultySelection === 'hard') {
        questionCountInput.classList.toggle("is-invalid", questionCount > knownQuestionCounts[category].total_hard_question_count);
        questionCountFeedback.textContent = `Maximum questions available for the selected category and difficulty is ${knownQuestionCounts[category].total_hard_question_count}.`;
    }
}

const populateQuizPage = async () => {
    const takeQuizError = document.getElementById("takeQuizError");
    const category = document.getElementById("categorySelection").value;
    const questionCount = document.getElementById("questionCount").value;
    const difficulty = getSelectedDifficulty();
    const type = getSelectedType();

    // Use these values to fetch and display the quiz questions
    let response;
    try{
        response = await fetch(`http://${server}:3000/api/questions?categoryId=${category}&amount=${questionCount}&difficulty=${difficulty}&type=${type}`);
    } catch (error) {
        console.error("Error fetching questions:", error);
        return false;
    }
    if (response.status !== 200) {
        takeQuizError.classList.toggle("visually-hidden", false);
        takeQuizError.textContent = "Unable to fetch questions. Please try again later.";
        return false;
    }
    const questions = await response.json();

    // Display questions on the quiz page
    if (questions.length === 0) {
        takeQuizError.classList.toggle("visually-hidden", false);
        takeQuizError.textContent = "No questions available for the selected options. Please adjust your selections.";
        return false;
    } else {
        takeQuizError.classList.toggle("visually-hidden", true);
    }

    currentQuestions = questions;
    let quizQuestionsDiv = document.getElementById("quizQuestions");
    quizQuestionsDiv.innerHTML = "";
    for (let i = 0; i < questions.length; i++) {
        let htmlContent = "";
        if (questions[i].type === "multiple") {
            // put all answers in an array and scramble them
            let answers = [...questions[i].incorrect_answers];
            answers.push(questions[i].correct_answer);
            answers = answers.sort(() => Math.random() - 0.5);
            htmlContent = `
            <div class="card col-10 mb-2">
                <div class="card-body px-3">
                    <h5 class="card-title text">${questions[i].question}</h5>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${answers[0] == questions[i].correct_answer}">
                        <label class="form-check-label text">${answers[0]}</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${answers[1] == questions[i].correct_answer}">
                        <label class="form-check-label text">${answers[1]}</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${answers[2] == questions[i].correct_answer}">
                        <label class="form-check-label text">${answers[2]}</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${answers[3] == questions[i].correct_answer}">
                        <label class="form-check-label text">${answers[3]}</label>
                    </div>
                </div>
            </div>`;
        } else {
            htmlContent = `
            <div class="card col-10 mb-2">
                <div class="card-body px-3">
                    <h5 class="card-title text">${questions[i].question}</h5>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${questions[i].correct_answer === "True"}">
                        <label class="form-check-label text">True</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${i}" value="${questions[i].correct_answer === "False"}">
                        <label class="form-check-label text">False</label>
                    </div>
                </div>
            </div>`;
        }
        quizQuestionsDiv.innerHTML += htmlContent;
    }

    return true;
}

const onQuizSubmit = () => {
    // Make sure they answered all questions
    let allAnswered = true;
    for (let i = 0; i < currentQuestions.length; i++) {
        const selectedOption = document.querySelector(`input[name="${i}"]:checked`);
        if (!selectedOption) {
            allAnswered = false;
            break;
        }
    }
    let submitQuizError = document.getElementById("submitQuizError");
    if (!allAnswered) {
        submitQuizError.classList.toggle("visually-hidden", false);
        submitQuizError.textContent = "Please answer all questions before submitting the quiz.";
        return;
    }
    submitQuizError.classList.toggle("visually-hidden", true);

    // Stop timer
    const timerElement = document.getElementById("timer");
    const timerInterval = timerElement.dataset.intervalId;
    clearInterval(timerInterval);
    delete timerElement.dataset.intervalId;

    // Calculate score
    let score = 0;
    let answerKeyHTML = "";
    for (let i = 0; i < currentQuestions.length; i++) {
        const selectedOption = document.querySelector(`input[name="${i}"]:checked`);
        if (selectedOption && selectedOption.value === "true") {
            score++;

            answerKeyHTML += 
            `<div class="card p-2 mt-2">
                <div>
                    <span class="badge rounded-pill bg-success mb-1">Question ${i + 1}</span>
                </div>
                <h6 class="fw-bold">${currentQuestions[i].question}</h6>
                <p class="mb-0">Your Answer: <span class="text-success">${currentQuestions[i].correct_answer}</span></p>
            </div>`
        } else {
            answerKeyHTML += 
            `<div class="card p-2 mt-2">
                <div>
                    <span class="badge rounded-pill bg-danger mb-1">Question ${i + 1}</span>
                </div>
                <h6 class="fw-bold">${currentQuestions[i].question}</h6>
                <p class="mb-0">Your Answer: <span class="text-danger">${selectedOption.nextElementSibling.textContent}</span></p>
                <p class="mb-1">Correct Answer: <span class="text-success">${currentQuestions[i].correct_answer}</span></p>
            </div>`
        }
    }

    // Display results
    const resultScore = document.getElementById("resultsScore");
    resultScore.textContent = `${score} / ${currentQuestions.length}`;

    const timeTaken = document.getElementById("resultsTime");
    timeTaken.textContent = timerElement.textContent.replace("Time Spent: ", "");

    const answerKeyList = document.getElementById("answerKeyList");
    answerKeyList.innerHTML = answerKeyHTML;

    showResultsPage();
}

const onTakeQuizButtonClick = async () => {
    const successfullyPopulated = await populateQuizPage();
    if (!successfullyPopulated) {
        return;
    }
    showQuizPage();
    // Start timer
    let secondsElapsed = 0;
    const timerElement = document.getElementById("timer");
    timerElement.textContent = `Time Spent: 00:00`;
    const timerInterval = setInterval(() => {
        secondsElapsed++;
        const minutes = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const seconds = String(secondsElapsed % 60).padStart(2, '0');
        timerElement.textContent = `Time Spent: ${minutes}:${seconds}`;
    }, 1000);

    // Store the interval ID so we can clear it later
    timerElement.dataset.intervalId = timerInterval;
}

const init = () => {
    showHomePage();

    document.getElementById("categorySelection").addEventListener("change", validateQuestionCount);
    document.getElementById("difficultySelection").addEventListener("change", validateQuestionCount);
    document.getElementById("questionCount").addEventListener("input", validateQuestionCount);
    document.getElementById("typeSelection").addEventListener("change", validateQuestionCount);
    document.getElementById("takeQuizButton").addEventListener("click", onTakeQuizButtonClick);
    document.getElementById("submitQuiz").addEventListener("click", onQuizSubmit);
    document.getElementById("backToHome").addEventListener("click", showHomePage);
    document.getElementById('buildQuizButton').addEventListener('click', (e) => {
        document.getElementById('builderQuestions').innerHTML = '';
        addQuestion();
        showQuizBuilderPage();
    });
    document.getElementById('addQuestionButton').addEventListener('click', addQuestion);
    document.getElementById('publishQuizButton').addEventListener('click', publishQuiz);
    document.getElementById('cancelBuildButton').addEventListener('click', showHomePage);

    new bootstrap.Popover(document.querySelector('.type-info-popover'), {
        container: 'body'
    })
}

window.onload = init;