import uuid
from django.db import models
from resumes.models import Resume
from jobs.models import JobDescription
from core.models import Skill

class Analysis(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='analyses')
    job_description = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name='analyses')

    matched_skills = models.ManyToManyField(Skill, blank=True, related_name='matched_in_analyses')
    missing_skills = models.ManyToManyField('core.Skill', related_name='missing_in_analyses', blank=True)
    compatibility_score = models.FloatField(default=0.0)
    llm_explanation = models.TextField(null=True, blank=True, help_text="RAG-generated explanation of the match.")
    # Structured ATS quality report for the uploaded resume document
    ats_report = models.JSONField(null=True, blank=True, help_text="ATS document-quality check results.")
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis: {self.resume} vs {self.job_description} ({self.status})"

