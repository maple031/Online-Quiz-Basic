<?php

header('Content-Type: application/json; charset=UTF-8');

function sendJsonResponse($statusCode, $success, $message, $questions = null)
{
    http_response_code($statusCode);
    $response = array(
        'success' => $success,
        'message' => $message
    );

    if ($questions !== null) {
        $response['questions'] = $questions;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

$subjectName = isset($_POST['subject']) ? trim($_POST['subject']) : '';

if ($subjectName === '') {
    if (isset($_GET['subject'])) {
        $subjectName = trim($_GET['subject']);
    }
}

if ($subjectName === '') {
    sendJsonResponse(400, false, 'No subject was selected.');
}

$xmlPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'questions.xml';

if (!is_file($xmlPath) || !is_readable($xmlPath)) {
    sendJsonResponse(500, false, 'The question bank is currently unavailable.');
}

libxml_use_internal_errors(true);
$xml = simplexml_load_file($xmlPath);

if ($xml === false) {
    libxml_clear_errors();
    sendJsonResponse(500, false, 'The question bank could not be read.');
}

$matchingSubject = null;

foreach ($xml->subject as $subject) {
    if ((string) $subject['name'] === $subjectName) {
        $matchingSubject = $subject;
        break;
    }
}

if ($matchingSubject === null) {
    sendJsonResponse(400, false, 'The selected subject is invalid.');
}

$questions = array();

foreach ($matchingSubject->question as $question) {
    $options = array();

    foreach ($question->option as $option) {
        $options[] = array(
            'id' => (string) $option['id'],
            'text' => trim((string) $option)
        );
    }

    $questions[] = array(
        'id' => (string) $question['id'],
        'text' => trim((string) $question->text),
        'options' => $options
    );
}

if (count($questions) !== 10) {
    sendJsonResponse(500, false, 'The selected subject does not contain a complete question set.');
}

sendJsonResponse(200, true, 'Questions loaded successfully.', $questions);