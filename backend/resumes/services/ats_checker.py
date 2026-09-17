import re
from typing import Optional

# ──────────────────────────────────────────────────────────────────────
# ATS Checker — resumes/services/ats_checker.py
#
# WHY THIS IS A SEPARATE MODULE:
# The ATS check is a document-quality analysis, not a job-match analysis.
# It answers "Is this resume machine-readable and well-structured?" rather
# than "Does this candidate fit this role?". Keeping it here (in the
# resumes app) reflects that it operates on the resume document itself,
# independent of any specific job description. The job-match score lives
# in analyses/ where it belongs.
# ──────────────────────────────────────────────────────────────────────

# ── Section header patterns ────────────────────────────────────────
SECTION_PATTERNS = {
    'experience': re.compile(
        r'\b(work experience|experience|professional experience|employment history|work history|career history)\b',
        re.I
    ),
    'education': re.compile(
        r'\b(education|academic background|qualifications|degree|university|college)\b',
        re.I
    ),
    'skills': re.compile(
        r'\b(skills|technical skills|core competencies|competencies|expertise|proficiencies)\b',
        re.I
    ),
    'summary': re.compile(
        r'\b(summary|professional summary|objective|career objective|profile|about me|overview)\b',
        re.I
    ),
}

# ── Contact info patterns ──────────────────────────────────────────
EMAIL_PATTERN    = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
PHONE_PATTERN    = re.compile(r'(\+?\d[\d\s\-().]{7,}\d)')
LINKEDIN_PATTERN = re.compile(r'linkedin\.com/in/[\w\-]+', re.I)
PORTFOLIO_PATTERN = re.compile(r'(github\.com/[\w\-]+|portfolio\.|personal website)', re.I)

# ── Keyword taxonomy by field ──────────────────────────────────────
# Same extensible pattern as the skills taxonomy in parsing.py.
# Keys are skill/category names; values are keyword sets to scan for.
ATS_KEYWORD_TAXONOMY = {
    'software_engineering': {
        'keywords': [
            'python', 'java', 'javascript', 'sql', 'git', 'api', 'rest',
            'agile', 'docker', 'linux', 'testing', 'ci/cd', 'react', 'node',
        ],
        'triggers': {'python', 'java', 'javascript', 'react', 'node', 'django', 'flask'},
    },
    'data_science': {
        'keywords': [
            'machine learning', 'deep learning', 'pandas', 'numpy', 'sql',
            'python', 'r', 'tensorflow', 'pytorch', 'statistics', 'data analysis',
            'jupyter', 'scikit', 'visualization',
        ],
        'triggers': {'machine learning', 'deep learning', 'pandas', 'numpy', 'tensorflow'},
    },
    'devops': {
        'keywords': [
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
            'ansible', 'ci/cd', 'jenkins', 'linux', 'bash', 'monitoring',
            'prometheus', 'grafana',
        ],
        'triggers': {'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins'},
    },
    'frontend': {
        'keywords': [
            'react', 'vue', 'angular', 'html', 'css', 'javascript',
            'typescript', 'webpack', 'figma', 'responsive', 'accessibility',
            'rest api', 'git',
        ],
        'triggers': {'react', 'vue', 'angular', 'html', 'css'},
    },
}

# ── Word-count thresholds ──────────────────────────────────────────
MIN_WORDS = 150
MAX_WORDS = 1200


def _detect_field(text: str) -> Optional[str]:
    """Guess the candidate's field from skill trigger words in the resume."""
    lower = text.lower()
    for field, data in ATS_KEYWORD_TAXONOMY.items():
        hits = sum(1 for trigger in data['triggers'] if trigger in lower)
        if hits >= 2:
            return field
    return None


def run_ats_check(
    resume_text: str,
    raw_file_metadata: Optional[dict] = None,
    required_skills: Optional[list] = None,
    matched_skills: Optional[list] = None,
    missing_skills: Optional[list] = None,
) -> dict:
    """
    Run a structural ATS quality check on a resume.

    Args:
        resume_text:       Extracted plain text of the resume.
        raw_file_metadata: Optional dict with keys like {'filename', 'size_bytes'}.
        required_skills:   Job's required skill names (from the matcher) — optional.
        matched_skills:    Already-computed matched skill names — avoids recomputing.
        missing_skills:    Already-computed missing skill names — avoids recomputing.

    Returns a structured dict with individual check results and an overall
    keyword_coverage_score (0-100).
    """
    lower = resume_text.lower()
    word_count = len(resume_text.split())

    # ── 1. Contact information ───────────────────────────────────
    has_email    = bool(EMAIL_PATTERN.search(resume_text))
    has_phone    = bool(PHONE_PATTERN.search(resume_text))
    has_linkedin = bool(LINKEDIN_PATTERN.search(lower))
    has_portfolio = bool(PORTFOLIO_PATTERN.search(lower))

    contact_checks = {
        'email': {
            'present': has_email,
            'message': 'Email address detected.' if has_email
                       else 'No email address found — add one so ATS systems and recruiters can contact you.',
        },
        'phone': {
            'present': has_phone,
            'message': 'Phone number detected.' if has_phone
                       else 'No phone number found — add one so recruiters can reach you quickly.',
        },
        'linkedin': {
            'present': has_linkedin,
            'message': 'LinkedIn profile URL detected.' if has_linkedin
                       else 'No LinkedIn URL found — adding one increases recruiter confidence.',
        },
        'portfolio': {
            'present': has_portfolio,
            'message': 'Portfolio or GitHub URL detected.' if has_portfolio
                       else 'No portfolio or GitHub link found — consider adding one for technical roles.',
        },
    }

    # ── 2. Section presence ──────────────────────────────────────
    section_checks = {}
    for section, pattern in SECTION_PATTERNS.items():
        present = bool(pattern.search(resume_text))
        messages = {
            'experience': ('Work experience section detected.',
                           'No clear "Experience" section heading — add one so ATS parsers can locate your history.'),
            'education': ('Education section detected.',
                          'No clear "Education" section — add one; many ATS systems require it.'),
            'skills': ('Skills section detected.',
                       'No dedicated "Skills" section — add one to help ATS parsers extract your competencies.'),
            'summary': ('Professional summary detected.',
                        'No summary or objective section — a 2–3 sentence summary helps ATS and recruiter screening.'),
        }
        ok_msg, fail_msg = messages[section]
        section_checks[section] = {
            'present': present,
            'message': ok_msg if present else fail_msg,
        }

    # ── 3. Resume length ─────────────────────────────────────────
    if word_count < MIN_WORDS:
        length_status = 'too_short'
        length_message = (
            f'Resume is very short ({word_count} words). '
            'Most ATS systems and recruiters expect at least 150–250 words. '
            'Expand your experience and skills sections.'
        )
    elif word_count > MAX_WORDS:
        length_status = 'too_long'
        length_message = (
            f'Resume is unusually long ({word_count} words). '
            'Consider condensing to 1–2 pages; most ATS systems prefer concise resumes.'
        )
    else:
        length_status = 'ok'
        length_message = f'Resume length looks good ({word_count} words).'

    # ── 4. Keyword / field check ─────────────────────────────────
    detected_field = _detect_field(resume_text)
    found_keywords: list[str] = []
    missing_keywords: list[str] = []

    if detected_field:
        taxonomy_keywords = ATS_KEYWORD_TAXONOMY[detected_field]['keywords']
        for kw in taxonomy_keywords:
            if kw in lower:
                found_keywords.append(kw)
            else:
                missing_keywords.append(kw)
        keyword_coverage_score = round(len(found_keywords) / len(taxonomy_keywords) * 100) if taxonomy_keywords else 0
    else:
        keyword_coverage_score = 0

    # ── 5. Skills coverage (reuse matcher output, don't recompute) ──
    skills_coverage = None
    if required_skills is not None:
        total = len(required_skills)
        matched_count = len(matched_skills or [])
        skills_coverage = {
            'total_required': total,
            'matched': matched_count,
            'missing': len(missing_skills or []),
            'coverage_pct': round(matched_count / total * 100) if total else 100,
        }

    return {
        'detected_field': detected_field,
        'word_count': word_count,
        'keyword_coverage_score': keyword_coverage_score,
        'found_keywords': found_keywords,
        'missing_keywords': missing_keywords,
        'contact_checks': contact_checks,
        'section_checks': section_checks,
        'length_check': {
            'status': length_status,
            'word_count': word_count,
            'message': length_message,
        },
        'skills_coverage': skills_coverage,
    }
