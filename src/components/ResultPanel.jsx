import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useJobPolling } from '../hooks/useJobPolling';
import JobDetail from './JobDetail';
import JobList from './JobList';

const POLLING_ERROR_THRESHOLD = 2;

function createInitialLoadingState() {
  return {
    jobs: false,
    detail: false
  };
}

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) return '';
  return new Date(updatedAt).toLocaleTimeString();
}

function patchJobSummary(items, detail) {
  if (!detail?.jobId) return items;

  return (items ?? []).map((item) => {
    if (item.jobId !== detail.jobId) return item;

    return {
      ...item,
      status: detail.status
    };
  });
}

function deriveDetailViewState({ selectedJobId, jobDetail, isDetailLoading, manualError, pollingStatusMessage }) {
  if (!selectedJobId) return 'idle';
  if (isDetailLoading && !jobDetail) return 'loading';
  if (manualError && !jobDetail) return 'manual_error';
  if (pollingStatusMessage && jobDetail) return 'polling_degraded';
  if (jobDetail) return 'ready';
  return 'loading';
}

/**
 * 작업 결과 화면의 목록, 선택, 상세 갱신 흐름을 관리한다.
 */
export default function ResultPanel({ baseUrl, token, canUseProtectedApi, initialJobId, onInitialJobHandled, formatError }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobDetail, setJobDetail] = useState(null);
  const [listError, setListError] = useState('');
  const [manualError, setManualError] = useState('');
  const [loading, setLoading] = useState(createInitialLoadingState);
  const [jobsUpdatedAt, setJobsUpdatedAt] = useState('');
  const [detailUpdatedAt, setDetailUpdatedAt] = useState('');
  const [pollingFailureCount, setPollingFailureCount] = useState(0);
  const [pollingStatusMessage, setPollingStatusMessage] = useState('');

  const refreshJobs = useCallback(async () => {
    if (!canUseProtectedApi) return;

    setLoading((prev) => ({ ...prev, jobs: true }));
    setListError('');

    try {
      const data = await apiClient.getJobs(baseUrl, token);
      const items = Array.isArray(data?.items) ? data.items : [];
      setJobs(items);
      setJobsUpdatedAt(new Date().toISOString());
    } catch (error) {
      setListError(formatError(error));
    } finally {
      setLoading((prev) => ({ ...prev, jobs: false }));
    }
  }, [baseUrl, canUseProtectedApi, formatError, token]);

  const refreshSelectedJob = useCallback(
    async ({ jobId, trigger } = {}) => {
      const nextTrigger = trigger ?? 'manual';
      const nextJobId = jobId ?? selectedJobId;
      if (!nextJobId || !canUseProtectedApi) return;

      if (nextTrigger !== 'polling') {
        setLoading((prev) => ({ ...prev, detail: true }));
      }

      if (nextTrigger !== 'polling') {
        setManualError('');
      }

      try {
        const detail = await apiClient.getJobDetail(baseUrl, token, nextJobId);
        setSelectedJobId(nextJobId);
        setJobDetail(detail);
        setDetailUpdatedAt(new Date().toISOString());
        setJobs((prev) => patchJobSummary(prev, detail));
        setPollingFailureCount(0);
        setPollingStatusMessage('');
        return true;
      } catch (error) {
        if (nextTrigger === 'polling') {
          setPollingFailureCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount >= POLLING_ERROR_THRESHOLD) {
              setPollingStatusMessage('자동 갱신 연결이 불안정합니다. 다시 시도 중입니다.');
            }
            return nextCount;
          });
          return false;
        }

        setManualError(formatError(error));
        return false;
      } finally {
        if (nextTrigger !== 'polling') {
          setLoading((prev) => ({ ...prev, detail: false }));
        }
      }
    },
    [baseUrl, canUseProtectedApi, formatError, selectedJobId, token]
  );

  const selectJob = useCallback(
    async (jobId) => {
      if (!jobId) return;

      setSelectedJobId(jobId);
      setJobDetail(null);
      setPollingFailureCount(0);
      setPollingStatusMessage('');
      await refreshSelectedJob({ jobId, trigger: 'selection' });
    },
    [refreshSelectedJob]
  );

  useEffect(() => {
    if (canUseProtectedApi) return;

    setJobs([]);
    setSelectedJobId('');
    setJobDetail(null);
    setListError('');
    setManualError('');
    setJobsUpdatedAt('');
    setDetailUpdatedAt('');
    setPollingFailureCount(0);
    setPollingStatusMessage('');
    setLoading(createInitialLoadingState());
  }, [canUseProtectedApi]);

  useEffect(() => {
    if (!canUseProtectedApi) return;
    void refreshJobs();
  }, [canUseProtectedApi, refreshJobs]);

  useEffect(() => {
    if (!initialJobId || !canUseProtectedApi) return;

    const syncInitialJob = async () => {
      await refreshJobs();
      const isHandled = await refreshSelectedJob({ jobId: initialJobId, trigger: 'initial' });
      if (!isHandled) return;
      onInitialJobHandled();
    };

    void syncInitialJob();
  }, [canUseProtectedApi, initialJobId, onInitialJobHandled, refreshJobs, refreshSelectedJob]);

  useJobPolling(
    jobDetail?.status,
    () => refreshSelectedJob({ trigger: 'polling' }),
    2500,
    Boolean(selectedJobId)
  );

  const detailViewState = deriveDetailViewState({
    selectedJobId,
    jobDetail,
    isDetailLoading: loading.detail,
    manualError,
    pollingStatusMessage
  });

  return (
    <div className="result-step-content">
      {listError && <p className="message error">{listError}</p>}

      <JobList
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelect={selectJob}
        onRefresh={refreshJobs}
        loading={loading.jobs}
        lastUpdatedAt={formatUpdatedAt(jobsUpdatedAt)}
      />

      <JobDetail
        viewState={detailViewState}
        detail={jobDetail}
        selectedJobId={selectedJobId}
        onRefresh={() => refreshSelectedJob({ trigger: 'manual' })}
        loading={loading.detail}
        isAutoRefreshing={jobDetail?.status === 'queued' || jobDetail?.status === 'running'}
        lastUpdatedAt={formatUpdatedAt(detailUpdatedAt)}
        manualError={manualError}
        pollingStatusMessage={pollingStatusMessage}
        baseUrl={baseUrl}
        artifactUrlBuilder={apiClient.artifactUrl}
      />
    </div>
  );
}
