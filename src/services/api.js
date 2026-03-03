// export default api;
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current month in YYYY-MM-01 format
 * Example: March 2024 -> "2024-03-01"
 */
const getCurrentMonth = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}-01`;
};

/**
 * Format year and month to YYYY-MM-01
 * Example: (2024, 3) -> "2024-03-01"
 */
const formatYearMonth = (year, month) => {
  return `${year}-${month.toString().padStart(2, "0")}-01`;
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
  googleLogin: (googleData) => api.post("/auth/google", googleData),
};

// ============================================
// SPENDING API
// ============================================
export const spendingAPI = {
  // Get all spending (optionally filtered by month)
  getAll: (month) => {
    const url = month ? `/spending?month=${month}` : "/spending";
    return api.get(url);
  },

  // Get current month's spending
  getCurrentMonth: () => {
    return api.get(`/spending?month=${getCurrentMonth()}`);
  },

  // Get spending for a specific month
  getByMonth: (month) => {
    return api.get(`/spending?month=${month}`);
  },

  // Get spending for a specific year and month
  getByYearMonth: (year, month) => {
    return api.get(`/spending?month=${formatYearMonth(year, month)}`);
  },

  // Get single spending entry
  getById: (id) => api.get(`/spending/${id}`),

  // Create new spending (month will be set automatically from date)
  create: (data) => api.post("/spending", data),

  // Update spending
  update: (id, data) => api.put(`/spending/${id}`, data),

  // Delete spending
  delete: (id) => api.delete(`/spending/${id}`),

  // Analytics
  getSummary: (month) => {
    const url = month
      ? `/spending/analytics/summary?month=${month}`
      : "/spending/analytics/summary";
    return api.get(url);
  },
  getCategories: () => api.get("/spending/analytics/categories"),

  // 🗑️ REMOVED: reset and resetForNewMonth - no longer needed!
};

// ============================================
// BILLS API
// ============================================
export const billsAPI = {
  // Get all bills (optionally filtered by month)
  getAll: (month) => {
    const url = month ? `/bills?month=${month}` : "/bills";
    return api.get(url);
  },

  // Get current month's bills
  getCurrentMonth: () => {
    return api.get(`/bills?month=${getCurrentMonth()}`);
  },

  // Get bills for a specific month
  getByMonth: (month) => {
    return api.get(`/bills?month=${month}`);
  },

  // Get bills for a specific year and month
  getByYearMonth: (year, month) => {
    return api.get(`/bills?month=${formatYearMonth(year, month)}`);
  },

  // Get single bill
  getById: (id) => api.get(`/bills/${id}`),

  // Create new bill
  create: (data) => api.post("/bills", data),

  // Update bill
  update: (id, data) => api.put(`/bills/${id}`, data),

  // Delete bill
  delete: (id) => api.delete(`/bills/${id}`),

  // Bill status management
  markPaid: (id) => api.put(`/bills/${id}/paid`),
  markUnpaid: (id) => api.put(`/bills/${id}/unpaid`),

  // 🗑️ REMOVED: reset and resetForNewMonth - no longer needed!
};

// ============================================
// LOANS API
// ============================================
export const loansAPI = {
  // Get all loans (optionally filtered by month)
  getAll: (month) => {
    const url = month ? `/loans?month=${month}` : "/loans";
    return api.get(url);
  },

  // Get current month's loans
  getCurrentMonth: () => {
    return api.get(`/loans?month=${getCurrentMonth()}`);
  },

  // Get loans for a specific month
  getByMonth: (month) => {
    return api.get(`/loans?month=${month}`);
  },

  // Get loans for a specific year and month
  getByYearMonth: (year, month) => {
    return api.get(`/loans?month=${formatYearMonth(year, month)}`);
  },

  // Filter by status
  getActive: () => api.get("/loans/active"),
  getPaid: () => api.get("/loans/paid"),

  // Get single loan
  getById: (id) => api.get(`/loans/${id}`),

  // Create new loan
  create: (data) => api.post("/loans", data),

  // Update loan
  update: (id, data) => api.put(`/loans/${id}`, data),

  // Delete loan
  delete: (id) => api.delete(`/loans/${id}`),

  // Loan status management
  markPaid: (id) => api.put(`/loans/${id}/paid`),
  markUnpaid: (id) => api.put(`/loans/${id}/unpaid`),

  // Payments
  addPayment: (id, data) => api.post(`/loans/${id}/payment`, data),
  getPayments: (id) => api.get(`/loans/${id}/payments`),

  // Analytics
  getAmortization: (id) => api.get(`/loans/analytics/amortization/${id}`),
  getSummary: (month) => {
    const url = month
      ? `/loans/analytics/summary?month=${month}`
      : "/loans/analytics/summary";
    return api.get(url);
  },

  // 🗑️ REMOVED: reset and resetForNewMonth - no longer needed!
};

export const earningsAPI = {
  // Get earnings for a specific month
  getByMonth: async (month) => {
    try {
      const response = await api.get(`/earnings?month=${month}`);
      return {
        data: {
          amount: response.data?.amount || 0,
          month: response.data?.month || month,
          id: response.data?.id,
        },
      };
    } catch (error) {
      console.error(`Error fetching earnings for month ${month}:`, error);
      return {
        data: {
          amount: 0,
          month: month,
        },
      };
    }
  },

  // Get current month's earnings - USING CORRECT /current ENDPOINT
  getCurrent: async () => {
    try {
      const response = await api.get("/earnings/current");

      console.log("🔍 Earnings API /current response:", response);

      // Extract data from response
      const responseData = response.data || {};

      return {
        data: {
          amount: Number(responseData.amount) || 0,
          month: responseData.month || getCurrentMonth(),
          id: responseData.id || null,
        },
      };
    } catch (error) {
      console.error("Error fetching current earnings:", error);
      return {
        data: {
          amount: 0,
          month: getCurrentMonth(),
        },
      };
    }
  },

  // Get earnings for a specific year and month
  getByYearMonth: async (year, month) => {
    try {
      const monthStr = formatYearMonth(year, month);
      const response = await api.get(`/earnings?month=${monthStr}`);
      return {
        data: {
          amount: response.data?.amount || 0,
          month: response.data?.month || monthStr,
          id: response.data?.id,
        },
      };
    } catch (error) {
      console.error(`Error fetching earnings for ${year}-${month}:`, error);
      return {
        data: {
          amount: 0,
          month: formatYearMonth(year, month),
        },
      };
    }
  },

  // Get earnings history (all months)
  getHistory: async () => {
    try {
      const response = await api.get("/earnings/history");
      return {
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      console.error("Error fetching earnings history:", error);
      return { data: [] };
    }
  },

  // Set earnings for a month
  setEarning: async ({ amount, month }) => {
    try {
      const targetMonth = month || getCurrentMonth();
      const response = await api.post("/earnings", {
        amount,
        month: targetMonth,
      });

      return {
        data: {
          amount: response.data?.amount || amount,
          month: response.data?.month || targetMonth,
          id: response.data?.id,
        },
      };
    } catch (error) {
      console.error("Error setting earnings:", error);
      throw error;
    }
  },

  // Update earnings
  updateEarning: async (id, { amount, month }) => {
    try {
      const response = await api.put(`/earnings/${id}`, { amount, month });
      return response;
    } catch (error) {
      console.error("Error updating earnings:", error);
      throw error;
    }
  },

  // Delete earnings
  deleteEarning: async (id) => {
    try {
      const response = await api.delete(`/earnings/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting earnings:", error);
      throw error;
    }
  },

  // Analytics
  getComparison: async () => {
    try {
      const response = await api.get("/earnings/analytics/comparison");
      return {
        data: {
          monthly_earning: response.data?.monthly_earning || 0,
          total_spent: response.data?.total_spent || 0,
          remaining: response.data?.remaining || 0,
          percentage_spent: response.data?.percentage_spent || 0,
          is_over_budget: response.data?.is_over_budget || false,
          is_warning: response.data?.is_warning || false,
          month: response.data?.month || getCurrentMonth(),
        },
      };
    } catch (error) {
      console.error("Error fetching comparison:", error);
      return {
        data: {
          monthly_earning: 0,
          total_spent: 0,
          remaining: 0,
          percentage_spent: 0,
          is_over_budget: false,
          is_warning: false,
          month: getCurrentMonth(),
        },
      };
    }
  },
};

// ============================================
// ARCHIVE API
// ============================================
export const archiveAPI = {
  getAll: () => api.get("/archive"),
  getById: (id) => api.get(`/archive/${id}`),
  create: (data) => api.post("/archive", data),
  delete: (id) => api.delete(`/archive/${id}`),
};

export default api;
