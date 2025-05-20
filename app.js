require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');
const express = require('express');

// 익스프레스 앱 생성 및 슬랙 봇과 통합
const expressApp = express();
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  customRoutes: [
    {
      path: '/',
      method: ['GET'],
      handler: (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('슬랙 다이어그램 봇 서버가 정상 동작 중입니다.');
      },
    },
  ],
});

// 슬랙에서 봇이 멘션되었을 때 응답
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
      const imageUrl = response.data?.imageUrl;
      if (imageUrl) {
        await say({
          text: '다이어그램이 생성되었습니다!',
          attachments: [
            {
              image_url: imageUrl,
              alt_text: '생성된 다이어그램',
            },
          ],
        });
      } else {
        await say('다이어그램 생성에는 성공했으나 이미지를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error(error);
      await say('다이어그램 생성 중 오류가 발생했습니다.');
    }
    return;
  }

  // 기본 응답
  await say(`안녕하세요! 다이어그램을 생성하려면 예시처럼 입력해 주세요.\n예: 플로우차트: 시작 -> 처리 -> 종료`);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack 다이어그램 봇이 실행 중입니다!');
  console.log(`서버 주소: http://localhost:${process.env.PORT || 3000}`);
})(); 