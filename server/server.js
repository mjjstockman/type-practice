const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const DAILY_API_KEY =
  '290af5f84202cde2e63db817c511e6211c8ea02ba151acad98db5c088f11f30f';

let rooms = {
  'Room 1': {
    connectedPlayers: 0,
    readyPlayers: 0,
    gameInProgress: false,
    winnerDeclared: false,
    dailyRoomUrl: '',
  },
  'Room 2': {
    connectedPlayers: 0,
    readyPlayers: 0,
    gameInProgress: false,
    winnerDeclared: false,
    dailyRoomUrl: '',
  },
  'Room 3': {
    connectedPlayers: 0,
    readyPlayers: 0,
    gameInProgress: false,
    winnerDeclared: false,
    dailyRoomUrl: '',
  },
};

async function createDailyRoom() {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        exp: Math.round(Date.now() / 1000) + 60 * 30,
      },
    }),
  });

  const data = await response.json();
  return data.url; // Return the room URL
}

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  socket.on('joinRoom', async ({ roomId }) => {
    socket.join(roomId);
    rooms[roomId].connectedPlayers++;

    // If the room doesn't have a Daily.co room yet, create one
    if (!rooms[roomId].dailyRoomUrl) {
      const dailyRoomUrl = await createDailyRoom();
      rooms[roomId].dailyRoomUrl = dailyRoomUrl;
    }

    io.to(roomId).emit('playerUpdate', {
      connectedPlayers: rooms[roomId].connectedPlayers,
      readyPlayers: rooms[roomId].readyPlayers,
      dailyRoomUrl: rooms[roomId].dailyRoomUrl,
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      rooms[roomId].connectedPlayers--;

      io.to(roomId).emit('playerUpdate', {
        connectedPlayers: rooms[roomId].connectedPlayers,
        readyPlayers: rooms[roomId].readyPlayers,
        dailyRoomUrl: rooms[roomId].dailyRoomUrl,
      });
    });
  });

  socket.on('playerReady', ({ roomId }) => {
    rooms[roomId].readyPlayers++;

    io.to(roomId).emit('playerUpdate', {
      connectedPlayers: rooms[roomId].connectedPlayers,
      readyPlayers: rooms[roomId].readyPlayers,
      dailyRoomUrl: rooms[roomId].dailyRoomUrl,
    });

    if (
      rooms[roomId].connectedPlayers === rooms[roomId].readyPlayers &&
      rooms[roomId].connectedPlayers > 0
    ) {
      rooms[roomId].gameInProgress = true;
      io.to(roomId).emit('gameStart', {
        message: "GO!!!! Type the word 'mystery jets' to win!",
      });
    }
  });

  socket.on('typedWord', (data) => {
    const { word, roomId } = data;
    const targetWord = 'mystery jets';
    const room = rooms[roomId];

    if (room.gameInProgress && !room.winnerDeclared) {
      if (word === targetWord) {
        room.winnerDeclared = true;
        socket.emit('result', { message: 'You won!' });
        socket.broadcast.to(roomId).emit('result', { message: 'You lost!' });
        room.gameInProgress = false;
      }
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
