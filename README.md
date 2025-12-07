## Try it out
Install express using `npm install express`, then run `server.js` and access [localhost:3000](http://localhost:3000) in your browser.

## Planning
* When a user opens the site, they can select a category, question count, difficulty, and type(multiple choice/boolean)
* Clicking a "take quiz" button will load their selections or default selections into a new page where they can take the quiz
* A timer will track how long it takes them to complete the quiz
* Upon completion of a quiz, user will be presented with stats such as time taken, score, list of answers with answer key
* Users can enter Quiz Builder mode to create a quiz that will be available for anyone to use

## Result
Users are able to choose a category and question count. The question count is validated by the server to disallow known impossible quizzes. Quizzes load in a very basic format allowing users to select one option per question and submit the quiz. A timer is shown at the top of the quiz screen. Upon submission of a quiz, assuming all questions have been attempted, the results page displays a score, time, and answer key for the quiz. Users can also create custom quizzes using the Quiz Builder and publish them for anyone to try. This project uses Express for its API and [Open Trivia Database](https://opentdb.com/api_config.php) for default trivia questions.