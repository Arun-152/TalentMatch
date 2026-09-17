from rest_framework import viewsets, mixins
from .models import Analysis
from .serializers import AnalysisSerializer


class AnalysisViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    # ListModelMixin intentionally removed — history listing is deprecated.
    # Analyses are created and immediately redirected to /analyses/{id}/.
    # Exposing a listing endpoint would allow any user to enumerate other
    # users' resume data, which is a privacy risk for a candidate-facing tool.
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    POST /api/analyses/    — Run a new resume × job-description match.
    GET  /api/analyses/id/ — Retrieve a single completed analysis by ID.
    DELETE /api/analyses/id/ — Remove a completed analysis.

    The GET list endpoint is intentionally absent.
    """
    queryset = Analysis.objects.select_related(
        'resume',
        'job_description',
    ).prefetch_related(
        'matched_skills',
        'missing_skills',
    ).order_by('-created_at')

    serializer_class = AnalysisSerializer
