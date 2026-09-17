import api from './api';

const createJobDescription = async (data) => {
  return await api.post('/jobs/', data);
};

export const jobService = {
  createJobDescription,
};
