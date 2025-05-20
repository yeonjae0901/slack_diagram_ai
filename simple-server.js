// 가장 기본적인 Express 서버
const express = require('express');
const app = express();

// 루트 경로
app.get('/', (req, res) => {
  res.send('서버가 정상 작동 중입니다!');
});

// 슬랙 이벤트 경로
app.get('/slack/events', (req, res) => {
  res.send('슬랙 이벤트 엔드포인트 테스트 (GET)');
});

app.post('/slack/events', (req, res) => {
  res.status(200).send('슬랙 이벤트 엔드포인트 테스트 (POST)');
});

// 서버 시작
const PORT = 3001; // 다른 포트 사용
app.listen(PORT, '0.0.0.0', () => {
  console.log(`테스트 서버가 포트 ${PORT}에서 실행 중입니다!`);
}); 