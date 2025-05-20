require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const axios = require('axios');
const express = require('express');

// ExpressReceiver 생성 (Bolt와 Express 통합)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Express 앱에 접근
const expressApp = receiver.app;

// Slack 앱 설정
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Express에 기본 경로 응답 추가
expressApp.get('/', (req, res) => {
  res.status(200).send('슬랙 다이어그램 생성봇 서버가 동작 중입니다.');
});

// 슬랙 메시지 처리 - 멘션 시
app.event('app_mention', async ({ event, say }) => {
  const text = event.text || '';

  // 플로우차트 명령어 감지
  const flowchartPrefix = '플로우차트:';
  if (text.includes(flowchartPrefix)) {
    const diagramText = text.split(flowchartPrefix)[1].trim();
    if (!diagramText) {
      await say('다이어그램 내용을 입력해 주세요. 예: 플로우차트: 시작 -> 처리 -> 종료');
      return;
    }

    try {
      // 작업 시작 메시지
      await say('다이어그램을 생성 중입니다...');
      
      // Eraser API로 다이어그램 생성 (예시)
      const response = await axios.post(
        'https://api.eraser.io/v1/diagrams',
        {
          content: diagramText,
          type: 'flowchart',
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ERASER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // 생성된 다이어그램 이미지 URL (예시)
      const imageUrl = response.data?.imageUrl || response.data?.url;
      if (imageUrl) {
        await say({
          text: '다이어그램이 생성되었습니다!',
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "다이어그램이 생성되었습니다!"
              }
            },
            {
              type: "image",
              title: {
                type: "plain_text",
                text: "생성된 다이어그램"
              },
              image_url: imageUrl,
              alt_text: "생성된 다이어그램"
            }
          ]
        });
      } else {
        await say('다이어그램 생성에는 성공했으나 이미지를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Eraser API 에러:', error.response?.data || error.message);
      await say('다이어그램 생성 중 오류가 발생했습니다.');
    }
    return;
  }

  // 기본 응답
  await say(`안녕하세요! 다이어그램을 생성하려면 다음과 같이 입력해 주세요:\n> 플로우차트: 시작 -> 처리 -> 종료`);
});

// 서버 시작
const PORT = process.env.PORT || 3000;

(async () => {
  // 앱 시작
  await app.start({
    port: PORT,
    host: '0.0.0.0'
  });
  console.log(`⚡️ 슬랙 다이어그램 봇이 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`⚡️ 슬랙 이벤트 URL: http://localhost:${PORT}/slack/events`);
})(); 