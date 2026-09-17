"""
Matching Service Layer

DESIGN DECISION:
Why does the matching algorithm live here instead of on the Analysis model or in a ViewSet?
1. Separation of Concerns: The `Analysis` model is just a data container (Active Record pattern). 
   By moving the complex matching/scoring logic into a stateless service, we prevent the models 
   from becoming "fat" and difficult to maintain.
2. Reusability: This static method can be called from anywhere (management commands, async 
   Celery tasks, or API views) without needing an HTTP context or pre-existing database record.
"""
from typing import Set, List, Dict, Any, Union

class MatchService:
    """
    Service responsible for computing compatibility scores between a resume
    and a job description based on extracted skills.
    """

    @staticmethod
    def compute_match(resume_skills: Union[Set[str], List[str]], job_skills: Union[Set[str], List[str]]) -> Dict[str, Any]:
        """
        Computes the compatibility score between a candidate's skills and a job's requirements.

        Scoring Formula (v1):
        - Score = (Number of matched skills / Number of required skills) * 100
        - If the job has no required skills, the score defaults to 100.0 (all requirements met).
        
        Future Extension:
        To support "must-have" vs "nice-to-have" weighting without a rewrite, 
        this function can be extended to accept `job_skills` as a dictionary 
        mapping skill names to weights (e.g., {"Python": 2.0, "React": 1.0}).

        Args:
            resume_skills (Set[str] | List[str]): A collection of normalized skill names extracted from the resume.
            job_skills (Set[str] | List[str]): A collection of normalized skill names required by the job.

        Returns:
            dict: A dictionary containing:
                - matched_skills (list): Skills present in both sets.
                - missing_skills (list): Skills required by the job but missing from the resume.
                - compatibility_score (float): A percentage score from 0.0 to 100.0.
        """
        # Ensure inputs are sets for efficient deduplication and intersection logic
        resume_set = set(resume_skills)
        job_set = set(job_skills)

        # Base case: no specific requirements
        if not job_set:
            return {
                "matched_skills": [],
                "missing_skills": [],
                "compatibility_score": 100.0
            }

        matched_skills = job_set.intersection(resume_set)
        missing_skills = job_set.difference(resume_set)

        # Simple unweighted calculation for v1
        score = (len(matched_skills) / len(job_set)) * 100.0

        return {
            "matched_skills": sorted(list(matched_skills)),
            "missing_skills": sorted(list(missing_skills)),
            "compatibility_score": round(score, 2)
        }
