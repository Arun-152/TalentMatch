import uuid
from django.db import models
from resumes.models import Resume
from jobs.models import JobDescription

class MatchAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="matches")
    job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name="matches")
    match_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match: {self.resume} <-> {self.job_description} ({self.match_score}%)"
