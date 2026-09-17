from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from resumes.models import Resume
from jobs.models import JobDescription
from analyses.models import Analysis


class TalentMatchAPITests(APITestCase):
    def setUp(self):
        self.resume_url = reverse('resume-create')
        self.job_url = reverse('job-create')
        # NOTE: 'analysis-list' URL still exists for POST (CreateModelMixin),
        # but GET on that URL returns 405 now that ListModelMixin is removed.
        self.analysis_list_url = reverse('analysis-list')

    def test_create_resume_success(self):
        data = {'raw_text': 'I know Python and React.'}
        response = self.client.post(self.resume_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Resume.objects.count(), 1)

    def test_create_resume_fail_empty(self):
        response = self.client.post(self.resume_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_job_success(self):
        data = {'title': 'Backend Dev', 'raw_text': 'Need Python.'}
        response = self.client.post(self.job_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobDescription.objects.count(), 1)

    def test_create_job_fail_empty(self):
        data = {'title': 'Backend Dev'}
        response = self.client.post(self.job_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_analysis_create_and_retrieve(self):
        # Create dependencies
        resume = Resume.objects.create(raw_text='Python React SQL')
        job = JobDescription.objects.create(title='Dev', raw_text='Python')

        # POST — should succeed and return 201
        data = {'resume': str(resume.id), 'job_description': str(job.id)}
        response = self.client.post(self.analysis_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        analysis_id = response.data['id']

        # ats_report should be populated
        self.assertIn('ats_report', response.data)
        self.assertIsNotNone(response.data['ats_report'])

        # POST fail (invalid resume ID)
        bad_data = {
            'resume': '00000000-0000-0000-0000-000000000000',
            'job_description': str(job.id),
        }
        bad_response = self.client.post(self.analysis_list_url, bad_data, format='json')
        self.assertEqual(bad_response.status_code, status.HTTP_400_BAD_REQUEST)

        # GET list is REMOVED — expect 405 Method Not Allowed
        list_response = self.client.get(self.analysis_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # GET detail should still work
        detail_url = reverse('analysis-detail', args=[analysis_id])
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        # DELETE should work
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Analysis.objects.count(), 0)
