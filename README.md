# YouTube Private Video Share CLI (Playwright)

YouTube Studio에서 **비공개(private) 영상**의 공유 대상 이메일을 자동으로 추가하는 Node.js CLI 도구입니다.

이 프로젝트는 **공식 API가 아닌 브라우저 자동화(Playwright)** 를 사용합니다.
- 구식 `youtube.com/edit?...` URL 사용 안 함
- 구식 `.yt-uix-*` 셀렉터 사용 안 함
- Google 계정 비밀번호를 코드/설정 파일에 저장하지 않음
- Puppeteer가 아니라 Playwright 사용

---

## 핵심 동작 방식

1. `chromium.launchPersistentContext`로 프로필 디렉터리(예: `.yt-studio-profile`)를 사용
2. 첫 실행에서 사용자가 브라우저에서 직접 로그인 + 2단계 인증
3. 이후 실행에서는 저장된 세션을 재사용
4. 각 video ID에 대해 Studio 편집 페이지를 열고, 비공개 공유 UI에서 이메일 추가 시도

---

## 제한 사항 (중요)

- 이 도구는 private 영상 초대 이메일 목록 관리를 위해 **안정적인 공식 API가 아닌 UI 자동화**에 의존합니다.
- YouTube Studio UI가 변경되면 셀렉터/텍스트 패턴 수정이 필요할 수 있습니다.
- 계정 보안 정책/인증 상태/지역별 UI 실험(AB test)에 따라 동작이 달라질 수 있습니다.

---

## 설치

```bash
npm install
npx playwright install chromium
```

---

## 설정 파일

`config.example.json`을 복사해서 사용하세요.

```json
{
  "profileDir": ".yt-studio-profile",
  "headless": false,
  "videoIds": ["AbCdEf12345"],
  "emailsToAdd": ["first@example.com", "second@example.com"],
  "disableEmailNotification": true,
  "dryRun": false,
  "locale": "auto"
}
```

### 필드 설명

- `profileDir`: Playwright persistent context 세션 저장 폴더
- `headless`: 브라우저 헤드리스 실행 여부
- `videoIds`: 처리할 YouTube video ID 목록
- `emailsToAdd`: 추가할 이메일 목록(중복 자동 제거)
- `disableEmailNotification`: 가능하면 이메일 알림 토글 끄기
- `dryRun`: 최종 저장 클릭 없이 UI 진입/흐름만 점검
- `locale`: `ko | en | auto`

---

## 첫 실행(로그인 세션 생성)

```bash
node src/index.js --interactive-login
```

실행 후 열리는 브라우저에서:
1. YouTube Studio / Google 로그인 완료
2. 2단계 인증 완료
3. 세션이 저장된 상태에서 터미널에서 `Ctrl+C`로 종료

그 다음부터는 동일 `profileDir`를 재사용하면 로그인 상태를 이어받습니다.

---

## 사용 예시

```bash
node src/index.js --config config.example.json
node src/index.js --config myconfig.json --dry-run
node src/index.js --interactive-login
node src/index.js --config myconfig.json --video AbCdEf12345
node src/index.js --config myconfig.json --emails a@gmail.com,b@gmail.com
```

---

## 오류 대응/문제 해결

### 1) Share privately를 못 찾는 경우
- Studio UI 변경 가능성이 큼
- `src/youtubeStudioShare.js`의 `TEXT_PATTERNS`, `SELECTORS`를 먼저 업데이트

### 2) 로그인 풀림 / 인증 반복
- `profileDir` 경로가 실행마다 바뀌지 않는지 확인
- 계정 보안 정책으로 자동화 세션이 무효화될 수 있음

### 3) 실패 아티팩트 확인
- 실패 시 `artifacts/` 폴더에 스크린샷과 HTML 스냅샷 저장
- 어떤 화면에서 막혔는지 확인 후 셀렉터 보정

### 4) dry-run으로 먼저 점검
- 실제 저장 전 아래 명령으로 UI 접근 가능성 확인:

```bash
node src/index.js --config myconfig.json --dry-run
```

---

## 보안 주의

- 이 프로젝트는 Google 이메일/비밀번호를 코드나 설정 파일에 저장하지 않습니다.
- 개인/민감 계정 대신 테스트 채널에서 먼저 검증하세요.

