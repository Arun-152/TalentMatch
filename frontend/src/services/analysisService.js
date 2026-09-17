import api from './api';

const createAnalysis = async (data) => {
  // data should be { resume: "uuid", job_description: "uuid" }
  return await api.post('/analyses/', data);
};

const getAnalyses = async (page = 1) => {
  return await api.get(`/analyses/?page=${page}`);
};

const getAnalysis = async (id) => {
  return await api.get(`/analyses/${id}/`);
};

const deleteAnalysis = async (id) => {
  return await api.delete(`/analyses/${id}/`);
};

export const analysisService = {
  createAnalysis,
  getAnalyses,
  getAnalysis,
  deleteAnalysis,
};
