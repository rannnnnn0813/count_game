import { FilesetResolver, LlmInference } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai';

const input = document.getElementById('input');
const output = document.getElementById('output');
const submitText = document.getElementById('submitText');
const countResult = document.getElementById('countResult');
const roleElement = document.getElementById('role');
const wordDisplay = document.getElementById('targetWord');
const requestWordButton = document.getElementById('requestWordButton'); // 新しいボタン

const modelFileName = 'gemma-2b-it-gpu-int4.bin';
const socket = io();

let playerRole;
let targetWord;
let myscore = 0;

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

socket.on('Scoreshare', (scorereslut) => {
    console.log(`Score resluts received: ${scorereslut}`); // デバッグメッセージ
    //targetWord = word;
    //wordDisplay.textContent = targetWord;
    //output.textContent = '';
    //countResult.textContent = '';
    console.log('myscore');
    console.log(myscore);
    console.log('scoreresult');
    console.log(scorereslut);
    let strtmp;
    if (myscore >= scorereslut) {
        strtmp = 'You Are Winner!';
    } else {
        strtmp = 'You Are Loser...';
    }
    scoreDisplay.textContent = `${strtmp} Highest score: ${scorereslut}`;
    //output.textContent = '';
    //countResult.textContent = '';
});

requestWordButton.onclick = () => {
    console.log('Request Word Button Clicked'); // デバッグメッセージ
    socket.emit('requestNewWord');
};

reslutWordButton.onclick = () => {
    console.log('Reslut Word Button Clicked'); // デバッグメッセージ
    socket.emit('Scoreshare');
};

submitText.onclick = () => {
    const playerText = input.value.trim();
    socket.emit('submitText', playerText);
    runInference(playerText);
};



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
        baseOptions: { modelAssetPath: modelFileName },
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
