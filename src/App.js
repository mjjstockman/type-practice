import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  const [typedWord, setTypedWord] = useState('');
  const [gameStatus, setGameStatus] = useState('Waiting to start...');
  const [result, setResult] = useState('');
  const [roomId, setRoomId] = useState('');
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [readyPlayers, setReadyPlayers] = useState(0);
  const [dailyRoomUrl, setDailyRoomUrl] = useState('');

  useEffect(() => {
    socket.on('gameStart', (data) => {
      setGameStatus(data.message);
    });

    socket.on('result', (data) => {
      setResult(data.message);
    });

    socket.on('playerUpdate', (data) => {
      setConnectedPlayers(data.connectedPlayers);
      setReadyPlayers(data.readyPlayers);
      setDailyRoomUrl(data.dailyRoomUrl);
    });

    return () => {
      socket.off('gameStart');
      socket.off('result');
      socket.off('playerUpdate');
    };
  }, []);

  const handleInputChange = (e) => {
    setTypedWord(e.target.value);
    socket.emit('typedWord', { roomId, word: e.target.value });
  };

  const handleJoinRoom = (roomNumber) => {
    const room = `Room ${roomNumber}`;
    setRoomId(room);
    socket.emit('joinRoom', { roomId: room });
  };

  const handleStartGame = () => {
    if (roomId) {
      socket.emit('playerReady', { roomId });
    }
  };

  return (
    <div>
      <h1>Typing Game</h1>

      <div>
        <h2>Choose a Room to Join:</h2>
        <button onClick={() => handleJoinRoom(1)}>Join Room 1</button>
        <button onClick={() => handleJoinRoom(2)}>Join Room 2</button>
        <button onClick={() => handleJoinRoom(3)}>Join Room 3</button>
      </div>

      <p>Room ID: {roomId}</p>

      <p>{gameStatus}</p>
      <p>
        Connected players in {roomId}: {connectedPlayers}
      </p>
      <p>
        Players ready in {roomId}: {readyPlayers}
      </p>

      {result ? (
        <h2>{result}</h2>
      ) : (
        <>
          <input
            type='text'
            value={typedWord}
            onChange={handleInputChange}
            placeholder='Type word here...'
            disabled={result !== ''}
          />
          <button onClick={handleStartGame} disabled={!roomId}>
            I'm Ready
          </button>
        </>
      )}

      {dailyRoomUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>Join the video call below:</p>
          {/* Embed the Daily.co video room */}
          <iframe
            src={dailyRoomUrl}
            allow='camera; microphone; fullscreen'
            style={{ width: '100%', height: '500px', border: '0' }}
            title='Daily Video Room'
          />
        </div>
      )}
    </div>
  );
}

export default App;
