# Release Notes

## 2026-04-04

### Frontend

- YouTube 인증 흐름을 기존 `storageState` 업로드 방식에서 `connection` / `loginSession` 기반 플로우로 정리했습니다.
- `POST /api/connections`로 생성한 `connectionId`와 `POST /api/connections/:connectionId/login-sessions`로 생성한 `loginSessionId`를 프론트 상태로 관리하도록 변경했습니다.
- 로그인 세션 생성 후 사용자에게 `node agent/index.js login <loginSessionId>` 실행 안내를 표시하도록 UI를 추가했습니다.
- `GET /api/login-sessions/:loginSessionId` 폴링으로 로그인 완료 여부를 감시하고, 완료 후 연결 상태를 재조회해 인증 완료를 판정하도록 보강했습니다.
- 연결 완료 전에는 공유 요청을 비활성화하고, `POST /api/jobs/share` 요청에는 항상 `connectionId`를 포함하도록 유지했습니다.
- 작업 상태 표시를 `queued`, `claimed`, `success`, `partial`, `failed`, `needs_reauth` 흐름에 맞게 정리했습니다.
- `job.status === needs_reauth` 응답 시 "세션 만료, 다시 연결 필요" 메시지와 재연결 유도 흐름을 추가했습니다.
- 보호 API 호출은 기존 `Authorization` 헤더와 함께 임시 백엔드 요구사항인 `x-user-id` 헤더를 계속 전송합니다.
- README를 현재 위저드 기준 흐름으로 최신화했습니다.
- Step 4 작업 상세에서 긴 실패 메시지를 접기/펼치기 형태로 표시하도록 변경해 전체 실패 원인을 확인할 수 있게 했습니다.
- `queued` 상태 작업에는 아직 agent가 queue를 가져가지 않았다는 안내를 함께 표시하도록 보강했습니다.

### Changed Files

- `README.md`
- `src/App.jsx`
- `src/hooks/useConnectionFlow.js`
- `src/constants/statuses.js`
- `src/components/YouTubeConnectionPanel.jsx`
- `src/components/ShareForm.jsx`
- `src/components/ResultPanel.jsx`
- `src/components/JobDetail.jsx`
- `src/components/JobList.jsx`
- `src/styles.css`
