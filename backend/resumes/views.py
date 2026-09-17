from rest_framework import generics
from .models import Resume
from .serializers import ResumeSerializer

class ResumeCreateView(generics.CreateAPIView):
    """
    Upload a resume file (PDF/DOCX/TXT) or provide raw text to extract and store skills.
    """
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
