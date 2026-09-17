from django.test import TestCase
from analyses.services.matcher import MatchService

class MatchServiceTests(TestCase):
    def test_perfect_match(self):
        resume = {"Python", "React", "Docker"}
        job = {"Python", "React"}
        
        result = MatchService.compute_match(resume, job)
        self.assertEqual(result["compatibility_score"], 100.0)
        self.assertCountEqual(result["matched_skills"], ["Python", "React"])
        self.assertCountEqual(result["missing_skills"], [])

    def test_zero_overlap(self):
        resume = {"Java", "Spring"}
        job = {"Python", "Django"}
        
        result = MatchService.compute_match(resume, job)
        self.assertEqual(result["compatibility_score"], 0.0)
        self.assertCountEqual(result["matched_skills"], [])
        self.assertCountEqual(result["missing_skills"], ["Python", "Django"])

    def test_partial_overlap(self):
        resume = {"Python", "SQL"}
        job = {"Python", "Docker", "AWS", "SQL"}
        
        result = MatchService.compute_match(resume, job)
        self.assertEqual(result["compatibility_score"], 50.0)  # 2 / 4 * 100
        self.assertCountEqual(result["matched_skills"], ["Python", "SQL"])
        self.assertCountEqual(result["missing_skills"], ["Docker", "AWS"])

    def test_duplicate_skills(self):
        # Even if inputs are lists with duplicates, the sets should normalize them
        resume = ["Python", "Python", "React"]
        job = ["React", "React", "Docker"]
        
        result = MatchService.compute_match(resume, job)
        self.assertEqual(result["compatibility_score"], 50.0) # 1 (React) / 2 (React, Docker) * 100
        self.assertCountEqual(result["matched_skills"], ["React"])
        self.assertCountEqual(result["missing_skills"], ["Docker"])
        
    def test_no_job_skills(self):
        resume = {"Python"}
        job = set()
        
        result = MatchService.compute_match(resume, job)
        self.assertEqual(result["compatibility_score"], 100.0)
