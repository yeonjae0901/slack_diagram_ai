// 가장 간단한 HTTP 서버
const http = require('http');

console.log('서버 초기화 중...');

// 간단한 HTTP 서버 생성
const server = http.createServer((req, res) => {
  console.log(`요청 수신: ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('서버가 정상 작동 중입니다!');
  } else if (req.url === '/slack/events' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('슬랙 이벤트 엔드포인트 테스트 (GET)');
  } else if (req.url === '/slack/events' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('슬랙 이벤트 엔드포인트 테스트 (POST)');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 서버 시작
const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`테스트 서버가 포트 ${PORT}에서 실행 중입니다!`);
}); 