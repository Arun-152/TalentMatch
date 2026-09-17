from rest_framework import serializers
from .models import Resume
from core.models import Skill
from core.services.parsing import FileExtractor, SkillExtractor
import os

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ResumeSerializer(serializers.ModelSerializer):
    parsed_skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = Resume
        fields = ['id', 'file', 'raw_text', 'candidate_name', 'parsed_skills', 'uploaded_at']
        read_only_fields = ['id', 'parsed_skills', 'uploaded_at']

    def validate(self, attrs):
        file_obj = attrs.get('file')
        raw_text = attrs.get('raw_text', '').strip()

        if not file_obj and not raw_text:
            raise serializers.ValidationError("Either a file or raw text must be provided.")

        if file_obj:
            # Check file extension
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ['.pdf', '.docx', '.txt']:
                raise serializers.ValidationError({"file": "Unsupported file format. Please upload PDF, DOCX, or TXT."})
            
            # Check file size (e.g., limit to 5MB)
            max_size = 5 * 1024 * 1024
            if file_obj.size > max_size:
                raise serializers.ValidationError({"file": "File is too large. Maximum size is 5MB."})

        return attrs

    def create(self, validated_data):
        file_obj = validated_data.get('file')
        raw_text = validated_data.get('raw_text', '')

        if file_obj:
            # Extract text from file
            try:
                extracted_text = FileExtractor.extract_text(file_obj, file_obj.name)
                # Combine extracted text with any provided raw text
                raw_text = f"{extracted_text}\n{raw_text}".strip()
                validated_data['raw_text'] = raw_text
            except Exception as e:
                raise serializers.ValidationError({"file": f"Failed to extract text: {str(e)}"})
        
        # Save resume first to get an ID
        resume = super().create(validated_data)

        # Extract and link skills using the deduplicated helper
        skill_objs = FileExtractor.extract_and_link_skills(resume.raw_text)
        
        resume.parsed_skills.set(skill_objs)
        return resume
