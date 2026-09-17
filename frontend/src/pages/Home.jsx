import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { jobService } from '../services/jobService';
import { analysisService } from '../services/analysisService';
import Loader from '../components/Loader';
import SkillNetworkVisual from '../components/SkillNetworkVisual';

const Home = () => {
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(fileExt)) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      setFile(null);
      e.target.value = null;
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5 MB.');
      setFile(null);
      e.target.value = null;
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please upload a resume before running the analysis.');
      return;
    }
    if (!jobTitle.trim() || !jobText.trim()) {
      setError('A job title and description are both required.');
      return;
    }

    try {
      setLoading(true);

      setLoadingMessage('Extracting skills from resume...');
      const formData = new FormData();
      formData.append('file', file);
      const resumeResponse = await resumeService.uploadResume(formData);

      setLoadingMessage('Analyzing job requirements...');
      const jobResponse = await jobService.createJobDescription({
        title: jobTitle,
        raw_text: jobText,
      });

      setLoadingMessage('Computing compatibility match...');
      const analysisResponse = await analysisService.createAnalysis({
        resume: resumeResponse.id,
        job_description: jobResponse.id,
      });

      navigate(`/analysis/${analysisResponse.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {loading && <Loader message={loadingMessage} />}

      {/* ── Split hero: text left, network visual right ── */}
      <section className="hero-split" aria-label="Introduction">
        <div className="hero-copy">
          <h1 className="hero-title">
            Match candidates<br />
            to roles — <span>objectively</span>
          </h1>
          <p className="hero-subtitle">
            Upload a resume and paste a job description. TalentMatch extracts skills
            from both and returns a structured compatibility score — no guesswork.
          </p>
          <div className="hero-stats" aria-hidden="true">
            <div className="hero-stat">
              <span className="hero-stat-value">Skill-based</span>
              <span className="hero-stat-label">Matching</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Instant</span>
              <span className="hero-stat-label">Results</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">No AI bias</span>
              <span className="hero-stat-label">Deterministic</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <SkillNetworkVisual />
        </div>
      </section>

      {/* ── Upload form ── */}
      <div className="form-card" role="main" id="upload-form">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Resume and job description analysis form"
        >
          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-two-col">
            {/* Resume Upload */}
            <div className="form-card-section">
              <div className="section-label">
                <FileText size={13} aria-hidden="true" />
                Resume
              </div>

              <div className="file-upload-wrapper">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  aria-label="Upload resume file"
                />
                <label
                  htmlFor="resume-upload"
                  className={`file-upload-label${file ? ' has-file' : ''}`}
                >
                  <Upload size={22} className="file-upload-icon" aria-hidden="true" />
                  <span className="file-upload-name">
                    {file ? file.name : 'Click to upload or drag here'}
                  </span>
                  <span className="file-upload-hint">PDF, DOCX or TXT — max 5 MB</span>
                </label>
              </div>
            </div>

            {/* Job Details */}
            <div className="form-card-section">
              <div className="section-label">
                <Briefcase size={13} aria-hidden="true" />
                Job Description
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  id="job-description"
                  rows={5}
                  placeholder="Paste the full job description here..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-submit-row">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              aria-busy={loading}
            >
              <ArrowRight size={16} aria-hidden="true" />
              Analyze Compatibility
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
