document.addEventListener("DOMContentLoaded", function () {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", function () {
            const isOpen = navMenu.classList.toggle("open");
            navToggle.classList.toggle("open", isOpen);
            navToggle.setAttribute("aria-expanded", String(isOpen));
            navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
        });

        navMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navMenu.classList.remove("open");
                navToggle.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
                navToggle.setAttribute("aria-label", "Open navigation");
            });
        });
    }

    document.querySelectorAll("[data-subject]").forEach(function (button) {
        button.addEventListener("click", function () {
            const subjectName = button.getAttribute("data-subject");
            localStorage.setItem("selectedSubject", subjectName);
            localStorage.removeItem("quizResult");
            Object.keys(localStorage).forEach(function (key) {
                if (key.indexOf("quizAnswers:") === 0) {
                    localStorage.removeItem(key);
                }
            });
            window.location.href = "quiz.html";
        });
    });

    if (!document.querySelector(".quiz-page")) {
        if (document.querySelector(".result-page")) {
            renderQuizResult();
            document.querySelectorAll('a[href="subjects.html"]').forEach(function (link) {
                link.addEventListener("click", function () {
                    localStorage.removeItem("quizResult");
                });
            });
        }
        return;
    }

    const subjectName = localStorage.getItem("selectedSubject");
    if (!subjectName) {
        window.location.href = "subjects.html";
        return;
    }

    localStorage.removeItem("quizResult");

    let questions = [];
    let currentQuestion = 0;
    let answers = {};

    const answerStorageKey = "quizAnswers:" + subjectName;

    try {
        const savedAnswers = JSON.parse(localStorage.getItem(answerStorageKey) || "{}");
        if (savedAnswers && typeof savedAnswers === "object") {
            answers = savedAnswers;
        }
    } catch (error) {
        answers = {};
    }

    const subjectHeader = document.getElementById("quizSubjectHeader");
    const subjectNameElement = document.getElementById("quizSubjectName");
    const progressHeader = document.getElementById("progressHeader");
    const questionLabel = document.getElementById("questionLabel");
    const questionText = document.getElementById("questionText");
    const quizOptions = document.getElementById("quizOptions");
    const questionMap = document.getElementById("questionMap");
    const answeredCount = document.getElementById("answeredCount");
    const previousButton = document.getElementById("previousQuestion");
    const nextButton = document.getElementById("nextQuestion");
    const submitButton = document.getElementById("submitQuiz");

    subjectHeader.textContent = subjectName;
    subjectNameElement.textContent = subjectName;

    function saveAnswers() {
        localStorage.setItem(answerStorageKey, JSON.stringify(answers));
    }

    function renderQuestionNavigation() {
        questionMap.innerHTML = "";
        questions.forEach(function (question, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = String(index + 1);
            button.setAttribute("aria-label", "Go to question " + (index + 1));

            if (index === currentQuestion) {
                button.classList.add("current");
                button.setAttribute("aria-current", "step");
            } else if (Object.prototype.hasOwnProperty.call(answers, question.id)) {
                button.classList.add("answered");
            } else {
                button.classList.add("unanswered");
            }

            button.addEventListener("click", function () {
                currentQuestion = index;
                renderQuestion();
            });
            questionMap.appendChild(button);
        });

        const count = Object.keys(answers).length;
        answeredCount.textContent = count + (count === 1 ? " answered" : " answered");
    }

    function renderQuestion() {
        const question = questions[currentQuestion];
        if (!question) {
            return;
        }
        const displayNumber = currentQuestion + 1;

        progressHeader.textContent = "Question " + displayNumber + " of " + questions.length;
        questionLabel.textContent = "Question " + displayNumber;
        questionText.textContent = question.text;
        quizOptions.innerHTML = "";

        question.options.forEach(function (option, index) {
            const optionId = "option-" + currentQuestion + "-" + index;
            const optionLabel = document.createElement("label");
            optionLabel.className = "quiz-option";

            if (answers[question.id] === option.id) {
                optionLabel.classList.add("selected");
            }

            optionLabel.innerHTML =
                '<input type="radio" name="quiz-answer" id="' + optionId + '" value="' + option.id + '">' +
                '<span class="option-letter">' + String.fromCharCode(65 + index) + '</span>' +
                '<span class="option-text"></span>' +
                '<span class="option-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m5 10 3 3 7-7"></path></svg></span>';

            optionLabel.querySelector(".option-text").textContent = option.text;
            const radio = optionLabel.querySelector("input");
            radio.checked = answers[question.id] === option.id;

            radio.addEventListener("change", function () {
                answers[question.id] = option.id;
                saveAnswers();
                quizOptions.querySelectorAll(".quiz-option").forEach(function (label) {
                    label.classList.remove("selected");
                });
                optionLabel.classList.add("selected");
                renderQuestionNavigation();
            });

            quizOptions.appendChild(optionLabel);
        });

        previousButton.disabled = currentQuestion === 0;
        nextButton.disabled = currentQuestion === questions.length - 1;
        renderQuestionNavigation();
    }

    previousButton.addEventListener("click", function () {
        if (currentQuestion > 0) {
            currentQuestion -= 1;
            renderQuestion();
        }
    });

    nextButton.addEventListener("click", function () {
        if (currentQuestion < questions.length - 1) {
            currentQuestion += 1;
            renderQuestion();
        }
    });

    let submissionInProgress = false;

    submitButton.addEventListener("click", function () {
        if (submissionInProgress) {
            return;
        }

        if (!window.confirm("Are you sure you want to submit this quiz?")) {
            return;
        }

        submissionInProgress = true;
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        const payload = {
            subject: subjectName,
            answers: answers
        };

        function handleSubmissionSuccess(response) {
            if (!response || response.success !== true || !response.result) {
                showSubmissionError("The result could not be loaded.");
                return;
            }

            localStorage.setItem("quizResult", JSON.stringify(response.result));
            localStorage.removeItem(answerStorageKey);
            window.location.href = "result.html";
        }

        if (window.jQuery) {
            window.jQuery.ajax({
                url: "php/checkanswers.php",
                method: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(payload)
            }).done(handleSubmissionSuccess).fail(function (xhr) {
                let message = "The quiz could not be submitted. Please try again.";
                if (xhr && xhr.responseJSON && typeof xhr.responseJSON.message === "string") {
                    message = xhr.responseJSON.message;
                }
                showSubmissionError(message);
            });
        } else {
            fetch("php/checkanswers.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(function (response) {
                return response.json().catch(function () {
                    throw new Error("The submission response was not valid.");
                }).then(function (data) {
                    if (!response.ok) {
                        throw new Error(data.message || "The quiz could not be submitted.");
                    }
                    return data;
                });
            }).then(handleSubmissionSuccess).catch(function (error) {
                showSubmissionError(error.message || "The quiz could not be submitted.");
            });
        }
    });

    function showSubmissionError(message) {
        submissionInProgress = false;
        submitButton.disabled = false;
        submitButton.textContent = "Submit Quiz";
        window.alert(message);
    }

    function renderQuizResult() {
        let result = null;

        try {
            result = JSON.parse(localStorage.getItem("quizResult") || "null");
        } catch (error) {
            result = null;
        }

        const validResult = document.getElementById("validResult");
        const missingResult = document.getElementById("missingResult");

        if (!result ||
            typeof result.subject !== "string" ||
            !Number.isInteger(result.score) ||
            !Number.isInteger(result.totalMarks) ||
            !Number.isInteger(result.correctAnswers) ||
            !Number.isInteger(result.wrongAnswers) ||
            !Number.isInteger(result.unansweredQuestions) ||
            !Number.isInteger(result.percentage) ||
            ["Computer Fundamentals", "DBMS", "Java", "Web Technology"].indexOf(result.subject) === -1 ||
            result.totalQuestions !== 10 ||
            result.totalMarks !== 10 ||
            result.correctAnswers + result.wrongAnswers + result.unansweredQuestions !== 10 ||
            result.score !== result.correctAnswers ||
            result.percentage !== Math.round((result.score / 10) * 100)) {
            if (validResult) {
                validResult.hidden = true;
            }
            if (missingResult) {
                missingResult.hidden = false;
            }
            return;
        }

        document.getElementById("resultSubject").textContent = result.subject;
        document.getElementById("resultScore").textContent = result.score;
        document.getElementById("correctAnswers").textContent = result.correctAnswers;
        document.getElementById("wrongAnswers").textContent = result.wrongAnswers;
        document.getElementById("unansweredQuestions").textContent = result.unansweredQuestions;
        document.getElementById("resultPercentage").textContent = result.percentage + "%";

        let message = "Keep learning and try again!";
        if (result.percentage >= 90) {
            message = "Excellent work!";
        } else if (result.percentage >= 70) {
            message = "Great job!";
        } else if (result.percentage >= 50) {
            message = "Good effort! Keep practising.";
        }

        document.getElementById("performanceMessage").textContent = message;
        document.getElementById("scoreRing").style.setProperty("--score-angle", (result.percentage * 3.6) + "deg");
    }

    previousButton.disabled = true;
    nextButton.disabled = true;
    submitButton.disabled = true;
    questionText.textContent = "Loading questions...";
    quizOptions.innerHTML = "";
    progressHeader.textContent = "Loading quiz...";

    function processLoadedQuestions(response) {
        if (!response || response.success !== true || !Array.isArray(response.questions) || response.questions.length === 0) {
            showLoadError("Questions could not be loaded.");
            return;
        }

        const isValidQuestionSet = response.questions.every(function (question) {
            return question &&
                typeof question.id !== "undefined" &&
                typeof question.text === "string" &&
                Array.isArray(question.options) &&
                question.options.length === 4 &&
                question.options.every(function (option) {
                    return option && typeof option.id === "string" && typeof option.text === "string";
                });
        });

        if (!isValidQuestionSet) {
            showLoadError("The question response was not valid.");
            return;
        }

        questions = response.questions;
        currentQuestion = 0;
        submitButton.disabled = false;
        renderQuestion();
    }

    if (window.jQuery) {
        window.jQuery.ajax({
            url: "php/getquestions.php",
            method: "POST",
            dataType: "json",
            data: { subject: subjectName }
        }).done(processLoadedQuestions).fail(function (xhr) {
            let message = "Questions could not be loaded. Please try again.";

            if (xhr && xhr.responseJSON && typeof xhr.responseJSON.message === "string") {
                message = xhr.responseJSON.message;
            } else if (xhr && xhr.status === 404) {
                message = "The question service could not be found.";
            }

            showLoadError(message);
        });
    } else {
        fetch("php/getquestions.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: "subject=" + encodeURIComponent(subjectName)
        }).then(function (response) {
            return response.json().catch(function () {
                throw new Error("The question response was not valid.");
            }).then(function (data) {
                if (!response.ok) {
                    throw new Error(data.message || "Questions could not be loaded.");
                }
                return data;
            });
        }).then(processLoadedQuestions).catch(function (error) {
            showLoadError(error.message || "Questions could not be loaded.");
        });
    }

    function showLoadError(message) {
        questionText.textContent = message;
        quizOptions.innerHTML = "";
        questionMap.innerHTML = "";
        answeredCount.textContent = "0 answered";
        progressHeader.textContent = "Unable to load quiz";
        previousButton.disabled = true;
        nextButton.disabled = true;
        submitButton.disabled = true;
    }
});