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

// 슬래시 명령어 처리 - /diagram
app.command('/diagram', async ({ command, ack, respond, client }) => {
  try {
    // 명령어 즉시 확인 (3초 내에 호출 필요)
    await ack();
    log(`슬래시 명령어 수신: ${JSON.stringify(command)}`);
    
    const text = command.text || '';
    log(`받은 명령어 텍스트: ${text}`);

    if (!text) {
      // 텍스트가 없는 경우 사용법 안내
      log('텍스트 없음, 사용법 안내');
      await respond(`다이어그램을 생성하려면 다음과 같이 입력해 주세요:\n> /diagram 플로우차트: 시작 -> 처리 -> 종료`);
      return;
    }

    // 간단한 다이어그램 유형 감지 (단일 패턴 기반)
    let diagramType = 'flowchart'; // 기본값
    let diagramText = text; // 기본적으로 전체 텍스트 사용
    
    // diagramType 추출 패턴 분석
    const typePatterns = [
      /^(플로우차트|flowchart|flow)\s*:\s*([\s\S]+)$/i,
      /^(시퀀스|sequence|seq)\s*:\s*([\s\S]+)$/i,
      /^(마인드맵|mindmap)\s*:\s*([\s\S]+)$/i,
      /^(erd|er)\s*:\s*([\s\S]+)$/i,
      /^(클래스|class)\s*:\s*([\s\S]+)$/i,
      /^(클라우드|cloud|ca)\s*:\s*([\s\S]+)$/i
    ];
    
    // 매칭되는 패턴 찾기
    for (const pattern of typePatterns) {
      const match = text.match(pattern);
      if (match) {
        // 매칭된 유형에 따라 diagramType 설정
        const typeText = match[1].toLowerCase().trim();
        
        // 유형 매핑
        const typeMap = {
          '플로우차트': 'flowchart', 
          'flowchart': 'flowchart',
          'flow': 'flowchart',
          '시퀀스': 'sequence', 
          'sequence': 'sequence',
          'seq': 'sequence',
          '마인드맵': 'mindmap',
          'mindmap': 'mindmap',
          'erd': 'entity-relationship-diagram',
          'er': 'entity-relationship-diagram',
          '클래스': 'class',
          'class': 'class',
          '클라우드': 'cloud-architecture-diagram',
          'cloud': 'cloud-architecture-diagram',
          'ca': 'cloud-architecture-diagram'
        };
        
        if (typeMap.hasOwnProperty(typeText)) {
          diagramType = typeMap[typeText];
          // 중요: 패턴의 두 번째 그룹(match[2])에 콜론 이후의 모든 텍스트가 포함됨
          diagramText = match[2];
          log(`다이어그램 유형 감지: ${diagramType}`);
          log(`diagramText (패턴 매칭된 콘텐츠, 길이: ${diagramText.length}): ${diagramText}`);
          break; // 첫 번째 매칭된 패턴에서 중단
        }
      }
    }
    
    // 줄바꿈 처리
    diagramText = diagramText.replace(/\\n/g, '\n');
    
    log(`최종 diagramText (API 전달 전, 길이: ${diagramText.length}): ${diagramText}`);
    log('입력 처리 완료');

    // 작업 시작 메시지 (즉시 응답)
    await respond({
      response_type: 'in_channel',  // 채널에 명령어를 표시하도록 설정
      text: `"${text}" 다이어그램을 생성 중입니다...`
    });
    log(`다이어그램 생성 시작 - 유형: ${diagramType}, 내용: ${diagramText}`);
    
    // 비동기 작업 시작 (백그라운드에서 처리)
    (async () => {
      try {
        // 입력을 그대로 사용 (전처리 없음)
        log(`최종 API 전달 직전 diagramText: ${diagramText}`); // 최종 전달될 텍스트 로깅
        log(`Eraser API 요청: text: ${diagramText}, diagramType: ${diagramType}`);
        
        const apiParams = {
          text: diagramText,
          theme: "light"
        };

        if (diagramType) {
          apiParams.diagramType = diagramType;
        }
        
        const response = await axios.post(
          'https://app.eraser.io/api/render/prompt',
          apiParams,
          {
            headers: {
              'Authorization': `Bearer ${process.env.ERASER_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // 응답 로깅
        log(`Eraser API 응답: ${JSON.stringify(response.data)}`);

        // 생성된 다이어그램 이미지 URL
        const imageUrl = response.data?.imageUrl || response.data?.url;
        if (imageUrl) {
          try {
            // response_url을 사용하여 응답 (channels:join 권한 필요 없음)
            log(`응답 URL로 메시지 전송 시도: ${command.response_url}`);
            
            await axios.post(command.response_url, {
              response_type: 'in_channel',
              replace_original: false,
              text: '다이어그램이 생성되었습니다!',
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*명령어:* \`/diagram ${text}\`\n\n다이어그램이 생성되었습니다!`
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
            
            log('다이어그램 생성 완료 - 이미지 URL: ' + imageUrl);
          } catch (postError) {
            // 응답 URL 오류 로깅
            log(`응답 URL 전송 오류: ${postError.message}`);
            
            try {
              // DM으로 전송 시도
              const dmResult = await client.chat.postMessage({
                channel: command.user_id,
                text: `채널에 메시지를 전송하지 못했습니다. 다이어그램은 다음 링크에서 확인할 수 있습니다: ${imageUrl}`
              });
              log(`DM 전송 성공: ${dmResult.ts}`);
            } catch (dmError) {
              log(`DM 전송 실패: ${dmError.message}`);
            }
          }
        } else {
          try {
            await axios.post(command.response_url, {
              response_type: 'in_channel',
              replace_original: false,
              text: '다이어그램 생성에는 성공했으나 이미지를 찾을 수 없습니다.'
            });
          } catch (postError) {
            log(`응답 URL 전송 오류: ${postError.message}`);
            try {
              // DM으로 전송 시도
              await client.chat.postMessage({
                channel: command.user_id,
                text: '다이어그램 생성에는 성공했으나 이미지를 찾을 수 없습니다.'
              });
            } catch (dmError) {
              log(`DM 전송 실패: ${dmError.message}`);
            }
          }
          log('다이어그램 생성 완료 - 이미지 URL 없음');
        }
      } catch (error) {
        log(`Eraser API 에러: ${error.response?.data || error.message}`);
        try {
          await axios.post(command.response_url, {
            response_type: 'in_channel',
            replace_original: false,
            text: '다이어그램 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          });
        } catch (postError) {
          log(`응답 URL 전송 오류: ${postError.message}`);
          try {
            // DM으로 전송 시도
            await client.chat.postMessage({
              channel: command.user_id,
              text: '다이어그램 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            });
          } catch (dmError) {
            log(`DM 전송 실패: ${dmError.message}`);
          }
        }
      }
    })();
    
  } catch (error) {
    log(`슬래시 명령어 처리 에러: ${error.message}`);
    try {
      await respond('명령어 처리 중 오류가 발생했습니다.');
    } catch (respondError) {
      log(`응답 전송 중 추가 에러: ${respondError.message}`);
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