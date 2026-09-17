import uuid
from django.db import models
from core.models import Skill

class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='resumes/', null=True, blank=True)
    raw_text = models.TextField(blank=True)
    candidate_name = models.CharField(max_length=255, null=True, blank=True)
    parsed_skills = models.ManyToManyField(Skill, blank=True, related_name='resumes')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.candidate_name or f"Resume {self.id}"
