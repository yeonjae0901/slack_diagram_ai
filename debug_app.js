require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const axios = require('axios');
const express = require('express');
const fs = require('fs');

// 로그 파일 경로
const LOG_FILE = './debug.log';

// 로그 함수
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage);
}

log('애플리케이션 시작...');
log('환경 변수 확인:');
log(`- SLACK_BOT_TOKEN 설정 여부: ${!!process.env.SLACK_BOT_TOKEN}`);
log(`- SLACK_SIGNING_SECRET 설정 여부: ${!!process.env.SLACK_SIGNING_SECRET}`);
log(`- ERASER_API_KEY 설정 여부: ${!!process.env.ERASER_API_KEY}`);

// ExpressReceiver 생성 (Bolt와 Express 통합)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true // ack를 자동으로 처리
});

// Express 앱에 접근
const expressApp = receiver.app;

// Slack 앱 설정
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  processBeforeResponse: true
});

// Express에 기본 경로 응답 추가
expressApp.get('/', (req, res) => {
  log('GET / 요청 수신');
  res.status(200).send('슬랙 다이어그램 생성봇 서버가 동작 중입니다.');
});

// 슬랙 이벤트 엔드포인트 명시적 설정
expressApp.get('/slack/events', (req, res) => {
  log('GET /slack/events 요청 수신');
  res.send('슬랙 이벤트 엔드포인트가 정상 동작 중입니다.');
});

// 로그 확인용 엔드포인트
expressApp.get('/logs', (req, res) => {
  log('GET /logs 요청 수신');
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.send(`<pre>${logs}</pre>`);
  } catch (error) {
    res.send('로그 파일을 읽을 수 없습니다: ' + error.message);
  }
});

// 모든 이벤트 타입을 처리하는 미들웨어 추가
app.use(async ({ logger, body, next }) => {
  try {
    log(`이벤트 수신: ${JSON.stringify(body)}`);
    // 다음 리스너로 계속 진행
    await next();
  } catch (error) {
    log(`미들웨어 에러: ${error.message}`);
  }
});

// 슬랙 메시지 처리 - 멘션 시
app.event('app_mention', async ({ event, say, ack, body }) => {
  try {
    log(`app_mention 이벤트 수신: ${JSON.stringify(event)}`);
    // 자동 ack 설정으로 인해 ack 함수 호출 불필요
    
    const text = event.text || '';
    log(`받은 메시지: ${text}`);

    // 기본 응답
    log('기본 응답 전송 시도...');
    await say(`안녕하세요! 다이어그램을 생성하려면 다음과 같이 입력해 주세요:\n> 플로우차트: 시작 -> 처리 -> 종료`);
    log('기본 응답 전송 완료');
    
  } catch (error) {
    log(`app_mention 이벤트 처리 에러: ${error.message}`);
    try {
      await say('처리 중 오류가 발생했습니다.');
    } catch (sayError) {
      log(`응답 전송 중 추가 에러: ${sayError.message}`);
    }
  }
});

// 디버깅용 이벤트 핸들러 - 모든 메시지 수신
app.message(async ({ message, say }) => {
  try {
    log(`일반 메시지 수신: ${JSON.stringify(message)}`);
    // 채널 메시지는 응답하지 않음
  } catch (error) {
    log(`메시지 처리 에러: ${error.message}`);
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // 앱 시작
    await app.start({
      port: PORT,
      host: '0.0.0.0'
    });
    log(`슬랙 다이어그램 봇이 포트 ${PORT}에서 실행 중입니다!`);
    log(`슬랙 이벤트 URL: http://localhost:${PORT}/slack/events`);
  } catch (error) {
    log(`서버 시작 에러: ${error.message}`);
  }
})(); 