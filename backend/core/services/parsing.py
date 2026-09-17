"""
Parsing Service Layer

DESIGN DECISION: 
Why is this code isolated here instead of inside serializers or views?
1. Single Responsibility Principle (SRP): Views handle HTTP, serializers handle 
   validation/serialization, and this service handles business logic (text extraction).
2. Testability: We can unit test the regex and file extraction logic completely 
   independent of the Django request/response cycle or database.
3. Extensibility: By wrapping skill extraction in a dedicated class, we can easily 
   swap the hardcoded dictionary implementation for an NLP/Embeddings model later 
   without breaking the API layer.
"""
import re
import io
import pdfplumber
import docx
from typing import List, Set

SKILL_TAXONOMY = {
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "python": "Python",
    "django": "Django",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "sql": "SQL",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "aws": "AWS",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "html": "HTML",
    "css": "CSS",
    "git": "Git",
    "typescript": "TypeScript",
    "ts": "TypeScript",
}

class SkillExtractor:
    def __init__(self, taxonomy=SKILL_TAXONOMY):
        self.taxonomy = taxonomy
        sorted_keys = sorted(self.taxonomy.keys(), key=len, reverse=True)
        escaped_keys = [re.escape(k) for k in sorted_keys]
        
        # Word boundary that supports special characters like C++ and C#
        pattern = r"(?<![a-zA-Z0-9_])(" + "|".join(escaped_keys) + r")(?![a-zA-Z0-9_])"
        self.regex = re.compile(pattern, flags=re.IGNORECASE)
        
    def extract_skills(self, text: str) -> List[str]:
        if not text:
            return []
            
        found_skills = set()
        matches = self.regex.findall(text)
        
        for match in matches:
            key = match.lower()
            if key in self.taxonomy:
                found_skills.add(self.taxonomy[key])
                
        return sorted(list(found_skills))

class FileExtractor:
    @staticmethod
    def extract_text(file_obj, filename: str) -> str:
        ext = filename.lower().split('.')[-1]
        
        if ext == 'pdf':
            return FileExtractor._extract_from_pdf(file_obj)
        elif ext == 'docx':
            return FileExtractor._extract_from_docx(file_obj)
        elif ext == 'txt':
            return file_obj.read().decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
    @staticmethod
    def _extract_from_pdf(file_obj) -> str:
        text = []
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return "\n".join(text)

    @staticmethod
    def _extract_from_docx(file_obj) -> str:
        doc = docx.Document(file_obj)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    @staticmethod
    def extract_and_link_skills(text: str) -> list:
        from core.models import Skill
        extractor = SkillExtractor()
        skill_names = extractor.extract_skills(text)
        skill_objs = []
        for name in skill_names:
            obj, _ = Skill.objects.get_or_create(name=name)
            skill_objs.append(obj)
        return skill_objs

