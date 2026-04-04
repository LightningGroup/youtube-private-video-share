# YouTube Multi Private Video Share

이 저장소는 YouTube 비공개 공유 작업을 관리하는 React + Vite 기반 관리자용 SPA입니다.

- 브라우저에서 동작하는 정적 프론트엔드입니다.
- 실제 공유 실행, 인증 상태 관리, 작업 저장은 백엔드 API가 담당합니다.
- 서버 URL과 관리자 토큰은 런타임 입력값으로 `localStorage`에 저장합니다.
- YouTube 로그인 자체는 브라우저 앱이 아니라 별도 로컬 agent가 수행합니다.

## 현재 사용자 흐름

UI는 4단계 위저드로 동작합니다.

1. 서버 연결 설정
   - 서버 Base URL 입력
   - 관리자 토큰 입력
   - `GET /health`로 연결 테스트
2. YouTube 연결
   - `POST /api/connections`로 connection 생성
   - `POST /api/connections/:connectionId/login-sessions`로 login session 생성
   - 발급된 `loginSessionId`로 로컬 agent 로그인 진행
   - `GET /api/login-sessions/:loginSessionId` 폴링으로 로그인 완료 감시
3. 공유 실행
   - Video ID / 이메일 목록 입력
   - 입력값 정규화 후 `POST /api/jobs/share` 요청
   - 요청 payload에 `connectionId` 포함
4. 결과 확인
   - `GET /api/jobs`로 최근 작업 목록 조회
   - `GET /api/jobs/:jobId`로 상세, 로그, 아티팩트 확인
   - 실행 중 작업은 2.5초 간격으로 자동 갱신

## 로컬 agent 로그인

Step 2에서 `loginSessionId`가 생성되면 로컬 환경에서 아래 명령을 실행해야 합니다.

```bash
node agent/index.js login <loginSessionId>
```

이 단계가 완료되어 connection 상태가 `connected`가 되기 전에는 공유 요청을 보낼 수 없습니다.

## 공유 요청 입력 규칙

- Video ID와 이메일은 줄바꿈 또는 콤마로 입력할 수 있습니다.
- 입력값은 trim, 빈 값 제거, 중복 제거를 거쳐 정규화합니다.
- 이메일은 기본 형식 검증 후 유효한 값만 전송합니다.
- `Dry-run 실행`과 `실제 실행`을 모두 지원합니다.
- `needs_reauth` 상태가 반환되면 다시 Step 2로 돌아가 재연결해야 합니다.

## 런타임 설정

- `localStorage['ytps.baseUrl']`
- `localStorage['ytps.adminToken']`

Base URL은 마지막 `/`를 제거해 정규화합니다. 관리자 토큰은 빌드 타임 환경변수로 주입하지 않습니다.

## API 요약

- `GET /health`
- `POST /api/connections`
- `GET /api/connections`
- `GET /api/connections/:connectionId`
- `POST /api/connections/:connectionId/login-sessions`
- `GET /api/login-sessions/:loginSessionId`
- `POST /api/jobs/share`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`

보호 API 요청에는 `Authorization: Bearer <token>` 헤더와 `x-user-id` 헤더를 함께 전송합니다.

## 로컬 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run preview
```

## Netlify 배포

`netlify.toml`이 포함되어 있어 정적 배포가 가능합니다.

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html` (200)
