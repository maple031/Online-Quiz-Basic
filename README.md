# Online Quiz Application

A responsive online quiz application developed for a Scripting Languages Lab. The project uses HTML, CSS, JavaScript, jQuery AJAX, PHP, and XML.

## Subjects

- Computer Fundamentals
- DBMS
- Java
- Web Technology

Each subject contains 10 multiple-choice questions.

## Features

- Professional homepage and subject selection page
- Responsive quiz interface
- Previous, Next, and numbered question navigation
- Saved selections during the quiz and after refreshing
- Server-side answer checking using PHP and SimpleXML
- Score, percentage, correct, wrong, and unanswered result statistics
- Friendly result fallback for direct or invalid result-page visits
- No database or frontend framework

## Project Structure

```text
OnlineQuiz/
├── index.html
├── subjects.html
├── quiz.html
├── result.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── php/
│   ├── getquestions.php
│   └── checkanswers.php
├── data/
│   └── questions.xml
├── jquery.min.js
└── README.md
```

## Requirements

- Windows or another system with PHP 8 or newer
- A modern web browser
- Internet access for the jQuery CDN

## Run the Application

Open a terminal in the project directory and start PHP's built-in server:

```powershell
cd C:\project\onlineQuiz\OnlineQuiz
php -S 127.0.0.1:5501
```

Then open:

```text
http://127.0.0.1:5501/index.html
```

Do not open the HTML files directly using `file://`. The PHP server is required for question loading and answer checking.

## GitHub Repository

```text
https://github.com/maple031/Online-Quiz-Basic
```

Clone the project:

```powershell
git clone https://github.com/maple031/Online-Quiz-Basic.git
```
