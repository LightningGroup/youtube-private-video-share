import { useEffect, useRef } from 'react';
import { ACTIVE_JOB_STATUSES } from '../constants/statuses';

/**
 * 실행 중인 작업 상세를 주기적으로 다시 조회한다.
 */
export function useJobPolling(jobStatus, fetchJobDetail, intervalMs = 2500, enabled = true) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    const status = jobStatus;
    if (!status || !ACTIVE_JOB_STATUSES.has(status)) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    timerRef.current = setInterval(() => {
      fetchJobDetail();
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, fetchJobDetail, intervalMs, jobStatus]);
}
