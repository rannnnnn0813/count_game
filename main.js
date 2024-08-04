const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const words = ['a', 'the', 'is', 'this', 'that'];
let currentWord;
let players = [];
let globalScoreCurrent = 0;
let globalScoreHighest = 0;


function selectRandomWord(words) {
    return words[Math.floor(Math.random() * words.length)];
}
console.log("Hello World!");

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('requestRole', () => {
        let role;
        if (players.length < 2) {
            role = `player${players.length + 1}`;
            players.push(socket.id);
        } else {
            role = 'spectator';
        }
        socket.emit('playerRole', role);
    });

    socket.on('requestNewWord', () => {
        currentWord = selectRandomWord(words);
        console.log(`New word selected: ${currentWord}`); // デバッグメッセージ
        io.emit('newWord', currentWord);
        globalScoreHighest = 0;
    });

    socket.on('Scoreshare', () => {
        //currentWord = selectRandomWord(words);
        console.log(`scoreshare kicked: `); // デバッグメッセージ
        io.emit('Scoreshare', globalScoreHighest);
    });

    socket.on('sendResult', (wordCount) => {
        //currentWord = selectRandomWord(words);
        console.log(`recmsg : `); // デバッグメッセージ
        console.log(wordCount);
        globalScoreCurrent = wordCount;
        if (globalScoreHighest < globalScoreCurrent) {
            globalScoreHighest = globalScoreCurrent;
        }
        
        
        //io.emit('Scoreshare', 'testtushin');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        players = players.filter(id => id !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
