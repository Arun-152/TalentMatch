import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertCircle, FileSearch } from 'lucide-react';
import { analysisService } from '../services/analysisService';

// Inline dialog component — no window.confirm()
const DeleteDialog = ({ onConfirm, onCancel, isDeleting }) => (
  <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div className="dialog">
      <Trash2 size={32} className="dialog-icon" aria-hidden="true" />
      <h2 id="dialog-title" className="dialog-title">Delete analysis?</h2>
      <p className="dialog-desc">
        This will permanently remove this result. You can always re-run the match.
      </p>
      <div className="dialog-actions">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isDeleting}
          autoFocus
        >
          Cancel
        </button>
        <button
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={isDeleting}
          aria-busy={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const ScorePill = ({ score }) => {
  const pct = Math.round(score);
  const cls =
    pct >= 75 ? 'score-pill-high' :
    pct >= 50 ? 'score-pill-mid'  :
                'score-pill-low';
  return (
    <span className={`score-pill ${cls}`} aria-label={`Score: ${pct}%`}>
      {pct}%
    </span>
  );
};

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchHistory = async (pageNumber) => {
    try {
      setLoading(true);
      const data = await analysisService.getAnalyses(pageNumber);
      const results = data.results ?? data;
      if (pageNumber === 1) {
        setAnalyses(results);
      } else {
        setAnalyses((prev) => [...prev, ...results]);
      }
      setHasMore(!!data.next);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    try {
      setIsDeleting(true);
      await analysisService.deleteAnalysis(pendingDeleteId);
      setAnalyses((prev) => prev.filter((item) => item.id !== pendingDeleteId));
    } catch {
      setError('Failed to delete the analysis. Please try again.');
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Loading skeleton
  if (loading && page === 1) {
    return (
      <div className="history-page" aria-busy="true" aria-label="Loading history">
        <div className="page-header">
          <div>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">Past resume analyses</p>
          </div>
        </div>
        <div className="history-table" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {pendingDeleteId && (
        <DeleteDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">
            {analyses.length} past {analyses.length === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state" role="status">
          <FileSearch size={40} className="empty-icon" aria-hidden="true" />
          <p className="empty-title">No analyses yet</p>
          <p className="empty-desc">
            Run your first resume match and results will appear here.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Run your first match
          </button>
        </div>
      ) : (
        <>
          <div
            className="history-table"
            role="table"
            aria-label="Analysis history"
          >
            {/* Header row */}
            <div className="history-table-header" role="row" aria-hidden="true">
              <span className="history-col-label">Score</span>
              <span className="history-col-label">Candidate</span>
              <span className="history-col-label">Role</span>
              <span className="history-col-label">Date</span>
              <span className="history-col-label" />
            </div>

            {analyses.map((item) => (
              <div
                key={item.id}
                className="history-row"
                role="row"
                onClick={() => navigate(`/analysis/${item.id}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/analysis/${item.id}`);
                }}
                aria-label={`View analysis for ${item.candidate_name ?? 'Resume'} at ${item.job_title}`}
              >
                <span className="history-score" role="cell">
                  <ScorePill score={item.compatibility_score} />
                </span>
                <span className="history-name" role="cell">
                  {item.candidate_name || 'Resume Upload'}
                </span>
                <span className="history-job" role="cell">
                  {item.job_title || '—'}
                </span>
                <span className="history-date" role="cell">
                  {formatDate(item.created_at)}
                </span>
                <span className="history-delete" role="cell">
                  <button
                    className="history-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(item.id);
                    }}
                    disabled={isDeleting && pendingDeleteId === item.id}
                    aria-label={`Delete analysis for ${item.candidate_name ?? 'this resume'}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
