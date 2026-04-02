# YouTube Private Video Share Dashboard (React + Vite)

이 저장소는 기존 **Playwright CLI 중심 구조**를 Netlify 배포 가능한 **정적 React SPA**로 재구성한 프로젝트입니다.

- 프론트엔드는 브라우저에서만 실행됩니다.
- Playwright/Chromium 실행은 프론트에서 하지 않고, 별도 서버 API로 위임됩니다.
- 관리자 토큰은 빌드 환경변수에 넣지 않고, 사용자가 런타임에 입력해 `localStorage`에 저장합니다.

## 무엇이 바뀌었나

- 기존 CLI 코드(`src/index.js`, `src/config.js`, `src/logger.js`, `src/youtubeStudioShare.js`)는 `legacy-cli/src/`로 이동했습니다.
- 기존 `config.example.json`도 `legacy-cli/config.example.json`으로 이동했습니다.
- 새 프론트 앱 코드는 `src/` 아래 React 컴포넌트/훅/유틸 구조로 구성했습니다.

## 기술 스택

- React
- Vite
- JavaScript (TypeScript 미사용)
- fetch API
- 기본 CSS

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 Vite 개발 서버 주소를 열어 UI를 사용하세요.

## 빌드

```bash
npm run build
npm run preview
```

`dist/` 폴더가 정적 배포 산출물입니다.

## Netlify 배포

이 저장소에는 `netlify.toml`이 포함되어 있어 기본적으로 바로 배포됩니다.

1. Netlify에서 이 GitHub 저장소를 연결
2. Build command: `npm run build`
3. Publish directory: `dist`
4. 배포

SPA 라우팅 대응을 위해 다음 리다이렉트가 설정되어 있습니다.

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 서버 URL / 관리자 토큰 설정 방식

UI의 **서버 연결 설정 패널**에서:

1. 서버 Base URL 입력
2. 관리자 토큰 입력
3. `로컬 저장` 클릭

입력값은 브라우저 `localStorage`에만 저장됩니다.

- localStorage key: `ytps.baseUrl`, `ytps.adminToken`
- 코드/설정파일/.env에 토큰 하드코딩하지 않습니다.

## storageState.json 업로드 흐름

1. 서버 연결/토큰 설정 완료
2. 세션 패널에서 `상태 새로고침`으로 `/api/session/status` 확인
3. `storageState.json 업로드`에서 파일 선택 후 업로드
4. 성공 메시지 확인
5. 필요 시 `저장된 세션 삭제`로 서버 저장 세션 제거

## 주요 UI 기능

- `/health` 연결 테스트
- `/api/session/status` 세션 상태 조회
- `storageState.json` 업로드/삭제
- video ID / email 입력 및 정규화
- dry-run / 실제 실행
- 최근 작업 목록 조회
- 작업 상세(결과/로그/아티팩트 링크) 확인
- 실행 중 작업 polling (2.5초 간격)

## 보안 주의

- 관리자 토큰은 민감 정보입니다. 개인 브라우저에서만 사용하세요.
- 아티팩트 다운로드 엔드포인트는 서버 설정에 따라 별도 인증 처리가 필요할 수 있습니다.
