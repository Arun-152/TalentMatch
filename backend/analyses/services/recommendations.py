from typing import List, Dict, Any

# Curated dictionary for common skills
SKILL_TIPS = {
    "AWS": {
        "why_it_matters": "AWS is commonly required for deployment and cloud infra roles — even basic EC2/S3 familiarity helps.",
        "action": "Complete a beginner AWS course and add 1-2 small cloud-deployed projects to your resume."
    },
    "Docker": {
        "why_it_matters": "Containerization is standard for modern deployments to ensure consistent environments.",
        "action": "Learn to write a Dockerfile for a basic web app and run it locally."
    },
    "React": {
        "why_it_matters": "React is the dominant frontend library for building interactive user interfaces.",
        "action": "Build a small single-page application handling state with hooks and routing."
    },
    "Python": {
        "why_it_matters": "Python is heavily used for backend logic, data processing, and AI integration.",
        "action": "Build a simple REST API using Django or FastAPI."
    },
    "SQL": {
        "why_it_matters": "Relational databases are the backbone of most applications.",
        "action": "Practice writing JOINs and aggregations on a sample dataset."
    }
}

GENERIC_TIP = {
    "why_it_matters": "This skill was specifically highlighted in the job description as a requirement.",
    "action": "Familiarize yourself with its core concepts and build a small proof-of-concept."
}

def generate_improvement_plan(matched_skills: List[str], missing_skills: List[str], score: float) -> Dict[str, Any]:
    if not missing_skills:
        return {
            "summary": "Congratulations! You're a 100% match for the extracted requirements.",
            "plan": []
        }
        
    plan = []
    for skill in missing_skills:
        tip = SKILL_TIPS.get(skill, GENERIC_TIP)
        plan.append({
            "skill": skill,
            "why_it_matters": tip["why_it_matters"],
            "action": tip["action"]
        })
        
    # Generate tiered summary
    score = round(score)
    missing_count = len(missing_skills)
    skill_names = ", ".join(missing_skills[:2])
    if missing_count > 2:
        skill_names += " and others"
        
    if score >= 90:
        summary = f"You're a very strong match at {score}%. Closing the gap on {skill_names} would make you a perfect candidate."
    elif score >= 70:
        summary = f"You're a strong match at {score}%. Gaining experience with {skill_names} is your best next step."
    elif score >= 50:
        summary = f"You have a solid foundation ({score}%). Focus on acquiring {skill_names} to become more competitive."
    else:
        summary = f"At {score}%, there is a significant gap. Prioritize learning {skill_names} to meet the baseline requirements."
        
    return {
        "summary": summary,
        "plan": plan
    }
