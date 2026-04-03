import { useMemo, useState } from 'react';
import { normalizeUniqueList, validateEmails } from '../utils/parseListInput';

export default function ShareForm({ connectionId, isConnectionReady, onSubmit, loading, submitError }) {
  const [videoInput, setVideoInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [disableEmailNotification, setDisableEmailNotification] = useState(true);
  const [locale, setLocale] = useState('auto');
  const [validationError, setValidationError] = useState('');

  const normalized = useMemo(() => {
    const videoIds = normalizeUniqueList(videoInput);
    const emails = normalizeUniqueList(emailInput, { toLower: true });
    const { valid, invalid } = validateEmails(emails);
    return { videoIds, emails: valid, invalidEmails: invalid };
  }, [videoInput, emailInput]);

  const submitWithDryRun = async (dryRun) => {
    setValidationError('');

    if (!isConnectionReady || !connectionId) {
      setValidationError('YouTube 연결이 완료되어야 공유 작업을 실행할 수 있습니다.');
      return;
    }

    if (normalized.videoIds.length === 0) {
      setValidationError('최소 1개 이상의 video ID가 필요합니다.');
      return;
    }

    if (normalized.emails.length === 0) {
      setValidationError('최소 1개 이상의 이메일이 필요합니다.');
      return;
    }

    if (normalized.invalidEmails.length > 0) {
      setValidationError(`유효하지 않은 이메일: ${normalized.invalidEmails.join(', ')}`);
      return;
    }

    await onSubmit({
      connectionId,
      videoIds: normalized.videoIds,
      emailsToAdd: normalized.emails,
      disableEmailNotification,
      dryRun,
      locale
    });
  };

  return (
    <section className="panel">
      <h2>3) 공유 실행</h2>
      <div className="grid-form">
        {!isConnectionReady && (
          <p className="message info">연결 완료 전에는 공유 요청을 보낼 수 없습니다. 먼저 loginSession 로그인을 완료하세요.</p>
        )}

        <div className="field">
          <label htmlFor="video-ids">Video IDs (줄바꿈/콤마 구분)</label>
          <textarea
            id="video-ids"
            rows="4"
            value={videoInput}
            onChange={(event) => setVideoInput(event.target.value)}
            placeholder="AbCdEf12345, ZxYwVu98765"
          />
        </div>

        <div className="field">
          <label htmlFor="emails">Emails (줄바꿈/콤마 구분)</label>
          <textarea
            id="emails"
            rows="4"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="a@gmail.com\nb@gmail.com"
          />
        </div>

        <div className="row gap-sm wrap">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={disableEmailNotification}
              onChange={(event) => setDisableEmailNotification(event.target.checked)}
            />
            이메일 알림 비활성화
          </label>
        </div>

        <div className="field">
          <label htmlFor="locale">Locale</label>
          <select id="locale" value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="auto">auto</option>
            <option value="ko">ko</option>
            <option value="en">en</option>
          </select>
        </div>

        <div className="message info">
          <div>connectionId: {connectionId || '(미연결)'}</div>
          <div>정규화 videoIds: {normalized.videoIds.join(', ') || '(없음)'}</div>
          <div>정규화 emails: {normalized.emails.join(', ') || '(없음)'}</div>
        </div>

        {validationError && <p className="message error">{validationError}</p>}
        {submitError && <p className="message error">{submitError}</p>}

        <div className="row gap-sm wrap">
          <button type="button" disabled={loading || !isConnectionReady} onClick={() => submitWithDryRun(true)}>
            {loading ? '요청 중...' : 'Dry-run 실행'}
          </button>
          <button type="button" disabled={loading || !isConnectionReady} onClick={() => submitWithDryRun(false)}>
            {loading ? '요청 중...' : '실제 실행'}
          </button>
        </div>
      </div>
    </section>
  );
}
