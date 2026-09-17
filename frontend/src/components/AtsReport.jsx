import React from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  Link2,
  Globe,
  FileText,
  GraduationCap,
  Briefcase,
  User,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
} from 'lucide-react';

// ── Helper: pass/fail icon ─────────────────────────────────────────
const StatusIcon = ({ present }) =>
  present ? (
    <CheckCircle2 size={15} strokeWidth={2} className="ats-check-icon ats-check-pass" aria-label="Passed" />
  ) : (
    <XCircle size={15} strokeWidth={2} className="ats-check-icon ats-check-fail" aria-label="Failed" />
  );

// ── Contact icon map ───────────────────────────────────────────────
const CONTACT_ICONS = {
  email:     <Mail      size={14} aria-hidden="true" />,
  phone:     <Phone     size={14} aria-hidden="true" />,
  linkedin:  <Link2     size={14} aria-hidden="true" />,
  portfolio: <Globe     size={14} aria-hidden="true" />,
};

const CONTACT_LABELS = {
  email:     'Email address',
  phone:     'Phone number',
  linkedin:  'LinkedIn profile',
  portfolio: 'Portfolio / GitHub',
};

// ── Section icon map ───────────────────────────────────────────────
const SECTION_ICONS = {
  experience: <Briefcase     size={14} aria-hidden="true" />,
  education:  <GraduationCap size={14} aria-hidden="true" />,
  skills:     <Zap           size={14} aria-hidden="true" />,
  summary:    <User          size={14} aria-hidden="true" />,
};

const SECTION_LABELS = {
  experience: 'Work experience section',
  education:  'Education section',
  skills:     'Skills section',
  summary:    'Summary / objective',
};

// ── Score ring (small, 56px) ───────────────────────────────────────
const AtsScoreRing = ({ score }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    score >= 70 ? 'var(--matched)' :
    score >= 45 ? 'var(--missing)' :
    'var(--danger)';

  return (
    <svg width={56} height={56} viewBox="0 0 56 56" aria-label={`ATS keyword coverage: ${score}%`} role="img">
      <circle cx={28} cy={28} r={r} fill="none" stroke="var(--border-sub)" strokeWidth={4} />
      <circle
        cx={28} cy={28} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
      <text x={28} y={32} textAnchor="middle" fontSize={11} fontWeight={600}
        fill="var(--text-primary)" fontFamily="var(--font-mono)">
        {score}%
      </text>
    </svg>
  );
};

// ── Length badge ───────────────────────────────────────────────────
const LengthBadge = ({ status, wordCount, message }) => {
  const cls =
    status === 'ok'       ? 'ats-length-ok' :
    status === 'too_long' ? 'ats-length-warn' : 'ats-length-warn';
  const icon =
    status === 'ok'
      ? <CheckCircle2 size={14} aria-hidden="true" />
      : <AlertTriangle size={14} aria-hidden="true" />;

  return (
    <div className={`ats-length-badge ${cls}`}>
      {icon}
      <span>{message}</span>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────
/**
 * AtsReport
 * Renders the ATS check results section on the Analysis Result page.
 *
 * Props:
 *   atsReport — the ats_report object from the API (may be null for old records)
 */
const AtsReport = ({ atsReport }) => {
  if (!atsReport) return null;

  const {
    keyword_coverage_score,
    contact_checks,
    section_checks,
    length_check,
    missing_keywords,
    detected_field,
    skills_coverage,
  } = atsReport;

  const overallPassed =
    Object.values(contact_checks).filter(c => c.present).length +
    Object.values(section_checks).filter(s => s.present).length;
  const overallTotal =
    Object.keys(contact_checks).length + Object.keys(section_checks).length;

  return (
    <section className="ats-report-section content-section" aria-label="ATS Resume Check">

      {/* Section header */}
      <div className="section-header">
        <div className="section-icon section-icon-ats" aria-hidden="true">
          <ShieldCheck size={15} strokeWidth={2} />
        </div>
        <h2 className="section-title">ATS Resume Check</h2>
        <span className="section-count" aria-label={`${overallPassed} of ${overallTotal} checks passed`}>
          {overallPassed}/{overallTotal}
        </span>
      </div>

      {/* Score + field row */}
      <div className="ats-score-row">
        <div className="ats-score-block">
          <AtsScoreRing score={keyword_coverage_score} />
          <div>
            <p className="ats-score-label">Keyword coverage</p>
            {detected_field && (
              <p className="ats-field-label">
                Detected field: <strong>{detected_field.replace('_', ' ')}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Length check */}
        <LengthBadge
          status={length_check.status}
          wordCount={length_check.word_count}
          message={length_check.message}
        />
      </div>

      {/* Checklist: contact + sections in a 2-column grid */}
      <div className="ats-checklist-grid">

        {/* Contact info */}
        <div className="ats-checklist-block">
          <p className="ats-checklist-heading">Contact Information</p>
          <ul className="ats-checklist" role="list">
            {Object.entries(contact_checks).map(([key, check]) => (
              <li key={key} className="ats-check-row">
                <StatusIcon present={check.present} />
                <span className="ats-check-icon-label" aria-hidden="true">
                  {CONTACT_ICONS[key]}
                </span>
                <span className="ats-check-label">{CONTACT_LABELS[key]}</span>
                {!check.present && (
                  <span className="ats-check-message">{check.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Standard sections */}
        <div className="ats-checklist-block">
          <p className="ats-checklist-heading">Document Sections</p>
          <ul className="ats-checklist" role="list">
            {Object.entries(section_checks).map(([key, check]) => (
              <li key={key} className="ats-check-row">
                <StatusIcon present={check.present} />
                <span className="ats-check-icon-label" aria-hidden="true">
                  {SECTION_ICONS[key]}
                </span>
                <span className="ats-check-label">{SECTION_LABELS[key]}</span>
                {!check.present && (
                  <span className="ats-check-message">{check.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Missing keywords */}
      {missing_keywords && missing_keywords.length > 0 && (
        <div className="ats-missing-keywords">
          <div className="plan-block-header">
            <Tag size={14} aria-hidden="true" />
            Missing ATS keywords
          </div>
          <p className="ats-keywords-desc">
            These keywords appear in common ATS filters for{' '}
            {detected_field ? <strong>{detected_field.replace('_', ' ')}</strong> : 'this field'} roles
            but were not found in your resume. Adding them naturally in your experience or skills
            section can improve machine-screening pass rates.
          </p>
          <div className="skills-list">
            {missing_keywords.map((kw) => (
              <span key={kw} className="skill-tag skill-tag-missing">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AtsReport;
