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
  needsReauth: 'needsReauth'
});

export const ACTIVE_JOB_STATUSES = new Set([
  SHARE_JOB_STATUS.queued,
  SHARE_JOB_STATUS.claimed,
  'running'
]);

export const CONNECTION_PENDING_LOGIN_STATUSES = new Set([
  'created',
  'idle',
  'pending',
  'pending_login'
]);

export const LOGIN_SESSION_PENDING_STATUSES = new Set([
  'created',
  'pending',
  'waiting',
  'waiting_for_user',
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

/**
 * 백엔드 작업 상태를 프론트 내부 상태로 정규화한다.
 */
export function normalizeShareJobStatus(status) {
  if (status === 'queued') return SHARE_JOB_STATUS.queued;
  if (status === 'claimed') return SHARE_JOB_STATUS.claimed;
  if (status === 'success' || status === 'completed') return SHARE_JOB_STATUS.success;
  if (status === 'partial') return SHARE_JOB_STATUS.partial;
  if (status === 'failed') return SHARE_JOB_STATUS.failed;
  if (status === 'needs_reauth' || status === 'reauth_required') return SHARE_JOB_STATUS.needsReauth;
  if (status === 'submitting') return SHARE_JOB_STATUS.submitting;
  return SHARE_JOB_STATUS.idle;
}
