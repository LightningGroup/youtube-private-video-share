# YouTube Private Video Share Dashboard (React + Vite)

이 저장소는 **서버 API를 호출하는 관리자용 프론트엔드 SPA**입니다.

- 브라우저에서 동작하는 React + Vite 정적 앱입니다.
- Playwright/Chromium/CLI 실행은 프론트에서 하지 않습니다.
- 실제 작업 실행은 별도의 백엔드 서버 API가 담당합니다.
- 관리자 토큰/서버 URL은 런타임 입력값으로 `localStorage`에 저장됩니다.

## 프로젝트 개요

이 UI는 다음 흐름을 제공합니다.

1. 서버 Base URL 및 관리자 토큰 입력/저장
2. 서버 연결 테스트 (`GET /health`)
3. 세션 상태 확인 (`GET /api/session/status`)
4. `storageState.json` 업로드/삭제
5. Video ID + Email 목록 정규화 후 공유 작업 실행 (`POST /api/jobs/share`)
6. 최근 작업 목록 조회 (`GET /api/jobs`)
7. 작업 상세/로그/아티팩트 확인 (`GET /api/jobs/:jobId`)

## 런타임 설정 방식 (중요)

- 입력 항목
  - 서버 Base URL
  - 관리자 토큰
- 저장 위치
  - `localStorage['ytps.baseUrl']`
  - `localStorage['ytps.adminToken']`
- Base URL은 마지막 `/`를 자동 제거해 정규화합니다.
- 토큰은 빌드 타임 환경변수로 주입하지 않습니다.

## storageState.json 업로드 흐름

1. 서버 URL/토큰 입력 후 저장
2. 세션 패널에서 상태 조회
3. `storageState.json` 파일 선택 후 업로드
4. 업로드 성공 시 세션 상태 재조회
5. 필요 시 `storageState` 삭제 버튼으로 제거

## 작업 실행 및 결과 확인 흐름

1. Video ID / Email 목록 입력 (줄바꿈, 콤마 모두 허용)
2. 입력값 자동 정규화
   - trim
   - 빈 값 제거
   - 중복 제거
   - 이메일 기본 형식 검증
3. `Dry-run 실행` 또는 `실제 실행` 버튼 클릭
4. 생성된 `jobId` 표시
5. 최근 작업 목록과 작업 상세를 통해 진행 상태 확인
6. `queued/running` 상태일 때 2.5초 간격 polling
7. 비디오별 결과, 로그, 아티팩트 링크 확인

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

`netlify.toml`이 포함되어 있어 정적 배포가 바로 가능합니다.

- Build command: `npm run build`
- Publish directory: `dist`
- SPA 리다이렉트: `/* -> /index.html` (200)

## 환경 변수 파일

`.env.example`는 샘플만 포함합니다.

- 관리자 토큰 같은 민감값은 저장하지 마세요.
- 이 프로젝트는 서버 URL/토큰을 런타임에 입력받습니다.
