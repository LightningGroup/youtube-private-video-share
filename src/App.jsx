import { useMemo, useState } from 'react';
import { apiClient } from './api/client';
import ServerConfigPanel from './components/ServerConfigPanel';
import SessionPanel from './components/SessionPanel';
import ShareForm from './components/ShareForm';
import ResultPanel from './components/ResultPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { normalizeBaseUrl } from './utils/normalizeBaseUrl';

const WIZARD_STEPS = [
  { key: 'server', title: '서버 연결 설정' },
  { key: 'session', title: '세션 상태 확인' },
  { key: 'share', title: '공유 실행 설정' },
  { key: 'result', title: '작업 진행/결과 확인' }
];

const INITIAL_STEP = 1;

function classifyError(error) {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  if (error.code === 'NETWORK_ERROR') return `네트워크 오류: ${error.message}`;
  if (error.code === 'AUTH_ERROR') return `인증 오류: ${error.message}`;
  return `요청 오류: ${error.message}`;
}

/**
 * 단계 이동 가능 여부를 계산한다.
 */
function canEnterStep({ step, isConnectionReady, isSessionReady }) {
  if (step <= 1) return true;
  if (!isConnectionReady) return false;
  if (step <= 2) return true;
  if (!isSessionReady) return false;
  return true;
}

export default function App() {
  const [baseUrl, setBaseUrl] = useLocalStorage('ytps.baseUrl', '');
  const [token, setToken] = useLocalStorage('ytps.adminToken', '');

  const [healthResult, setHealthResult] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [jobMessage, setJobMessage] = useState('');
  const [pendingInitialJobId, setPendingInitialJobId] = useState('');
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);

  const [loading, setLoading] = useState({
    health: false,
    session: false,
    share: false
  });

  const canUseProtectedApi = useMemo(() => normalizeBaseUrl(baseUrl) && token.trim(), [baseUrl, token]);
  const isConnectionReady = useMemo(() => Boolean(canUseProtectedApi && healthResult?.ok), [canUseProtectedApi, healthResult]);
  const isSessionReady = useMemo(
    () => Boolean(isConnectionReady && session?.authenticated && session?.hasStorageState),
    [isConnectionReady, session]
  );

  const testConnection = async (candidateBaseUrl) => {
    const nextBaseUrl = normalizeBaseUrl(candidateBaseUrl || baseUrl);
    if (!nextBaseUrl) {
      setHealthResult({ ok: false, message: 'Base URL을 입력해 주세요.' });
      return;
    }

    setBaseUrl(nextBaseUrl);
    setLoading((prev) => ({ ...prev, health: true }));

    try {
      const data = await apiClient.getHealth(nextBaseUrl);
      setHealthResult({ ok: true, ...data });
    } catch (error) {
      setHealthResult({ ok: false, message: classifyError(error) });
    } finally {
      setLoading((prev) => ({ ...prev, health: false }));
    }
  };

  const refreshSession = async () => {
    if (!canUseProtectedApi) {
      setSessionError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    setLoading((prev) => ({ ...prev, session: true }));
    setSessionError('');
    setSessionSuccess('');

    try {
      const data = await apiClient.getSessionStatus(baseUrl, token);
      setSession(data);
    } catch (error) {
      setSessionError(classifyError(error));
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const uploadStorageState = async (file) => {
    if (!canUseProtectedApi) {
      setSessionError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    setLoading((prev) => ({ ...prev, session: true }));
    setSessionError('');
    setSessionSuccess('');

    try {
      await apiClient.uploadStorageState(baseUrl, token, file);
      setSessionSuccess('storageState 업로드 성공');
      await refreshSession();
    } catch (error) {
      setSessionError(classifyError(error));
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const deleteStorageState = async () => {
    if (!canUseProtectedApi) {
      setSessionError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    setLoading((prev) => ({ ...prev, session: true }));
    setSessionError('');
    setSessionSuccess('');

    try {
      await apiClient.deleteStorageState(baseUrl, token);
      setSessionSuccess('저장된 storageState를 삭제했습니다.');
      await refreshSession();
    } catch (error) {
      setSessionError(classifyError(error));
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const createShareJob = async (payload) => {
    if (!canUseProtectedApi) {
      alert('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    setLoading((prev) => ({ ...prev, share: true }));
    setJobMessage('');

    try {
      const created = await apiClient.createShareJob(baseUrl, token, payload);
      setJobMessage(`작업이 생성되었습니다. jobId=${created.jobId}, status=${created.status}`);
      setPendingInitialJobId(created.jobId);
      setCurrentStep(4);
    } catch (error) {
      setJobMessage(classifyError(error));
    } finally {
      setLoading((prev) => ({ ...prev, share: false }));
    }
  };

  const currentStepMeta = WIZARD_STEPS[currentStep - 1];
  const canGoBack = currentStep > 1;
  const canGoForward = canEnterStep({ step: currentStep + 1, isConnectionReady, isSessionReady });

  const goToStep = (nextStep) => {
    if (!canEnterStep({ step: nextStep, isConnectionReady, isSessionReady })) return;
    setCurrentStep(nextStep);
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <ServerConfigPanel
          baseUrl={baseUrl}
          token={token}
          onBaseUrlChange={(value) => setBaseUrl(normalizeBaseUrl(value))}
          onTokenChange={setToken}
          onTestConnection={testConnection}
          healthResult={healthResult}
          loading={loading.health}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <SessionPanel
          session={session}
          onRefresh={refreshSession}
          onUpload={uploadStorageState}
          onDelete={deleteStorageState}
          loading={loading.session}
          error={sessionError}
          success={sessionSuccess}
        />
      );
    }

    if (currentStep === 3) {
      return <ShareForm onSubmit={createShareJob} loading={loading.share} />;
    }

    return (
      <ResultPanel
        baseUrl={baseUrl}
        token={token}
        canUseProtectedApi={canUseProtectedApi}
        initialJobId={pendingInitialJobId}
        onInitialJobHandled={() => setPendingInitialJobId('')}
        formatError={classifyError}
      />
    );
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>YouTube 비공개 공유 작업</h1>
      </header>

      <section className="wizard-shell panel">
        <div className="wizard-top">
          <p className="wizard-progress">Step {currentStep} / {WIZARD_STEPS.length}</p>
          <h2 className="wizard-title">{currentStepMeta.title}</h2>
          <ol className="step-indicator" aria-label="단계 표시">
            {WIZARD_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isBlocked = !canEnterStep({ step: stepNumber, isConnectionReady, isSessionReady });

              return (
                <li key={step.key} className={isActive ? 'active' : ''}>
                  <button
                    type="button"
                    className="step-chip"
                    onClick={() => goToStep(stepNumber)}
                    disabled={isBlocked}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className="step-chip-number">{stepNumber}</span>
                    <span className="step-chip-label">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="wizard-body">{renderStepContent()}</div>

        <div className="wizard-actions">
          <button type="button" onClick={() => goToStep(currentStep - 1)} disabled={!canGoBack}>
            이전 단계
          </button>
          <button type="button" onClick={() => goToStep(currentStep + 1)} disabled={!canGoForward}>
            다음 단계
          </button>
        </div>
      </section>

      {jobMessage && <p className="message info">{jobMessage}</p>}
    </div>
  );
}
