from rest_framework import serializers
from .models import Analysis
from core.models import Skill
from resumes.models import Resume
from jobs.models import JobDescription
from resumes.serializers import SkillSerializer
from analyses.services.matcher import MatchService


class AnalysisSerializer(serializers.ModelSerializer):
    matched_skills = SkillSerializer(many=True, read_only=True)
    missing_skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Analysis
        fields = [
            'id', 'resume', 'job_description',
            'matched_skills', 'missing_skills',
            'compatibility_score', 'llm_explanation',
            'ats_report', 'status', 'created_at',
        ]
        read_only_fields = [
            'id', 'matched_skills', 'missing_skills',
            'compatibility_score', 'llm_explanation',
            'ats_report', 'status', 'created_at',
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Decorate with human-readable identifiers for the result page header
        ret['candidate_name'] = (
            instance.resume.candidate_name
            or (instance.resume.file.name if instance.resume.file else 'Raw Text Upload')
        )
        ret['job_title'] = instance.job_description.title

        # Inject improvement plan dynamically (rule-based, no DB storage needed)
        from analyses.services.recommendations import generate_improvement_plan
        matched_names = [s['name'] for s in ret['matched_skills']]
        missing_names = [s['name'] for s in ret['missing_skills']]
        recommendations = generate_improvement_plan(matched_names, missing_names, ret['compatibility_score'])
        ret['improvement_summary'] = recommendations['summary']
        ret['improvement_plan'] = recommendations['plan']

        return ret

    def create(self, validated_data):
        from django.conf import settings
        from analyses.services.embedding_matcher import EmbeddingMatchService
        from resumes.services.ats_checker import run_ats_check

        resume = validated_data['resume']
        job    = validated_data['job_description']

        resume_skills_names = list(resume.parsed_skills.values_list('name', flat=True))
        job_skills_names    = list(job.required_skills.values_list('name', flat=True))

        # ── Skill matching ───────────────────────────────────────────
        if getattr(settings, 'USE_RAG_MATCHING', False):
            match_result   = EmbeddingMatchService.compute_match(
                resume_text=resume.raw_text,
                resume_skills=resume_skills_names,
                job_text=job.raw_text,
                job_skills=job_skills_names,
            )
            llm_explanation = match_result.get('llm_explanation')
        else:
            match_result    = MatchService.compute_match(
                resume_skills=resume_skills_names,
                job_skills=job_skills_names,
            )
            llm_explanation = None

        # ── ATS check (runs after matching so we can reuse results) ──
        ats_report = run_ats_check(
            resume_text=resume.raw_text,
            required_skills=job_skills_names or None,
            matched_skills=match_result.get('matched_skills', []),
            missing_skills=match_result.get('missing_skills', []),
        )

        # ── Persist ──────────────────────────────────────────────────
        analysis = Analysis.objects.create(
            resume=resume,
            job_description=job,
            compatibility_score=match_result['compatibility_score'],
            llm_explanation=llm_explanation,
            ats_report=ats_report,
            status='completed',
        )

        matched_objs = Skill.objects.filter(name__in=match_result['matched_skills'])
        missing_objs = Skill.objects.filter(name__in=match_result['missing_skills'])
        analysis.matched_skills.set(matched_objs)
        analysis.missing_skills.set(missing_objs)

        return analysis
