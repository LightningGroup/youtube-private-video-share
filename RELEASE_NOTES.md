# Release Notes

## 2026-04-04

### Frontend

- YouTube 인증 흐름을 기존 `storageState` 업로드 방식에서 `connection` / `loginSession` 기반 플로우로 정리했습니다.
- `POST /api/connections`로 생성한 `connectionId`와 `POST /api/connections/:connectionId/login-sessions`로 생성한 `loginSessionId`를 프론트 상태로 관리하도록 변경했습니다.
- 로그인 세션 생성 후 사용자에게 `node agent/index.js login <loginSessionId>` 실행 안내를 표시하도록 UI를 추가했습니다.
- `GET /api/login-sessions/:loginSessionId` 폴링으로 로그인 완료 여부를 감시하고, 완료 후 연결 상태를 재조회해 인증 완료를 판정하도록 보강했습니다.
- 연결 완료 전에는 공유 요청을 비활성화하고, `POST /api/jobs/share` 요청에는 항상 `connectionId`를 포함하도록 유지했습니다.
- 작업 상태 표시를 `queued`, `claimed`, `success`, `partial`, `failed`, `needs_reauth` 흐름에 맞게 정리했습니다.
- `job.status === needs_reauth` 응답 시 재연결 유도 흐름을 표시하도록 보강했습니다.
- Step 4 작업 상세에서 긴 실패 메시지를 접기/펼치기 형태로 표시하도록 변경해 전체 실패 원인을 확인할 수 있게 했습니다.
- `queued` 상태 작업에는 아직 agent가 queue를 가져가지 않았다는 안내를 함께 표시하도록 보강했습니다.

### Docs / Repository

- README를 현재 위저드 기준 흐름으로 최신화했습니다.
- YouTube 연결 패널에 로그인 단계 안내 문구를 더 명확하게 추가했습니다.
- JetBrains 프로젝트 파일을 무시하도록 `.gitignore`를 정리했습니다.
- 릴리즈 노트를 날짜별 형식으로 보강했습니다.

### Changed Files

- `.gitignore`
- `README.md`
- `RELEASE_NOTES.md`
- `src/App.jsx`
- `src/components/JobDetail.jsx`
- `src/components/JobList.jsx`
- `src/components/ResultPanel.jsx`
- `src/components/ShareForm.jsx`
- `src/components/YouTubeConnectionPanel.jsx`
- `src/constants/statuses.js`
- `src/hooks/useConnectionFlow.js`
- `src/styles.css`

## 2026-04-03

### Frontend

- 기존 업로드 기반 인증 흐름을 제거하고 연결 중심 UI로 전환하는 작업을 시작했습니다.
- 대시보드를 단계형 위저드 레이아웃으로 재구성해 연결, 공유 요청, 결과 확인 흐름을 더 명확하게 분리했습니다.
- 작업 결과 영역의 새로고침 경험을 개선해 완료 후 상태 변화가 더 빠르게 반영되도록 보강했습니다.
- 연결 정보, 작업 목록, 결과 패널 전반을 손봐 backend의 hybrid auth 변경에 맞는 화면 구조로 정리했습니다.

### Repository / Cleanup

- 더 이상 사용하지 않는 `legacy-cli` 코드를 제거하고 관련 README 내용을 정리했습니다.
- `package-lock.json`을 추가해 재현 가능한 설치 상태를 고정했습니다.
- 로컬 agent 번들과 ignore 규칙을 정리했습니다.
- gstack agent bundle 파일들을 저장소에 추가했습니다.
- 대시보드 제목을 현재 제품 방향에 맞게 갱신했습니다.

### Changed Files

- `.agents/skills/gstack`
- `.agents/skills/gstack-autoplan`
- `.agents/skills/gstack-benchmark`
- `.agents/skills/gstack-browse`
- `.agents/skills/gstack-canary`
- `.agents/skills/gstack-careful`
- `.agents/skills/gstack-checkpoint`
- `.agents/skills/gstack-connect-chrome`
- `.agents/skills/gstack-cso`
- `.agents/skills/gstack-design-consultation`
- `.agents/skills/gstack-design-html`
- `.agents/skills/gstack-design-review`
- `.agents/skills/gstack-design-shotgun`
- `.agents/skills/gstack-document-release`
- `.agents/skills/gstack-freeze`
- `.agents/skills/gstack-guard`
- `.agents/skills/gstack-health`
- `.agents/skills/gstack-investigate`
- `.agents/skills/gstack-land-and-deploy`
- `.agents/skills/gstack-learn`
- `.agents/skills/gstack-office-hours`
- `.agents/skills/gstack-plan-ceo-review`
- `.agents/skills/gstack-plan-design-review`
- `.agents/skills/gstack-plan-eng-review`
- `.agents/skills/gstack-qa`
- `.agents/skills/gstack-qa-only`
- `.agents/skills/gstack-retro`
- `.agents/skills/gstack-review`
- `.agents/skills/gstack-setup-browser-cookies`
- `.agents/skills/gstack-setup-deploy`
- `.agents/skills/gstack-ship`
- `.agents/skills/gstack-unfreeze`
- `.agents/skills/gstack-upgrade`
- `.gitignore`
- `README.md`
- `package-lock.json`
- `src/App.jsx`
- `src/api/client.js`
- `src/components/JobDetail.jsx`
- `src/components/JobList.jsx`
- `src/components/ResultPanel.jsx`
- `src/components/SessionPanel.jsx`
- `src/components/ShareForm.jsx`
- `src/components/YouTubeConnectionPanel.jsx`
- `src/constants/statuses.js`
- `src/hooks/useConnectionFlow.js`
- `src/hooks/useJobPolling.js`
- `src/styles.css`

## 2026-04-02

### Initial Product

- Playwright 기반 YouTube private share CLI 프로젝트로 저장소를 시작했습니다.
- 이후 Netlify 배포 가능한 React + Vite 대시보드 앱으로 전환해 브라우저 기반 운영 UI를 추가했습니다.
- 서버 설정 입력, 세션 상태 확인, 작업 요청, 작업 결과 조회가 가능한 SPA 흐름을 구성했습니다.
- job/session UX와 API 클라이언트 흐름을 정리해 프론트엔드 대시보드 구조를 다듬었습니다.

### Docs / Governance

- 저장소 작업 규칙을 담은 `AGENTS.md`를 추가했습니다.
- README를 CLI 설명에서 SPA 대시보드 중심 문서로 확장했습니다.
- 코드 전반에 AGENTS no-else 규칙 기반 리팩토링을 반영했습니다.

### Changed Files

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `README.md`
- `config.example.json`
- `index.html`
- `legacy-cli/config.example.json`
- `legacy-cli/src/config.js`
- `legacy-cli/src/index.js`
- `legacy-cli/src/logger.js`
- `legacy-cli/src/youtubeStudioShare.js`
- `netlify.toml`
- `package.json`
- `src/App.jsx`
- `src/api/client.js`
- `src/components/JobDetail.jsx`
- `src/components/JobList.jsx`
- `src/components/ServerConfigPanel.jsx`
- `src/components/SessionPanel.jsx`
- `src/components/ShareForm.jsx`
- `src/config.js`
- `src/hooks/useJobPolling.js`
- `src/main.jsx`
- `src/styles.css`
- `src/utils/normalizeBaseUrl.js`
- `src/utils/parseListInput.js`
- `src/youtubeStudioShare.js`
- `vite.config.js`
