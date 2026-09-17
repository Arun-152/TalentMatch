import api from './api';

/**
 * Create a new analysis (resume × job description match + ATS check).
 * data: { resume: "uuid", job_description: "uuid" }
 */
const createAnalysis = async (data) => {
  return await api.post('/analyses/', data);
};

/**
 * Retrieve a single completed analysis by ID.
 * The list endpoint has been intentionally removed (privacy — see views.py).
 */
const getAnalysis = async (id) => {
  return await api.get(`/analyses/${id}/`);
};

/**
 * Delete an analysis by ID.
 */
const deleteAnalysis = async (id) => {
  return await api.delete(`/analyses/${id}/`);
};

export const analysisService = {
  createAnalysis,
  getAnalysis,
  deleteAnalysis,
};
