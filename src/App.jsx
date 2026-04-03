import { useMemo, useState } from 'react';
import { apiClient } from './api/client';
import ServerConfigPanel from './components/ServerConfigPanel';
import YouTubeConnectionPanel from './components/YouTubeConnectionPanel';
import ShareForm from './components/ShareForm';
import ResultPanel from './components/ResultPanel';
import { CONNECTION_FLOW_STATE } from './constants/statuses';
import { useConnectionFlow } from './hooks/useConnectionFlow';
import { useLocalStorage } from './hooks/useLocalStorage';
import { normalizeBaseUrl } from './utils/normalizeBaseUrl';

const WIZARD_STEPS = [
  { key: 'server', title: '서버 연결 설정' },
  { key: 'youtubeConnection', title: 'YouTube 연결' },
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
function canEnterStep({ step, isServerReady, isYouTubeConnected }) {
  if (step <= 1) return true;
  if (!isServerReady) return false;
  if (step <= 2) return true;
  if (!isYouTubeConnected) return false;
  return true;
}

export default function App() {
  const [baseUrl, setBaseUrl] = useLocalStorage('ytps.baseUrl', '');
  const [token, setToken] = useLocalStorage('ytps.adminToken', '');

  const [healthResult, setHealthResult] = useState(null);
  const [jobMessage, setJobMessage] = useState('');
  const [shareError, setShareError] = useState('');
  const [pendingInitialJobId, setPendingInitialJobId] = useState('');
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);

  const [loading, setLoading] = useState({
    health: false,
    share: false
  });

  const canUseProtectedApi = useMemo(() => normalizeBaseUrl(baseUrl) && token.trim(), [baseUrl, token]);
  const isServerReady = useMemo(() => Boolean(canUseProtectedApi && healthResult?.ok), [canUseProtectedApi, healthResult]);

  const connectionFlow = useConnectionFlow({
    baseUrl,
    token,
    canUseProtectedApi,
    formatError: classifyError
  });

  const isYouTubeConnected = useMemo(
    () => Boolean(isServerReady && connectionFlow.isConnected),
    [connectionFlow.isConnected, isServerReady]
  );

  const testConnection = async (candidateBaseUrl) => {
    const nextBaseUrl = normalizeBaseUrl(candidateBaseUrl || baseUrl);
    if (!nextBaseUrl) {
      setHealthResult({ ok: false, message: 'Base URL을 입력해 주세요.' });
      return;
    }

    setBaseUrl(nextBaseUrl);
    setLoading((previous) => ({ ...previous, health: true }));

    try {
      const data = await apiClient.getHealth(nextBaseUrl);
      setHealthResult({ ok: true, ...data });
    } catch (error) {
      setHealthResult({ ok: false, message: classifyError(error) });
    } finally {
      setLoading((previous) => ({ ...previous, health: false }));
    }
  };

  const createShareJob = async (payload) => {
    if (!canUseProtectedApi) {
      setShareError('서버 URL과 관리자 토큰을 먼저 입력해 주세요.');
      return;
    }

    if (!connectionFlow.connectionId || !isYouTubeConnected) {
      setShareError('YouTube 연결이 완료되어야 공유 작업을 실행할 수 있습니다.');
      return;
    }

    setLoading((previous) => ({ ...previous, share: true }));
    setJobMessage('');
    setShareError('');

    try {
      const created = await apiClient.createShareJob(baseUrl, token, payload);
      if (created?.status === 'needs_reauth') {
        connectionFlow.markReauthRequired();
        setShareError('세션이 만료되었습니다. 다시 연결하세요.');
        setCurrentStep(2);
        return;
      }

      setJobMessage(`작업이 생성되었습니다. jobId=${created.jobId}, status=${created.status}`);
      setPendingInitialJobId(created.jobId);
      setCurrentStep(4);
    } catch (error) {
      setShareError(classifyError(error));
    } finally {
      setLoading((previous) => ({ ...previous, share: false }));
    }
  };

  const currentStepMeta = WIZARD_STEPS[currentStep - 1];
  const canGoBack = currentStep > 1;
  const canGoForward = canEnterStep({
    step: currentStep + 1,
    isServerReady,
    isYouTubeConnected
  });

  const goToStep = (nextStep) => {
    if (!canEnterStep({ step: nextStep, isServerReady, isYouTubeConnected })) return;
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
        <YouTubeConnectionPanel
          connection={connectionFlow.connection}
          connectionId={connectionFlow.connectionId}
          connectionState={connectionFlow.connectionState}
          loginSession={connectionFlow.loginSession}
          loginSessionId={connectionFlow.loginSessionId}
          loading={connectionFlow.loading}
          error={connectionFlow.error}
          successMessage={connectionFlow.successMessage}
          onCreateConnection={connectionFlow.createConnection}
          onCreateLoginSession={connectionFlow.createLoginSession}
          onRefresh={connectionFlow.refreshConnections}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <ShareForm
          connectionId={connectionFlow.connectionId}
          isConnectionReady={isYouTubeConnected}
          onSubmit={createShareJob}
          loading={loading.share}
          submitError={shareError}
        />
      );
    }

    return (
      <ResultPanel
        baseUrl={baseUrl}
        token={token}
        canUseProtectedApi={canUseProtectedApi}
        initialJobId={pendingInitialJobId}
        onInitialJobHandled={() => setPendingInitialJobId('')}
        formatError={classifyError}
        onNeedsReauth={() => {
          connectionFlow.markReauthRequired();
          setCurrentStep(2);
        }}
      />
    );
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>YouTube 비공개 공유 작업</h1>
        {connectionFlow.connectionState === CONNECTION_FLOW_STATE.reauthRequired && (
          <p className="message error">세션이 만료되었습니다. 다시 연결하세요.</p>
        )}
      </header>

      <section className="wizard-shell panel">
        <div className="wizard-top">
          <p className="wizard-progress">Step {currentStep} / {WIZARD_STEPS.length}</p>
          <h2 className="wizard-title">{currentStepMeta.title}</h2>
          <ol className="step-indicator" aria-label="단계 표시">
            {WIZARD_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isBlocked = !canEnterStep({ step: stepNumber, isServerReady, isYouTubeConnected });

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
