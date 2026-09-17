import uuid
from django.db import models
from core.models import Skill

class JobDescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    raw_text = models.TextField()
    required_skills = models.ManyToManyField(Skill, blank=True, related_name='job_descriptions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
