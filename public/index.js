import { FilesetResolver, LlmInference } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai';

const input = document.getElementById('input');
const output = document.getElementById('output');
const submitText = document.getElementById('submitText');
const countResult = document.getElementById('countResult');
const roleElement = document.getElementById('role');
const wordDisplay = document.getElementById('targetWord');
const requestWordButton = document.getElementById('requestWordButton'); // 新しいボタン
const loadModelInput = document.getElementById('load_model'); // モデルファイル読み込み用の新しいボタン
const reslutWordButton = document.getElementById('reslutWordButton'); // 追加
const scoreDisplay = document.getElementById('scoreWord'); // 追加

const socket = io();

let playerRole;
let targetWord;
let myscore = 0;
let modelUrl;

socket.emit('requestRole');

socket.on('playerRole', (role) => {
    if (role === 'spectator') {
        roleElement.textContent = 'Spectator';
        submitText.disabled = true;
    } else {
        playerRole = role;
        roleElement.textContent = `You are ${role}`;
        submitText.disabled = false;
    }
});

socket.on('newWord', (word) => {
    console.log(`New word received: ${word}`); // デバッグメッセージ
    targetWord = word;
    wordDisplay.textContent = targetWord;
    output.textContent = '';
    countResult.textContent = '';
});

socket.on('Scoreshare', (scoreresult) => {
    console.log(`Score results received: ${scoreresult}`); // デバッグメッセージ
    console.log('myscore');
    console.log(myscore);
    console.log('scoreresult');
    console.log(scoreresult);
    let strtmp;
    if (myscore >= scoreresult) {
        strtmp = 'You Are Winner!';
    } else {
        strtmp = 'You Are Loser...';
    }
    scoreDisplay.textContent = `${strtmp} Highest score: ${scoreresult}`;
});

requestWordButton.onclick = () => {
    console.log('Request Word Button Clicked'); // デバッグメッセージ
    socket.emit('requestNewWord');
};

reslutWordButton.onclick = () => {
    console.log('Result Word Button Clicked'); // デバッグメッセージ
    socket.emit('Scoreshare');
};

submitText.onclick = () => {
    const playerText = input.value.trim();
    socket.emit('submitText', playerText);
    runInference(playerText);
};

// モデルファイル読み込みのイベントリスナーを追加
loadModelInput.addEventListener('change', function () {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        modelUrl = URL.createObjectURL(blob);
        console.log('Model loaded');
    };
    reader.readAsArrayBuffer(file);
});

async function runInference(playerText) {
    const genaiFileset = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
    );
    let llmInference;

    function displayPartialResults(partialResults, complete) {
        output.textContent += partialResults;
        if (complete) {
            const wordCount = countWordOccurrences(output.textContent, targetWord);
            countResult.textContent = `The word "${targetWord}" appears ${wordCount} times in the LLM's response.`;
            submitText.disabled = false;
            console.log('word count finished'); // デバッグメッセー
            socket.emit('sendResult', wordCount);
            myscore = wordCount;
        }
    }

    LlmInference.createFromOptions(genaiFileset, {
        baseOptions: { modelAssetPath: modelUrl },
    })
    .then(llm => {
        llmInference = llm;
        llmInference.generateResponse(playerText, displayPartialResults);
    })
    .catch(() => {
        alert('Failed to initialize the task.');
    });
}

function countWordOccurrences(text, word) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return (text.match(regex) || []).length;
}
