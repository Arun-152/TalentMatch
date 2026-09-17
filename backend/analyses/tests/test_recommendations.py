from django.test import TestCase
from analyses.services.recommendations import generate_improvement_plan

class RecommendationTests(TestCase):
    def test_perfect_match(self):
        result = generate_improvement_plan(["Python", "React"], [], 100.0)
        self.assertEqual(len(result['plan']), 0)
        self.assertIn("100% match", result['summary'])
        
    def test_partial_match_tier_high(self):
        result = generate_improvement_plan(["Python"], ["AWS"], 90.0)
        self.assertEqual(len(result['plan']), 1)
        self.assertIn("very strong match at 90%", result['summary'])
        self.assertEqual(result['plan'][0]['skill'], "AWS")
        
    def test_partial_match_tier_mid(self):
        result = generate_improvement_plan([], ["Python", "AWS", "Docker"], 60.0)
        self.assertEqual(len(result['plan']), 3)
        self.assertIn("solid foundation (60%)", result['summary'])
        self.assertIn("Python, AWS and others", result['summary'])
        
    def test_unknown_skill_fallback(self):
        result = generate_improvement_plan([], ["UnknownSkill"], 0.0)
        self.assertEqual(len(result['plan']), 1)
        self.assertEqual(result['plan'][0]['why_it_matters'], "This skill was specifically highlighted in the job description as a requirement.")
