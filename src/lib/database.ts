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

// Bills operations
export const billQueries = {
  getAll: (type?: 'party' | 'broker', fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const queryString = params.toString();
    return apiCall(`/bills${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: string) => apiCall(`/bills/${id}`),
  getByNumber: (billNumber: string) => apiCall(`/bills/by-number/${billNumber}`),
  getItems: (id: string) => apiCall(`/bills/${id}/items`),
  create: (data: {
    bill_number: string;
    party_id: string;
    bill_date: string;
    due_date?: string;
    total_amount: number;
    notes?: string;
    bill_type?: 'party' | 'broker'; // Add bill_type field
  }) =>
    apiCall('/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    bill_number: string;
    party_id: string;
    bill_date: string;
    due_date?: string;
    total_amount: number;
    notes?: string;
    bill_type?: 'party' | 'broker'; // Add bill_type field
  }) =>
    apiCall(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/bills/${id}`, { method: 'DELETE' }),
};

// F&O Bills operations
export const foBillQueries = {
  getAll: (type?: 'party' | 'broker') =>
    type ? apiCall(`/fo/bills?type=${type}`) : apiCall('/fo/bills'),
  getById: (id: string) => apiCall(`/fo/bills/${id}`),
  getItems: (id: string) => apiCall(`/fo/bills/${id}/items`),
  create: (data: {
    bill_number: string;
    party_id?: string | null;
    bill_date: string;
    due_date?: string | null;
    total_amount: number;
    notes?: string | null;
    bill_type?: 'party' | 'broker';
  }) =>
    apiCall('/fo/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    bill_number: string;
    party_id?: string | null;
    bill_date: string;
    due_date?: string | null;
    total_amount: number;
    notes?: string | null;
    status?: string;
  }) =>
    apiCall(`/fo/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/fo/bills/${id}`, { method: 'DELETE' }),
};

// Add function to fetch outstanding bills for a party
export const getOutstandingBills = async (partyId: string) => {
  try {
    // Handle special case for main broker payments
    if (partyId === "main-broker") {
      // Return empty array for main broker as it doesn't have outstanding bills in the same way
      return [];
    }
    
    const response = await apiCall(`/bills/outstanding/${partyId}`);
    return response;
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    throw error;
  }
};

export const getOutstandingFoBills = async (partyId: string) => {
  try {
    // Handle special case for main broker payments
    if (partyId === "main-broker") {
      // Return empty array for main broker as it doesn't have outstanding bills in the same way
      return [];
    }
    
    const response = await apiCall(`/fo/bills/outstanding/${partyId}`);
    return response;
  } catch (error) {
    console.error('Error fetching F&O outstanding bills:', error);
    throw error;
  }
};

// Ledger operations
export const ledgerQueries = {
  getAll: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const queryString = params.toString();
    return apiCall(`/ledger${queryString ? `?${queryString}` : ''}`);
  },
  getByPartyId: (partyId: string, fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const queryString = params.toString();
    return apiCall(`/ledger/party/${partyId}${queryString ? `?${queryString}` : ''}`);
  },
  create: (data: {
    party_id: string;
    entry_date: string;
    particulars: string;
    debit_amount: number;
    credit_amount: number;
    balance: number;
  }) =>
    apiCall('/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    party_id: string;
    entry_date: string;
    particulars: string;
    debit_amount: number;
    credit_amount: number;
    balance: number;
  }) =>
    apiCall(`/ledger/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/ledger/${id}`, { method: 'DELETE' }),
};

// Broker Master operations
export const brokerQueries = {
  getAll: () => apiCall('/brokers'),
  getById: (id: string) => apiCall(`/brokers/${id}`),
  create: (data: {
    broker_code: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    trading_slab: number;
    delivery_slab: number;
  }) =>
    apiCall('/brokers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    broker_code: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    trading_slab: number;
    delivery_slab: number;
  }) =>
    apiCall(`/brokers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/brokers/${id}`, { method: 'DELETE' }),
};

// Contracts operations
export const contractQueries = {
  getAll: () => apiCall('/contracts'),
  getById: (id: string) => apiCall(`/contracts/${id}`),
  create: (data: {
    contract_number: string;
    party_id: string;
    settlement_id: string;
    contract_date: string;
    quantity: number;
    rate: number;
    amount: number;
    contract_type: 'buy' | 'sell';
    status: 'active' | 'completed' | 'cancelled';
    notes?: string;
  }) =>
    apiCall('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: {
    contract_number: string;
    party_id: string;
    settlement_id: string;
    contract_date: string;
    quantity: number;
    rate: number;
    amount: number;
    contract_type: 'buy' | 'sell';
    status: 'active' | 'completed' | 'cancelled';
    notes?: string;
  }) =>
    apiCall(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall(`/contracts/${id}`, { method: 'DELETE' }),
};

// Cash transaction operations
export const cashTransactionQueries = {
  delete: (id: string) => apiCall(`/cash/${id}`, { method: 'DELETE' }),
};
