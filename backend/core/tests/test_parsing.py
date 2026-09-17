from django.test import TestCase
from core.services.parsing import SkillExtractor

class SkillExtractorTests(TestCase):
    def setUp(self):
        self.extractor = SkillExtractor()
        
    def test_empty_text(self):
        self.assertEqual(self.extractor.extract_skills(""), [])
        self.assertEqual(self.extractor.extract_skills(None), [])
        
    def test_no_recognizable_skills(self):
        text = "I am a very hard worker and a team player. I communicate well."
        self.assertEqual(self.extractor.extract_skills(text), [])
        
    def test_casing_and_formatting(self):
        text = "I have experience with ReactJS, react.js, and REACT. Also Node, nodejs."
        skills = self.extractor.extract_skills(text)
        self.assertIn("React", skills)
        self.assertIn("Node.js", skills)
        
    def test_special_characters(self):
        text = "I code in C++ and C# primarily."
        skills = self.extractor.extract_skills(text)
        self.assertIn("C++", skills)
        self.assertIn("C#", skills)
        
    def test_word_boundaries(self):
        text = "I am reacting to a situation. Also I know javascript."
        skills = self.extractor.extract_skills(text)
        self.assertNotIn("React", skills)
        self.assertIn("JavaScript", skills)
