from django.contrib import admin
from .models import Resume

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'uploaded_at', 'id')
    search_fields = ('candidate_name', 'raw_text')
    list_filter = ('uploaded_at',)
    filter_horizontal = ('parsed_skills',)
