// 가장 기본적인 Express 서버
const express = require('express');
const app = express();

console.log('서버 초기화 중...');

// 미들웨어 추가
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 루트 경로
app.get('/', (req, res) => {
  console.log('루트 경로 요청 처리');
  res.send('서버가 정상 작동 중입니다!');
});

// 슬랙 이벤트 경로
app.get('/slack/events', (req, res) => {
  console.log('슬랙 이벤트 GET 요청 처리');
  res.send('슬랙 이벤트 엔드포인트 테스트 (GET)');
});

app.post('/slack/events', (req, res) => {
  console.log('슬랙 이벤트 POST 요청 처리');
  res.status(200).send('슬랙 이벤트 엔드포인트 테스트 (POST)');
});

// 서버 시작
const PORT = 3001; // 다른 포트 사용
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`테스트 서버가 포트 ${PORT}에서 실행 중입니다!`);
  });
  console.log('서버 리스닝 시작됨');
} catch (error) {
  console.error('서버 시작 중 오류:', error);
} 