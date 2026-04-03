import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import {
  CONNECTION_PENDING_LOGIN_STATUSES,
  CONNECTION_FLOW_STATE,
  LOGIN_SESSION_FAILURE_STATUSES,
  LOGIN_SESSION_PENDING_STATUSES,
  LOGIN_SESSION_SUCCESS_STATUSES,
  isReauthStatus
} from '../constants/statuses';

const LOGIN_POLL_INTERVAL_MS = 2500;

function sortByCreatedAtDesc(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftTime = new Date(left?.createdAt ?? 0).getTime();
    const rightTime = new Date(right?.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function getConnectionId(connection) {
  return connection?.connectionId ?? connection?.id ?? '';
}

function getLoginSessionId(loginSession) {
  return loginSession?.loginSessionId ?? loginSession?.id ?? '';
}

function normalizeStatus(status) {
  if (typeof status !== 'string') return '';
  return status.trim().toLowerCase();
}

function isConnectedConnection(connection) {
  if (connection?.authenticated === true) return true;
  const status = normalizeStatus(connection?.status);
  if (status === 'connected') return true;
  if (status === 'authenticated') return true;
  if (status === 'active') return true;
  return false;
}

function deriveConnectionState({ connection, loginSession, previousState }) {
  const connectionStatus = normalizeStatus(connection?.status);
  if (connection?.needsReauth === true) return CONNECTION_FLOW_STATE.reauthRequired;
  if (isReauthStatus(connectionStatus)) return CONNECTION_FLOW_STATE.reauthRequired;
  if (isConnectedConnection(connection)) return CONNECTION_FLOW_STATE.connected;

  const loginSessionStatus = normalizeStatus(loginSession?.status);
  if (LOGIN_SESSION_FAILURE_STATUSES.has(loginSessionStatus)) return CONNECTION_FLOW_STATE.loginFailed;
  if (LOGIN_SESSION_PENDING_STATUSES.has(loginSessionStatus)) return CONNECTION_FLOW_STATE.waitingForAgentLogin;
  if (LOGIN_SESSION_SUCCESS_STATUSES.has(loginSessionStatus) && getConnectionId(connection)) {
    return CONNECTION_FLOW_STATE.waitingForAgentLogin;
  }
  if (getLoginSessionId(loginSession)) return CONNECTION_FLOW_STATE.waitingForAgentLogin;
  if (connectionStatus && CONNECTION_PENDING_LOGIN_STATUSES.has(connectionStatus)) {
    return CONNECTION_FLOW_STATE.idle;
  }
  if (previousState === CONNECTION_FLOW_STATE.reauthRequired) return CONNECTION_FLOW_STATE.reauthRequired;
  return CONNECTION_FLOW_STATE.idle;
}

/**
 * YouTube 연결 생성, 로그인 세션 생성, 로그인 상태 폴링을 관리한다.
 */
export function useConnectionFlow({ baseUrl, token, canUseProtectedApi, formatError }) {
  const [connection, setConnection] = useState(null);
  const [loginSession, setLoginSession] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState({
    refreshing: false,
    connection: false,
    loginSession: false
  });
  const [connectionState, setConnectionState] = useState(CONNECTION_FLOW_STATE.idle);

  const selectedConnectionId = useMemo(() => getConnectionId(connection), [connection]);
  const selectedLoginSessionId = useMemo(() => getLoginSessionId(loginSession), [loginSession]);

  const syncConnectionState = useCallback((nextConnection, nextLoginSession) => {
    setConnectionState((previousState) =>
      deriveConnectionState({
        connection: nextConnection,
        loginSession: nextLoginSession,
        previousState
      })
    );
  }, []);

  const refreshConnection = useCallback(
    async (connectionId) => {
      if (!canUseProtectedApi) return null;
      if (!connectionId) return null;

      const detail = await apiClient.getConnection(baseUrl, token, connectionId);
      setConnection(detail);
      setConnectionState((previousState) =>
        deriveConnectionState({
          connection: detail,
          loginSession,
          previousState
        })
      );
      return detail;
    },
    [baseUrl, canUseProtectedApi, loginSession, token]
  );

  const refreshConnections = useCallback(async () => {
    if (!canUseProtectedApi) return;

    setLoading((previous) => ({ ...previous, refreshing: true }));
    setError('');
    setSuccessMessage('');

    try {
      const items = await apiClient.getConnections(baseUrl, token);
      const sorted = sortByCreatedAtDesc(items);
      const fallbackConnection = sorted[0] ?? null;
      const connectionId = selectedConnectionId || getConnectionId(fallbackConnection);

      if (!connectionId) {
        setConnection(null);
        setLoginSession(null);
        setConnectionState(CONNECTION_FLOW_STATE.idle);
        return;
      }

      await refreshConnection(connectionId);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading((previous) => ({ ...previous, refreshing: false }));
    }
  }, [baseUrl, canUseProtectedApi, formatError, refreshConnection, selectedConnectionId, token]);

  const createConnection = useCallback(
    async ({ channelLabel } = {}) => {
      if (!canUseProtectedApi) {
        setError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
        return;
      }

      setLoading((previous) => ({ ...previous, connection: true }));
      setError('');
      setSuccessMessage('');
      setConnectionState(CONNECTION_FLOW_STATE.creatingConnection);

      try {
        const created = await apiClient.createConnection(baseUrl, token, { channelLabel });
        setConnection(created);
        setLoginSession(null);
        syncConnectionState(created, null);
        setSuccessMessage('연결이 생성되었습니다. 로그인 세션을 만들어 주세요.');
      } catch (requestError) {
        setConnectionState(CONNECTION_FLOW_STATE.idle);
        setError(formatError(requestError));
      } finally {
        setLoading((previous) => ({ ...previous, connection: false }));
      }
    },
    [baseUrl, canUseProtectedApi, formatError, syncConnectionState, token]
  );

  const createLoginSession = useCallback(async () => {
    if (!canUseProtectedApi) {
      setError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    if (!selectedConnectionId) {
      setError('먼저 connection을 생성해 주세요.');
      return;
    }

    setLoading((previous) => ({ ...previous, loginSession: true }));
    setError('');
    setSuccessMessage('');
    setConnectionState(CONNECTION_FLOW_STATE.creatingLoginSession);

    try {
      const created = await apiClient.createLoginSession(baseUrl, token, selectedConnectionId);
      setLoginSession(created);
      setConnectionState(CONNECTION_FLOW_STATE.waitingForAgentLogin);
      setSuccessMessage('로그인 세션이 생성되었습니다. 로컬 agent에서 로그인해 주세요.');
    } catch (requestError) {
      setConnectionState(CONNECTION_FLOW_STATE.loginFailed);
      setError(formatError(requestError));
    } finally {
      setLoading((previous) => ({ ...previous, loginSession: false }));
    }
  }, [baseUrl, canUseProtectedApi, formatError, selectedConnectionId, token]);

  const markReauthRequired = useCallback(() => {
    setConnectionState(CONNECTION_FLOW_STATE.reauthRequired);
    setSuccessMessage('');
  }, []);

  useEffect(() => {
    if (canUseProtectedApi) return;

    setConnection(null);
    setLoginSession(null);
    setError('');
    setSuccessMessage('');
    setConnectionState(CONNECTION_FLOW_STATE.idle);
    setLoading({
      refreshing: false,
      connection: false,
      loginSession: false
    });
  }, [canUseProtectedApi]);

  useEffect(() => {
    if (!canUseProtectedApi) return;
    void refreshConnections();
  }, [canUseProtectedApi, refreshConnections]);

  useEffect(() => {
    if (!canUseProtectedApi) return undefined;
    if (!selectedLoginSessionId) return undefined;
    if (connectionState !== CONNECTION_FLOW_STATE.waitingForAgentLogin) return undefined;

    const timerId = setInterval(() => {
      void (async () => {
        try {
          const nextLoginSession = await apiClient.getLoginSession(baseUrl, token, selectedLoginSessionId);
          setLoginSession(nextLoginSession);

          const nextStatus = normalizeStatus(nextLoginSession?.status);
          if (LOGIN_SESSION_PENDING_STATUSES.has(nextStatus)) {
            syncConnectionState(connection, nextLoginSession);
            return;
          }

          if (LOGIN_SESSION_FAILURE_STATUSES.has(nextStatus)) {
            syncConnectionState(connection, nextLoginSession);
            setError('로그인 세션이 실패했습니다. 새 로그인 세션을 다시 생성해 주세요.');
            return;
          }

          if (!LOGIN_SESSION_SUCCESS_STATUSES.has(nextStatus)) {
            syncConnectionState(connection, nextLoginSession);
            return;
          }

          const refreshedConnection = await refreshConnection(selectedConnectionId);
          const nextConnection = refreshedConnection ?? connection;
          const isConnected = isConnectedConnection(nextConnection);

          syncConnectionState(nextConnection, nextLoginSession);

          if (isConnected) {
            setSuccessMessage('YouTube 연결이 완료되었습니다.');
            return;
          }

          setSuccessMessage('로그인 세션이 완료되었습니다. 연결 상태를 확인하는 중입니다.');
        } catch (requestError) {
          setError(formatError(requestError));
        }
      })();
    }, LOGIN_POLL_INTERVAL_MS);

    return () => {
      clearInterval(timerId);
    };
  }, [
    baseUrl,
    canUseProtectedApi,
    connection,
    connectionState,
    formatError,
    refreshConnection,
    selectedConnectionId,
    selectedLoginSessionId,
    syncConnectionState,
    token
  ]);

  return {
    connection,
    connectionId: selectedConnectionId,
    loginSession,
    loginSessionId: selectedLoginSessionId,
    connectionState,
    isConnected: connectionState === CONNECTION_FLOW_STATE.connected,
    error,
    successMessage,
    loading,
    createConnection,
    createLoginSession,
    refreshConnections,
    markReauthRequired
  };
}
