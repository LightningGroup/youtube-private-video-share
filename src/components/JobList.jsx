function statusClass(status) {
  if (status === 'success' || status === 'completed') return 'status success';
  if (status === 'failed') return 'status failed';
  if (status === 'partial') return 'status partial';
  if (status === 'queued') return 'status queued';
  return 'status running';
}

export default function JobList({ jobs, selectedJobId, onSelect, loading }) {
  return (
    <section className="panel">
      <h2>4) 최근 작업 목록</h2>
      {loading && <p>불러오는 중...</p>}
      {!loading && jobs.length === 0 && <p>작업이 없습니다.</p>}

      <ul className="job-list">
        {jobs.map((job) => (
          <li key={job.jobId}>
            <button
              type="button"
              onClick={() => onSelect(job.jobId)}
              className={selectedJobId === job.jobId ? 'active' : ''}
            >
              <span>{job.jobId}</span>
              <span className={statusClass(job.status)}>{job.status}</span>
              <small>{job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
