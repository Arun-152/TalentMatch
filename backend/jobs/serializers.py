from rest_framework import serializers
from .models import JobDescription
from core.models import Skill
from resumes.serializers import SkillSerializer
from core.services.parsing import FileExtractor

class JobDescriptionSerializer(serializers.ModelSerializer):
    required_skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'raw_text', 'required_skills', 'created_at']
        read_only_fields = ['id', 'required_skills', 'created_at']

    def validate(self, attrs):
        raw_text = attrs.get('raw_text', '').strip()
        if not raw_text:
            raise serializers.ValidationError({"raw_text": "Job description text is required."})
        return attrs

    def create(self, validated_data):
        job = super().create(validated_data)

        # Extract and link skills using the deduplicated helper
        skill_objs = FileExtractor.extract_and_link_skills(job.raw_text)
        
        job.required_skills.set(skill_objs)
        return job
