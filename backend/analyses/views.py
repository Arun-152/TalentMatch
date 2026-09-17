from rest_framework import viewsets, mixins
from .models import Analysis
from .serializers import AnalysisSerializer

class AnalysisViewSet(mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    """
    API endpoints for creating and managing match analyses between a resume and a job description.
    """
    queryset = Analysis.objects.select_related(
        'resume', 
        'job_description'
    ).prefetch_related(
        'matched_skills', 
        'missing_skills'
    ).order_by('-created_at')
    
    serializer_class = AnalysisSerializer
