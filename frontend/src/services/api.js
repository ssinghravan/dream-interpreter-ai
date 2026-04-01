import axios from 'axios';

const api = axios.create({
  baseURL: 'https://dream-interpreter-dclp.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const analyzeDream = async (dreamText) => {
  const res = await api.post('/analyzeDream', { dream: dreamText });
  return res.data;
};

export const saveDream = async (dreamData) => {
  const res = await api.post('/saveDream', dreamData);
  return res.data;
};

export const getDreams = async () => {
  const res = await api.get('/getDreams');
  return res.data;
};

// { Anxiety: 5, Curiosity: 3, ... }
export const getMoodStats = async () => {
  const res = await api.get('/moodStats');
  return res.data;
};

// { insight, dominantMood, dreamCount, topSymbols }
export const getInsights = async () => {
  const res = await api.get('/insights');
  return res.data;
};

export default api;
