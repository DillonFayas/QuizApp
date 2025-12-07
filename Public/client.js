const server = "localhost";
const getQuizCategoriesURL = `http://${server}:3000/api/categories`;

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

const showQuizBuilderPage = () => {
    document.getElementById("home").classList.add("visually-hidden");
    document.getElementById("quiz").classList.add("visually-hidden");
    document.getElementById("results").classList.add("visually-hidden");
    document.getElementById("quizBuilder").classList.remove("visually-hidden");
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

const onTakeQuizButtonClick = () => {
    showQuizPage();
}

const init = () => {
    console.log("Client-side script loaded.");

    showHomePage();
}

window.onload = init;