import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CircleDashed,
  BookOpen,
  Trophy,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { useAsync } from '../hooks/useAsync';
import Loader from '../components/Loader';
import MatchDiagram from '../components/MatchDiagram';
import SkillChip from '../components/SkillChip';
import AtsReport from '../components/AtsReport';

const AnalysisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    execute: fetchAnalysis,
    data: analysis,
    loading,
    error,
  } = useAsync(analysisService.getAnalysis);

  useEffect(() => {
    fetchAnalysis(id);
  }, [id, fetchAnalysis]);

  if (loading) return <Loader message="Loading results..." />;

  if (error) {
    return (
      <div className="error-state" role="alert">
        <AlertCircle size={40} className="empty-icon" aria-hidden="true" />
        <h2 className="error-title">Could not load results</h2>
        <p className="error-desc">{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          <ArrowLeft size={14} aria-hidden="true" />
          Go back
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const matchedNames  = analysis.matched_skills.map(s => s.name);
  const missingNames  = analysis.missing_skills.map(s => s.name);
  const isPerfectMatch = missingNames.length === 0;
  const hasImprovement = analysis.improvement_plan && analysis.improvement_plan.length > 0;

  return (
    <div className="analysis-page">
      {/* ── Page header ── */}
      <div className="analysis-header">
        <Link to="/" className="back-link" aria-label="Start a new analysis">
          <ArrowLeft size={14} aria-hidden="true" />
          New Analysis
        </Link>
        <div className="analysis-meta">
          <h1 className="analysis-candidate">
            {analysis.candidate_name || 'Resume Upload'}
          </h1>
          <p className="analysis-job">
            Matched against: <strong>{analysis.job_title}</strong>
          </p>
        </div>
      </div>

      {/* ── Main layout: diagram left, skill panels right ── */}
      <div className="analysis-layout">

        {/* Left: Match diagram (score embedded inside) */}
        <aside className="diagram-panel" aria-label="Skill match diagram">
          <div className="diagram-panel-inner">
            <MatchDiagram
              matchedSkills={matchedNames}
              missingSkills={missingNames}
              score={analysis.compatibility_score}
            />
            <p className="diagram-caption">
              <strong>{matchedNames.length}</strong> of{' '}
              <strong>{matchedNames.length + missingNames.length}</strong>{' '}
              required skills matched
            </p>
          </div>
        </aside>

        {/* Right: Matched skills + Skills gap + ATS report */}
        <main className="content-panel" aria-label="Analysis breakdown">

          {/* Matched Skills */}
          <section className="content-section" aria-label="Matched skills">
            <div className="section-header">
              <div className="section-icon section-icon-matched" aria-hidden="true">
                <CheckCircle2 size={15} strokeWidth={2} />
              </div>
              <h2 className="section-title">Matched Skills</h2>
              <span className="section-count" aria-label={`${analysis.matched_skills.length} matched`}>
                {analysis.matched_skills.length}
              </span>
            </div>

            {analysis.matched_skills.length === 0 ? (
              <p className="section-empty">No matching skills were extracted.</p>
            ) : (
              <div className="skills-list">
                {analysis.matched_skills.map((skill) => (
                  <SkillChip key={skill.id} name={skill.name} type="matched" />
                ))}
              </div>
            )}
          </section>

          {/* Skills Gap + Improvement Plan — grouped as one block */}
          {!isPerfectMatch && (
            <section className="content-section gap-section" aria-label="Skills gap and improvement plan">
              <div className="section-header">
                <div className="section-icon section-icon-missing" aria-hidden="true">
                  <CircleDashed size={15} strokeWidth={2} />
                </div>
                <h2 className="section-title">Skills Gap</h2>
                <span className="section-count" aria-label={`${analysis.missing_skills.length} missing`}>
                  {analysis.missing_skills.length}
                </span>
              </div>

              <div className="skills-list" style={{ marginBottom: 'var(--space-6)' }}>
                {analysis.missing_skills.map((skill) => (
                  <SkillChip key={skill.id} name={skill.name} type="missing" />
                ))}
              </div>

              {(analysis.improvement_summary || hasImprovement) && (
                <div className="plan-block">
                  <div className="plan-block-header">
                    <BookOpen size={14} aria-hidden="true" />
                    How to close the gap
                  </div>

                  {analysis.improvement_summary && (
                    <p className="improvement-summary">{analysis.improvement_summary}</p>
                  )}

                  {hasImprovement && (
                    <ul className="tip-list" aria-label="Improvement tips">
                      {analysis.improvement_plan.map((tip, idx) => (
                        <li key={idx} className="tip-item">
                          <div className="tip-icon" aria-hidden="true">
                            <BookOpen size={15} strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="tip-skill-name">{tip.skill}</p>
                            <p className="tip-why">{tip.why_it_matters}</p>
                            <p className="tip-action">
                              <span className="tip-action-label">Action: </span>
                              {tip.action}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Perfect match state */}
          {isPerfectMatch && (
            <section className="content-section" aria-label="Perfect match">
              <div className="congrats-message" role="status">
                <Trophy size={18} aria-hidden="true" />
                Congratulations — this candidate is a 100% match for all extracted requirements.
              </div>
            </section>
          )}

          {/* ATS Resume Check — always shown when ats_report is present */}
          <AtsReport atsReport={analysis.ats_report} />

        </main>
      </div>
    </div>
  );
};

export default AnalysisDetail;
