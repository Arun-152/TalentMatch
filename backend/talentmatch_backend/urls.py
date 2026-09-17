from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from resumes.views import ResumeCreateView
from jobs.views import JobDescriptionCreateView
from analyses.views import AnalysisViewSet

router = DefaultRouter()
router.register(r'analyses', AnalysisViewSet, basename='analysis')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoints
    path('api/resumes/', ResumeCreateView.as_view(), name='resume-create'),
    path('api/jobs/', JobDescriptionCreateView.as_view(), name='job-create'),
    path('api/', include(router.urls)),
    
    # Auth & Docs
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
