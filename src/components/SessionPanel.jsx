import { useRef } from 'react';

export default function SessionPanel({
  session,
  onRefresh,
  onUpload,
  onDelete,
  loading,
  error,
  success
}) {
  const fileRef = useRef(null);

  const handleUpload = async (event) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await onUpload(file);
    fileRef.current.value = '';
  };

  return (
    <section className="panel">
      <h2>2) 세션 상태</h2>
      <div className="row gap-sm wrap">
        <button type="button" onClick={onRefresh} disabled={loading}>
          상태 새로고침
        </button>
        <button type="button" className="danger" onClick={onDelete} disabled={loading}>
          저장된 세션 삭제
        </button>
      </div>

      <ul className="meta-list">
        <li>authenticated: {String(Boolean(session?.authenticated))}</li>
        <li>hasStorageState: {String(Boolean(session?.hasStorageState))}</li>
        <li>updatedAt: {session?.updatedAt ? new Date(session.updatedAt).toLocaleString() : '-'}</li>
      </ul>

      <form onSubmit={handleUpload} className="field">
        <label htmlFor="storage-state">storageState.json 업로드</label>
        <input id="storage-state" ref={fileRef} type="file" accept="application/json,.json" />
        <button type="submit" disabled={loading}>
          업로드
        </button>
      </form>

      {error && <p className="message error">{error}</p>}
      {success && <p className="message success">{success}</p>}
    </section>
  );
}
