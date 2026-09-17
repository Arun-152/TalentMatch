from rest_framework import generics
from .models import JobDescription
from .serializers import JobDescriptionSerializer

class JobDescriptionCreateView(generics.CreateAPIView):
    """
    Create a job description and automatically extract required skills.
    """
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
