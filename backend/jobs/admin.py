from django.contrib import admin
from .models import JobDescription

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'id')
    search_fields = ('title', 'raw_text')
    list_filter = ('created_at',)
    filter_horizontal = ('required_skills',)
