export const CONNECTION_FLOW_STATE = Object.freeze({
  idle: 'idle',
  creatingConnection: 'creatingConnection',
  creatingLoginSession: 'creatingLoginSession',
  waitingForAgentLogin: 'waitingForAgentLogin',
  connected: 'connected',
  loginFailed: 'loginFailed',
  reauthRequired: 'reauthRequired'
});

export const SHARE_JOB_STATUS = Object.freeze({
  idle: 'idle',
  submitting: 'submitting',
  queued: 'queued',
  claimed: 'claimed',
  success: 'success',
  partial: 'partial',
  failed: 'failed',
  needsReauth: 'needs_reauth'
});

export const ACTIVE_JOB_STATUSES = new Set([
  SHARE_JOB_STATUS.queued,
  SHARE_JOB_STATUS.claimed,
  'running'
]);

export const LOGIN_SESSION_PENDING_STATUSES = new Set([
  'created',
  'pending',
  'waiting',
  'waiting_for_agent',
  'waiting_for_login',
  'in_progress'
]);

export const LOGIN_SESSION_SUCCESS_STATUSES = new Set([
  'authenticated',
  'connected',
  'completed',
  'success',
  'succeeded'
]);

export const LOGIN_SESSION_FAILURE_STATUSES = new Set([
  'cancelled',
  'expired',
  'failed',
  'rejected'
]);

export const DEFAULT_USER_ID = 'demo-user';

/**
 * 연결 상태명이 재인증 필요를 의미하는지 확인한다.
 */
export function isReauthStatus(status) {
  return status === 'needs_reauth' || status === 'reauth_required';
}
