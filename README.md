# 슬랙 다이어그램 생성봇

슬랙에서 다이어그램을 생성하는 봇입니다. Eraser API를 사용하여 다양한 다이어그램(플로우차트, 시퀀스 다이어그램 등)을 생성할 수 있습니다.

## 기능

- 슬랙에서 봇 멘션으로 다이어그램 생성 요청
- 플로우차트 생성 및 이미지 반환
- (확장 예정) 다양한 다이어그램 유형 지원

## 설치 및 실행

### 사전 준비

1. 슬랙 앱 생성 및 봇 토큰 발급
2. Eraser API 키 발급

### 설치

```bash
git clone git@github.com:yeonjae0901/slack_diagram_ai.git
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

슬랙에서 봇을 멘션하고 명령어를 입력:

```
@다이어그램봇 플로우차트: 시작 -> 처리 -> 종료
```

## 배포

AWS EC2에 배포하는 방법:

1. EC2 인스턴스 생성 및 Node.js 설치
2. 코드 클론 및 의존성 설치
3. 보안 그룹에서 3000번 포트 오픈
4. pm2 등으로 서버 실행

## 라이센스

ISC 