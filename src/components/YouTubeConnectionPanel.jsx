import { useState } from 'react';
import { CONNECTION_FLOW_STATE } from '../constants/statuses';

function getConnectionMessage(connectionState) {
  if (connectionState === CONNECTION_FLOW_STATE.connected) return 'YouTube 연결이 완료되었습니다.';
  if (connectionState === CONNECTION_FLOW_STATE.reauthRequired) return '세션이 만료되었습니다. 다시 연결하세요.';
  if (connectionState === CONNECTION_FLOW_STATE.waitingForAgentLogin) {
    return '로컬 agent 로그인을 기다리는 중입니다.';
  }
  if (connectionState === CONNECTION_FLOW_STATE.loginFailed) return '로그인에 실패했습니다. 새 로그인 세션을 다시 생성하세요.';
  return 'YouTube 연결이 필요합니다. connection 생성 후 loginSession을 만들어 주세요.';
}

/**
 * YouTube 연결 생성, 로그인 세션 생성, 로컬 agent 로그인 안내를 렌더링한다.
 */
export default function YouTubeConnectionPanel({
  connection,
  connectionId,
  connectionState,
  loginSession,
  loginSessionId,
  loading,
  error,
  successMessage,
  onCreateConnection,
  onCreateLoginSession,
  onRefresh
}) {
  const [channelLabel, setChannelLabel] = useState('');
  const isCreatingConnection = loading.connection;
  const isCreatingLoginSession = loading.loginSession;
  const isBusy = isCreatingConnection || isCreatingLoginSession || loading.refreshing;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>2) YouTube 연결</h2>
          <p className="panel-meta">{getConnectionMessage(connectionState)}</p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading.refreshing}>
          {loading.refreshing ? '불러오는 중...' : '연결 새로고침'}
        </button>
      </div>

      <div className="grid-form">
        <div className="field">
          <label htmlFor="channel-label">채널 라벨 (선택)</label>
          <input
            id="channel-label"
            type="text"
            value={channelLabel}
            onChange={(event) => setChannelLabel(event.target.value)}
            placeholder="업무용 계정"
          />
        </div>

        <div className="row gap-sm wrap">
          <button
            type="button"
            onClick={() => onCreateConnection({ channelLabel: channelLabel.trim() || undefined })}
            disabled={isBusy}
          >
            {isCreatingConnection ? 'connection 생성 중...' : 'connection 생성'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onCreateLoginSession}
            disabled={isBusy || !connectionId}
          >
            {isCreatingLoginSession ? 'loginSession 생성 중...' : 'loginSession 생성'}
          </button>
        </div>

        <ul className="meta-list">
          <li>connectionState: {connectionState}</li>
          <li>connectionId: {connectionId || '-'}</li>
          <li>channelLabel: {connection?.channelLabel || '-'}</li>
          <li>connectionStatus: {connection?.status || '-'}</li>
          <li>loginSessionId: {loginSessionId || '-'}</li>
          <li>loginSessionStatus: {loginSession?.status || '-'}</li>
          <li>updatedAt: {connection?.updatedAt ? new Date(connection.updatedAt).toLocaleString() : '-'}</li>
        </ul>

        {loginSessionId && (
          <div className="message info">
            <div>loginSessionId: {loginSessionId}</div>
            <div>아래 명령으로 로컬 agent 로그인을 진행하세요.</div>
            <code className="command-block">node agent/index.js login {loginSessionId}</code>
          </div>
        )}

        {error && <p className="message error">{error}</p>}
        {successMessage && <p className="message success">{successMessage}</p>}
      </div>
    </section>
  );
}
