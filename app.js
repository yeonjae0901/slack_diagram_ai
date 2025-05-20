require('dotenv').config();
const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const bodyParser = require('body-parser');

// 환경 변수 확인
console.log('환경 변수 확인:');
console.log('- SLACK_BOT_TOKEN 설정 여부:', !!process.env.SLACK_BOT_TOKEN);
console.log('- SLACK_SIGNING_SECRET 설정 여부:', !!process.env.SLACK_SIGNING_SECRET);
console.log('- ERASER_API_KEY 설정 여부:', !!process.env.ERASER_API_KEY);

// Express 앱 생성
const app = express();

// Express 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 슬랙 이벤트 어댑터 생성
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

// 슬랙 웹 클라이언트 생성
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

// Express에 기본 경로 응답 추가
app.get('/', (req, res) => {
  res.status(200).send('슬랙 다이어그램 생성봇 서버가 동작 중입니다.');
});

// 슬랙 이벤트 엔드포인트 명시적 설정
app.get('/slack/events', (req, res) => {
  res.send('슬랙 이벤트 엔드포인트가 정상 동작 중입니다.');
});

// 디버깅용 라우트
app.post('/echo', (req, res) => {
  console.log('수신된 데이터:', req.body);
  res.status(200).send('데이터 수신 완료');
});

// 슬랙 이벤트 엔드포인트에 이벤트 어댑터 연결
app.use('/slack/events', slackEvents.requestListener());

// 앱 멘션 이벤트 처리
slackEvents.on('app_mention', async (event) => {
  console.log('앱 멘션 이벤트 수신:', event);
  
  try {
    // 기본 응답 전송
    await web.chat.postMessage({
      channel: event.channel,
      text: `안녕하세요! 다이어그램을 생성하려면 다음과 같이 입력해 주세요:\n> 플로우차트: 시작 -> 처리 -> 종료`
    });
    console.log('기본 응답 전송 완료');
  } catch (error) {
    console.error('슬랙 응답 전송 중 오류:', error);
  }
});

// 에러 이벤트 처리
slackEvents.on('error', (error) => {
  console.error('슬랙 이벤트 처리 중 오류:', error);
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚡️ 슬랙 다이어그램 봇이 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`⚡️ 슬랙 이벤트 URL: http://your-server:${PORT}/slack/events`);
  console.log('⚠️ 주의: 슬랙은 https URL만 허용합니다. nginx 또는 ngrok으로 https 설정이 필요합니다.');
}); 