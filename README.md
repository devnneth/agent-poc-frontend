# AI 에이전트 POC 프로젝트 (프론트엔드)

한국어 | [English](./README.en.md)

이 프로젝트는 AI 에이전트 POC 프로젝트의 프론트엔드입니다. 

React와 Vite를 기반으로 하며, AI 에이전트와 대화하고 일정/할일/메모를 관리하는 인터페이스를 제공합니다.

백엔드 프로젝트 : https://github.com/devnneth/agent-poc-backend

## 1. 개발 환경 설정 가이드

### 1.1. Node.js 설정

#### 1.1.1 Node.js 및 의존성 설치

> 실행환경 : Node.js 20+

```shell
# 1. 의존성 설치
$ npm install
```

### 1.2. 환경 설정

#### 1.2.1 프로젝트 환경 설정

```shell
$ cp .env.example .env # 복사
```

> 복사가 완료되면, `.env` 파일 수정

```shell
# Supabase 설정
VITE_SUPABASE_URL=""              # Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY=""         # Supabase 익명 키

# 백엔드 연동
VITE_BACKEND_URL="http://localhost:8000"
VITE_ENABLE_BACKEND_HEALTH_CHECK=true

# 에이전트/API 설정
VITE_API_BASE_URL="http://localhost:8000/api/v1"

# UI/UX 설정
VITE_TOAST_DURATION=3000
VITE_HIDE_GOOGLE_LOGIN=false      # 구글 로그인 버튼 숨김 여부
```

## 2. 주요 디렉토리 구조 (/)

```shell
.
├── public                  
├── src                     # 소스 코드 🔥
├── tests                   # 테스트 파일
├── index.html              # 앱 진입점 HTML
├── .env.example            # 환경변수 예시 파일
├── eslint.config.js        # ESLint 설정
├── postcss.config.js       # PostCSS 설정
├── tailwind.config.js      # CSS 프레임워크 설정
├── vite.config.js          # Vite 설정 파일
└── package.json            # 프로젝트 설정 및 의존성
```

### 3. 앱 구조 (src/)

```shell
.
├── api                     # 외부 서비스 연동 어댑터
│   ├── agent               # 에이전트 API (채팅, 세션 관리)
│   ├── google              # Google Calendar API
│   └── supabase            # Supabase Auth/DB 클라이언트
│
├── app                     # 애플리케이션 공통 레이아웃 및 셋업
├── assets                  # 이미지, 폰트 등 정적 자산
│
├── components              # 공통 UI 컴포넌트 (Shadcn UI 등)
│   └── ui                  # 원자 단위 UI 컴포넌트
│
├── features                # 도메인별 피처 레이어 🔥
│   ├── auth                # 인증 (로그인, 회원가입)
│   ├── calendar            # 일정 관리 (캘린더 뷰)
│   ├── chat                # AI 에이전트 채팅
│   ├── memos               # 메모 관리
│   ├── settings            # 사용자 설정
│   ├── todos               # 할일 관리
│   └── workspace           # 워크스페이스 레이아웃
│
├── hooks                   # 커스텀 훅 (비즈니스 로직, 상태 관리)
├── lib                     # 공통 유틸리티 및 라이브러리 설정 (i18n, utils)
├── locales                 # 다국어 지원 (i18next json)
├── repositories            # 데이터 영속성 추상화 레이어 (LocalStorage, Supabase)
├── resources               # 정적 리소스 및 템플릿
│   └── embedding           # 에이전트용 임베딩 텍스트 템플릿
│
├── services                # 비즈니스 로직 처리 레이어
└── main.jsx                # 프론트엔드 진입점
```

## 4. API 연동 규격

프론트엔드는 백엔드의 에이전트 API와 다음과 같은 규격으로 통신합니다. 백엔드 API 명세 변경에 따라 프론트엔드에서는 구조화된 페이로드를 그대로 전달하며, 포맷팅과 임베딩 모델 처리는 백엔드에서 수행합니다.

### 4.1 에이전트 채팅 (Streaming)

- **Endpoint**: `POST /api/v1/agent/chat`
- **Request Body**:
```json
{
  "user_id": "string",
  "session_id": "string",
  "message": "string",
  "calendar_id": "string | null",
  "language": "string",
  "minutes_offset": 540,
  "google_calendar_token": "string" 
}
```

### 4.2 임베딩 요청 (Embedding)

- **Endpoint**: `POST /api/v1/agent/embedding`
- **Request Body**: `LLMEmbeddingRequest` (엔티티 타입과 원본 데이터를 포함한 구조화된 객체)
- **참고**: 백엔드에서 `ScheduleService.format_schedule_for_embedding` 등을 통해 직접 포맷팅을 수행하므로, 프론트엔드 환경변수에서 임베딩용 템플릿이나 모델명(`VITE_EMBEDDING_MODEL`) 설정은 더 이상 필요하지 않습니다.

## 5. 실행 스크립트

### 5.1 로컬 실행

```shell
$ npm run dev               # 개발 서버 실행 (Vite)
$ npm run build             # 프로덕션 빌드
$ npm run lint              # 코드 린트 실행
$ npm run test              # 테스트 실행 (Vitest)
$ npm run validate          # 린트, 테스트, 빌드 순차 검증
```
