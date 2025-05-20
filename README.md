# 슬랙 다이어그램 생성봇

슬랙에서 다이어그램을 생성하는 봇입니다. Eraser API를 사용하여 다양한 다이어그램(플로우차트, 시퀀스 다이어그램 등)을 생성할 수 있습니다.

## 기능

- 슬랙에서 봇 멘션으로 다이어그램 생성 요청
- 슬랙 슬래시 커맨드(`/diagram`)로 다이어그램 생성
- 다양한 다이어그램 유형 지원 (플로우차트, 시퀀스 다이어그램, ERD, 클라우드 아키텍처 등)
- 생성된 다이어그램 이미지 슬랙에 표시

## 지원 다이어그램 유형

| 명령어 (별칭) | 다이어그램 유형 |
|-------------|--------------|
| 플로우차트, flowchart, flow | 플로우차트 (흐름도) |
| 시퀀스, sequence, seq | 시퀀스 다이어그램 (순서도) |
| 마인드맵, mindmap | 마인드맵 |
| erd, er | 엔티티 관계 다이어그램 |
| 클래스다이어그램, class | 클래스 다이어그램 |
| 클라우드, cloud, cad, ca | 클라우드 아키텍처 다이어그램 |

## 설치 및 실행

### 사전 준비

1. 슬랙 앱 생성 및 봇 토큰 발급
2. Eraser API 키 발급

### 설치

```bash
git clone https://github.com/yeonjae0901/slack_diagram_ai.git
cd slack_diagram_ai
npm install
```

### 환경 변수 설정

`.env` 파일을 생성하고 아래 내용을 입력:

```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
ERASER_API_KEY=your-eraser-api-key-here
```

### 실행

```bash
npm start
```

## 사용 방법

### 슬랙 멘션 사용

슬랙에서 봇을 멘션하고 명령어를 입력:

```
@다이어그램봇 플로우차트: 시작 -> 처리 -> 종료
```

### 슬래시 커맨드 사용

슬랙에서 슬래시 커맨드를 사용하여 다이어그램 생성:

```
/diagram flow: 사용자 가입 -> 이메일 인증 -> 프로필 작성 -> 가입 완료
/diagram seq: 클라이언트 -> 서버: 로그인 요청, 서버 -> 데이터베이스: 사용자 확인, 서버 -> 클라이언트: 인증 토큰 발급
/diagram er: 사용자(id, 이름, 이메일) -> 주문(id, 날짜, 금액), 주문 -> 상품(id, 이름, 가격)
/diagram ca: 사용자 -> API 게이트웨이 -> Lambda 함수 -> DynamoDB
```

## 슬랙 앱 설정

### Event Subscriptions

1. Slack API 사이트에서 앱 설정 페이지로 이동
2. 'Event Subscriptions' 메뉴에서 'Enable Events' 옵션 켜기
3. Request URL에 서버 주소 입력 (예: `http://43.201.23.35:3000/slack/events`)
4. 'Subscribe to bot events'에서 `app_mention` 이벤트 추가
5. 설정 저장

### Slash Commands

1. Slack API 사이트에서 앱 설정 페이지로 이동
2. 'Slash Commands' 메뉴에서 'Create New Command' 클릭
3. Command: `/diagram` 입력
4. Request URL: 서버 주소 입력 (예: `http://43.201.23.35:3000/slack/events`)
5. Short Description: `다이어그램을 생성합니다` 입력
6. 설정 저장

## AWS EC2 배포

1. EC2 인스턴스 생성 및 Node.js 설치
2. 보안 그룹에서 3000번 포트 오픈
3. 코드 클론 및 의존성 설치

```bash
git clone https://github.com/yeonjae0901/slack_diagram_ai.git
cd slack_diagram_ai
npm install
vim .env  # 환경변수 설정
```

4. PM2로 서버 실행

```bash
npm install -g pm2
pm2 start command_app.js  # 슬래시 커맨드 지원 앱 실행
pm2 save
pm2 startup
```

## 트러블슈팅

- "Request URL Your URL didn't respond": 서버가 실행 중인지, 포트가 열려 있는지 확인
- "Port in use": `lsof -i :3000` 명령어로 기존 프로세스 확인 후 `kill -9 PID`로 종료
- 다이어그램 생성 실패: Eraser API 키가 올바르게 설정되었는지 확인

## 라이센스

ISC 