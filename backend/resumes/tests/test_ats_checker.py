"""
Unit tests for resumes/services/ats_checker.py

Three canonical scenarios:
  1. Well-formed resume — all contact info + all sections present.
  2. Resume missing contact info (no email, phone, LinkedIn).
  3. Resume missing standard sections (no Experience, Skills headings).
"""
from django.test import TestCase
from resumes.services.ats_checker import run_ats_check


# ── Fixture text builders ──────────────────────────────────────────

WELL_FORMED_RESUME = """
Jane Doe
jane.doe@example.com | +1-555-867-5309 | linkedin.com/in/janedoe | github.com/janedoe

Summary
Results-driven software engineer with 4 years of experience building scalable web
applications using Python, React, and SQL. Passionate about clean code, test-driven
development, and delivering reliable APIs. Strong communicator who thrives in agile
cross-functional teams.

Experience
Senior Software Engineer — Acme Corp (2021–present)
- Designed and built REST APIs in Django that serve 50,000 requests per day.
- Containerized the application stack using Docker and deployed to AWS via a
  CI/CD pipeline built in GitHub Actions.
- Led a migration from a monolithic codebase to microservices, reducing average
  API response time by 40%.
- Mentored two junior engineers on code review best practices and Git workflows.

Software Engineer — BetaStart Inc (2019–2021)
- Developed React-based dashboards consuming internal REST APIs.
- Wrote unit and integration tests using pytest, maintaining 90%+ coverage.
- Collaborated with product and design to implement accessible, responsive UIs.

Education
B.Sc. Computer Science, State University, 2019.
Graduated with honours. Relevant coursework: Data Structures, Algorithms,
Distributed Systems, Database Systems.

Skills
Python, React, SQL, Docker, TypeScript, Git, Linux, Agile, REST, CI/CD,
PostgreSQL, AWS, Jest, pytest
"""

MISSING_CONTACT_RESUME = """
John Smith

Summary
A backend developer experienced in Python and Django REST Framework.

Experience
Software Developer — Tech Inc (2020–2023)
- Developed REST APIs and maintained SQL databases.

Education
B.Sc. Software Engineering, 2018.

Skills
Python, Django, SQL, Git, Docker
"""

MISSING_SECTIONS_RESUME = """
Jane Roe
jane.roe@example.com | 555-111-2222 | linkedin.com/in/janeroe

I am a developer who knows Python, React, SQL, Docker, TypeScript.
I worked at Acme from 2020 to 2024 building web apps.
I studied Computer Science and graduated in 2018.
"""


class ATSCheckerWellFormedTest(TestCase):
    """A complete resume should pass all contact and section checks."""

    def setUp(self):
        self.result = run_ats_check(resume_text=WELL_FORMED_RESUME)

    def test_email_detected(self):
        self.assertTrue(self.result['contact_checks']['email']['present'])

    def test_phone_detected(self):
        self.assertTrue(self.result['contact_checks']['phone']['present'])

    def test_linkedin_detected(self):
        self.assertTrue(self.result['contact_checks']['linkedin']['present'])

    def test_experience_section_detected(self):
        self.assertTrue(self.result['section_checks']['experience']['present'])

    def test_education_section_detected(self):
        self.assertTrue(self.result['section_checks']['education']['present'])

    def test_skills_section_detected(self):
        self.assertTrue(self.result['section_checks']['skills']['present'])

    def test_summary_section_detected(self):
        self.assertTrue(self.result['section_checks']['summary']['present'])

    def test_length_is_ok(self):
        self.assertEqual(self.result['length_check']['status'], 'ok')

    def test_keyword_coverage_score_is_nonzero(self):
        # Well-formed SE resume should score above 0
        self.assertGreater(self.result['keyword_coverage_score'], 0)

    def test_detected_field_is_software_engineering(self):
        self.assertEqual(self.result['detected_field'], 'software_engineering')


class ATSCheckerMissingContactTest(TestCase):
    """A resume without contact info should fail those specific checks."""

    def setUp(self):
        self.result = run_ats_check(resume_text=MISSING_CONTACT_RESUME)

    def test_no_email_detected(self):
        self.assertFalse(self.result['contact_checks']['email']['present'])

    def test_no_phone_detected(self):
        self.assertFalse(self.result['contact_checks']['phone']['present'])

    def test_no_linkedin_detected(self):
        self.assertFalse(self.result['contact_checks']['linkedin']['present'])

    def test_failure_message_contains_guidance(self):
        # Each missing item's message should be actionable
        phone_msg = self.result['contact_checks']['phone']['message']
        self.assertIn('phone', phone_msg.lower())

    def test_sections_still_pass(self):
        # Contact missing but sections are fine
        self.assertTrue(self.result['section_checks']['experience']['present'])
        self.assertTrue(self.result['section_checks']['skills']['present'])


class ATSCheckerMissingSectionsTest(TestCase):
    """A resume without standard section headers fails those section checks."""

    def setUp(self):
        self.result = run_ats_check(resume_text=MISSING_SECTIONS_RESUME)

    def test_contact_still_passes(self):
        self.assertTrue(self.result['contact_checks']['email']['present'])
        self.assertTrue(self.result['contact_checks']['phone']['present'])

    def test_no_experience_section(self):
        self.assertFalse(self.result['section_checks']['experience']['present'])

    def test_no_skills_section(self):
        self.assertFalse(self.result['section_checks']['skills']['present'])

    def test_failure_message_is_actionable(self):
        exp_msg = self.result['section_checks']['experience']['message']
        self.assertIn('Experience', exp_msg)

    def test_length_is_ok(self):
        # Short narrative resume — should still register as ok length
        self.assertIn(self.result['length_check']['status'], ('ok', 'too_short'))


class ATSCheckerSkillsCoverageTest(TestCase):
    """When required_skills + matched/missing are passed, skills_coverage is populated."""

    def test_skills_coverage_populated(self):
        result = run_ats_check(
            resume_text=WELL_FORMED_RESUME,
            required_skills=['Python', 'React', 'AWS'],
            matched_skills=['Python', 'React'],
            missing_skills=['AWS'],
        )
        sc = result['skills_coverage']
        self.assertIsNotNone(sc)
        self.assertEqual(sc['total_required'], 3)
        self.assertEqual(sc['matched'], 2)
        self.assertEqual(sc['missing'], 1)
        self.assertAlmostEqual(sc['coverage_pct'], 67)

    def test_skills_coverage_none_when_not_supplied(self):
        result = run_ats_check(resume_text=WELL_FORMED_RESUME)
        self.assertIsNone(result['skills_coverage'])
