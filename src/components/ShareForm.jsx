import { useMemo, useState } from 'react';
import { normalizeUniqueList, validateEmails } from '../utils/parseListInput';

export default function ShareForm({ onSubmit, loading }) {
  const [videoInput, setVideoInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [disableEmailNotification, setDisableEmailNotification] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [locale, setLocale] = useState('auto');
  const [validationError, setValidationError] = useState('');

  const normalized = useMemo(() => {
    const videoIds = normalizeUniqueList(videoInput);
    const emails = normalizeUniqueList(emailInput, { toLower: true });
    const { valid, invalid } = validateEmails(emails);
    return { videoIds, emails: valid, invalidEmails: invalid };
  }, [videoInput, emailInput]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');

    if (normalized.videoIds.length === 0) {
      setValidationError('최소 1개 이상의 video ID가 필요합니다.');
      return;
    }

    if (normalized.invalidEmails.length > 0) {
      setValidationError(`유효하지 않은 이메일: ${normalized.invalidEmails.join(', ')}`);
      return;
    }

    await onSubmit({
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
      <form onSubmit={handleSubmit} className="grid-form">
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
          <label className="checkbox">
            <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
            Dry Run
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
          <div>정규화 videoIds: {normalized.videoIds.join(', ') || '(없음)'}</div>
          <div>정규화 emails: {normalized.emails.join(', ') || '(없음)'}</div>
        </div>

        {validationError && <p className="message error">{validationError}</p>}

        <button type="submit" disabled={loading}>
          {loading ? '실행 요청 중...' : '작업 실행'}
        </button>
      </form>
    </section>
  );
}
