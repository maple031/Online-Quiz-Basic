<?php

header('Content-Type: application/json; charset=UTF-8');

function sendCheckResponse($statusCode, $success, $message, $result = null)
{
    http_response_code($statusCode);
    $response = array(
        'success' => $success,
        'message' => $message
    );

    if ($result !== null) {
        $response['result'] = $result;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

$rawInput = file_get_contents('php://input');
$contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
$request = array();

if (strpos($contentType, 'application/json') !== false) {
    $decoded = json_decode($rawInput, true);
    if (!is_array($decoded)) {
        sendCheckResponse(400, false, 'Malformed submission data.');
    }
    $request = $decoded;
} else {
    $request = $_POST;

    if (isset($_POST['answers']) && is_string($_POST['answers'])) {
        $decodedAnswers = json_decode($_POST['answers'], true);
        if (is_array($decodedAnswers)) {
            $request['answers'] = $decodedAnswers;
        }
    }
}

$subjectName = isset($request['subject']) ? trim((string) $request['subject']) : '';
$submittedAnswers = isset($request['answers']) && is_array($request['answers'])
    ? $request['answers']
    : null;

if ($subjectName === '') {
    sendCheckResponse(400, false, 'The subject is missing.');
}

if ($submittedAnswers === null) {
    sendCheckResponse(400, false, 'Submitted answers are missing or malformed.');
}

$xmlPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'questions.xml';

if (!is_file($xmlPath) || !is_readable($xmlPath)) {
    sendCheckResponse(500, false, 'The question bank is currently unavailable.');
}

libxml_use_internal_errors(true);
$xml = simplexml_load_file($xmlPath);

if ($xml === false) {
    libxml_clear_errors();
    sendCheckResponse(500, false, 'The question bank could not be read.');
}

$matchingSubject = null;

foreach ($xml->subject as $subject) {
    if ((string) $subject['name'] === $subjectName) {
        $matchingSubject = $subject;
        break;
    }
}

if ($matchingSubject === null) {
    sendCheckResponse(400, false, 'The selected subject is invalid.');
}

$questionMap = array();

foreach ($matchingSubject->question as $question) {
    $questionId = (string) $question['id'];
    $validOptions = array();

    foreach ($question->option as $option) {
        $validOptions[] = (string) $option['id'];
    }

    $questionMap[$questionId] = array(
        'options' => $validOptions,
        'answer' => (string) $question->answer
    );
}

if (count($questionMap) !== 10) {
    sendCheckResponse(500, false, 'The selected subject does not contain a complete question set.');
}

foreach ($submittedAnswers as $questionId => $selectedOption) {
    $questionId = (string) $questionId;

    if (!array_key_exists($questionId, $questionMap)) {
        sendCheckResponse(400, false, 'The submission contains an invalid question ID.');
    }

    if (!is_string($selectedOption) && !is_int($selectedOption)) {
        sendCheckResponse(400, false, 'The submission contains an invalid answer.');
    }

    $selectedOption = (string) $selectedOption;

    if (!in_array($selectedOption, $questionMap[$questionId]['options'], true)) {
        sendCheckResponse(400, false, 'The submission contains an invalid option ID.');
    }
}

$correctAnswers = 0;

foreach ($questionMap as $questionId => $questionData) {
    if (array_key_exists($questionId, $submittedAnswers)) {
        $selectedOption = (string) $submittedAnswers[$questionId];

        if ($selectedOption === $questionData['answer']) {
            $correctAnswers++;
        }
    }
}

$totalQuestions = count($questionMap);
$wrongAnswers = 0;
$unansweredQuestions = 0;

foreach ($questionMap as $questionId => $questionData) {
    if (!array_key_exists($questionId, $submittedAnswers)) {
        $unansweredQuestions++;
    } elseif ((string) $submittedAnswers[$questionId] !== $questionData['answer']) {
        $wrongAnswers++;
    }
}

$score = $correctAnswers;
$percentage = (int) round(($score / $totalQuestions) * 100);

$result = array(
    'subject' => $subjectName,
    'totalQuestions' => $totalQuestions,
    'correctAnswers' => $correctAnswers,
    'wrongAnswers' => $wrongAnswers,
    'unansweredQuestions' => $unansweredQuestions,
    'score' => $score,
    'totalMarks' => $totalQuestions,
    'percentage' => $percentage
);

sendCheckResponse(200, true, 'Quiz answers checked successfully.', $result);