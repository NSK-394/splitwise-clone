import api from './axios';

export const addExpense = (groupId, data) => api.post(`/groups/${groupId}/expenses`, data);
export const getExpenses = (groupId) => api.get(`/groups/${groupId}/expenses`);
export const getBalances = (groupId) => api.get(`/groups/${groupId}/balances`);
export const getSimplifiedDebts = (groupId) => api.get(`/groups/${groupId}/simplified-debts`);
