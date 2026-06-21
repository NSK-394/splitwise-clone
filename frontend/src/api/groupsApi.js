import api from './axios';

export const createGroup = (data) => api.post('/groups', data);
export const getGroups = () => api.get('/groups');
export const getGroup = (id) => api.get(`/groups/${id}`);
export const addMember = (id, data) => api.post(`/groups/${id}/members`, data);
