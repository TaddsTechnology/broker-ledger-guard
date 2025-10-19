// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Generic API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

// Test API connection
export const testConnection = async () => {
  try {
    const result = await apiCall('/health');
    console.log('API connected successfully:', result);
    return true;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
};

// Company Master operations
export const companyQueries = {
  getAll: () => apiCall('/companies'),
  getById: (id: string) => apiCall(`/companies/${id}`),
  create: (data: { company_code: string; name: string; nse_code?: string }) =>
    apiCall('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { company_code: string; name: string; nse_code?: string }) =>
    apiCall(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/companies/${id}`, { method: 'DELETE' }),
};

// Party Master operations
export const partyQueries = {
  getAll: () => apiCall('/parties'),
  getById: (id: string) => apiCall(`/parties/${id}`),
  create: (data: {
    party_code: string;
    name: string;
    nse_code?: string;
    ref_code?: string;
    address?: string;
    city?: string;
    phone?: string;
    trading_slab: number;
    delivery_slab: number;
  }) =>
    apiCall('/parties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    party_code: string;
    name: string;
    nse_code?: string;
    ref_code?: string;
    address?: string;
    city?: string;
    phone?: string;
    trading_slab: number;
    delivery_slab: number;
  }) =>
    apiCall(`/parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/parties/${id}`, { method: 'DELETE' }),
};

// Settlement Master operations
export const settlementQueries = {
  getAll: () => apiCall('/settlements'),
  getById: (id: string) => apiCall(`/settlements/${id}`),
  create: (data: {
    type: string;
    settlement_number: string;
    start_date: string;
    end_date: string;
    contract_no?: string;
    notes?: string;
  }) =>
    apiCall('/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    type: string;
    settlement_number: string;
    start_date: string;
    end_date: string;
    contract_no?: string;
    notes?: string;
  }) =>
    apiCall(`/settlements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/settlements/${id}`, { method: 'DELETE' }),
};
