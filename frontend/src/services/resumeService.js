import api from './api';

const uploadResume = async (formData) => {
  // formData because we may send files
  // Ensure we override Content-Type so the browser sets the correct multipart boundary
  return await api.post('/resumes/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const resumeService = {
  uploadResume,
};
