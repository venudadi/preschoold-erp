import axios from 'axios';
import { useMemo } from 'react';

// Create an instance of axios with a base URL
const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const api = axios.create({
    baseURL: apiBase,
});

// Custom hook for using the API instance
export const useApi = () => {
    return useMemo(() => api, []);
};

// Request interceptor to add authorization and security headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const sessionToken = localStorage.getItem('sessionToken');
        const csrfToken = localStorage.getItem('csrfToken');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (sessionToken) {
            config.headers['X-Session-Token'] = sessionToken;
        }

        // Add CSRF token for non-GET requests
        if (config.method !== 'get' && csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
                    refreshToken
                });

                const { token, sessionToken, csrfToken } = response.data;

                // Update stored tokens
                localStorage.setItem('token', token);
                localStorage.setItem('sessionToken', sessionToken);
                localStorage.setItem('csrfToken', csrfToken);

                // Retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                originalRequest.headers['X-Session-Token'] = sessionToken;
                if (originalRequest.method !== 'get') {
                    originalRequest.headers['X-CSRF-Token'] = csrfToken;
                }

                return axios(originalRequest);
            } catch (error) {
                // If refresh fails, log out the user
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);


// --- AUTH FUNCTIONS ---

export const loginUser = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        if (error.response) { throw error.response.data; }
        else if (error.request) { throw new Error('Could not connect to the server. Please try again later.'); }
        else { throw new Error('An unexpected error occurred.'); }
    }
};


// --- ADMIN CHILD FUNCTIONS ---

export const getChildren = async () => {
    try {
        const response = await api.get('/admin/children');
        return response.data;
    } catch (error) {
        if (error.response) { throw error.response.data; }
        else if (error.request) { throw new Error('Could not connect to the server.'); }
        else { throw new Error('An unexpected error occurred.'); }
    }
};


// --- ENQUIRY FUNCTIONS ---

// UPDATED: Fetches all enquiries, now with optional filters
export const getEnquiries = async (filters = {}) => {
    try {
        // Axios will automatically convert the filters object into URL query params
        // e.g., { search: 'Rohan' } becomes ?search=Rohan
        const response = await api.get('/enquiries', { params: filters });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

// --- ADD THIS NEW FUNCTION ---
// Updates a specific enquiry by its ID
export const updateEnquiry = async (id, enquiryData) => {
    try {
        const response = await api.put(`/enquiries/${id}`, enquiryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

// Submits a new enquiry form
export const createEnquiry = async (enquiryData) => {
    try {
        const response = await api.post('/enquiries', enquiryData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};
export const createProgram = async (programData) => {
    try {
        const response = await api.post('/settings/programs', programData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};
//Gets the list of companies that are part of the program
export const getCompanies = async () => {
    try {
        const response = await api.get('/settings/companies');
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};
// CReates new company
export const createCompany = async (companyData) => {
    try {
        const response = await api.post('/settings/companies', companyData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};
// Checks if a company has a tie-up
export const checkCompanyTieUp = async (companyName) => {
    try {
        const response = await api.get(`/enquiries/check-company?name=${companyName}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

// --- SETTINGS FUNCTIONS ---
export const getClassrooms = async () => {
    try {
        const response = await api.get('/admin/classrooms');
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

export const createClassroom = async (classroomData) => {
    try {
        const response = await api.post('/admin/classrooms', classroomData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

// Fetches the list of programs
export const getPrograms = async () => {
    try {
        const response = await api.get('/settings/programs');
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};  
// Converts an enquiry into a student record
export const convertEnquiryToStudent = async (enquiryId, admissionData) => {
    try {
        const response = await api.post(`/admissions/convert/${enquiryId}`, admissionData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not connect to the server.');
    }
};

// --- INVOICE FUNCTIONS ---

// Generate monthly invoices for all eligible students
export const generateMonthlyInvoices = async () => {
    try {
        const response = await api.post('/invoices/generate-monthly');
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server. Please try again later.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get invoices with filtering and pagination
export const getInvoices = async (params = {}) => {
    try {
        const response = await api.get('/invoices', { params });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Download invoice PDF
export const downloadInvoicePDF = async (invoiceId, invoiceNumber) => {
    try {
        const response = await api.get(`/invoices/generate-pdf/${invoiceId}`, {
            responseType: 'blob'
        });
        
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Update invoice status
export const updateInvoiceStatus = async (invoiceId, status) => {
    try {
        const response = await api.patch(`/invoices/${invoiceId}/status`, { status });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// --- CENTERS FUNCTIONS ---

// Get centers (all for superadmin, assigned for others)
export const getCenters = async () => {
    try {
        const response = await api.get('/centers');
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Create new center (superadmin only)
export const createCenter = async (centerData) => {
    try {
        const response = await api.post('/centers', centerData);
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Update center (superadmin only)
export const updateCenter = async (centerId, centerData) => {
    try {
        const response = await api.put(`/centers/${centerId}`, centerData);
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get centers user can access
export const getUserAccessibleCenters = async () => {
    try {
        const response = await api.get('/centers/user-accessible');
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// --- OWNERS (SUPER ADMIN) ---
export const getOwners = async () => {
    const res = await api.get('/owners');
    return res.data;
};

export const createOwner = async ({ fullName, email, password }) => {
    const res = await api.post('/owners', { fullName, email, password });
    return res.data;
};

export const getAllCenters = async () => {
    const res = await api.get('/owners/centers');
    return res.data;
};

export const getOwnerCenters = async (ownerId) => {
    const res = await api.get(`/owners/${ownerId}/centers`);
    return res.data;
};

export const updateOwnerCenters = async (ownerId, centerIds) => {
    const res = await api.put(`/owners/${ownerId}/centers`, { centerIds });
    return res.data;
};

export const getUserRoles = async (userId) => {
    const res = await api.get(`/owners/${userId}/roles`);
    return res.data;
};

export const updateUserRoles = async (userId, roles) => {
    const res = await api.put(`/owners/${userId}/roles`, { roles });
    return res.data;
};

// --- ANALYTICS FUNCTIONS ---

// Get analytics overview
export const getAnalyticsOverview = async (params = {}, options = {}) => {
    try {
        const response = await api.get('/analytics/overview', { params, ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get demographics data
export const getAnalyticsDemographics = async (params = {}, options = {}) => {
    try {
        const response = await api.get('/analytics/demographics', { params, ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get enrollment trends
export const getAnalyticsEnrollmentTrends = async (params = {}, options = {}) => {
    try {
        const response = await api.get('/analytics/enrollment-trends', { params, ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get conversion metrics
export const getAnalyticsConversionMetrics = async (params = {}, options = {}) => {
    try {
        const response = await api.get('/analytics/conversion-metrics', { params, ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get financial overview
export const getAnalyticsFinancialOverview = async (params = {}, options = {}) => {
    try {
        const response = await api.get('/analytics/financial-overview', { params, ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// Get center comparison (superadmin only)
export const getAnalyticsCenterComparison = async (options = {}) => {
    try {
        const response = await api.get('/analytics/center-comparison', { ...options });
        return response.data;
    } catch (error) {
        if (error.response) { 
            throw error.response.data; 
        } else if (error.request) { 
            throw new Error('Could not connect to the server.'); 
        } else { 
            throw new Error('An unexpected error occurred.'); 
        }
    }
};

// --- DOCUMENT MANAGEMENT FUNCTIONS ---

export const uploadDocument = async (formData) => {
    try {
        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not upload document');
    }
};

export const getDocuments = async () => {
    try {
        const response = await api.get('/documents');
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not fetch documents');
    }
};

export const deleteDocument = async (documentId) => {
    try {
        const response = await api.delete(`/documents/${documentId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Could not delete document');
    }
};

export default api;

