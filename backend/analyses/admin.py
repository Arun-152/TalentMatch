from django.contrib import admin
from .models import Analysis

@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ('resume', 'job_description', 'compatibility_score', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('resume__candidate_name', 'job_description__title')
    filter_horizontal = ('matched_skills', 'missing_skills')
