import { useEffect, useRef } from 'react';

const ACTIVE_STATUSES = new Set(['queued', 'running']);

export function useJobPolling(jobDetail, fetchJobDetail, intervalMs = 2500) {
  const timerRef = useRef(null);

  useEffect(() => {
    const status = jobDetail?.status;
    if (!status || !ACTIVE_STATUSES.has(status)) {
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
  }, [jobDetail?.status, fetchJobDetail, intervalMs]);
}
