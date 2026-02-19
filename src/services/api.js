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
    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
  googleLogin: (googleData) => api.post("/auth/google", googleData),
};

export const spendingAPI = {
  getAll: () => api.get("/spending"),
  getById: (id) => api.get(`/spending/${id}`),
  create: (data) => api.post("/spending", data),
  update: (id, data) => api.put(`/spending/${id}`, data),
  delete: (id) => api.delete(`/spending/${id}`),
  getSummary: () => api.get("/spending/analytics/summary"),
  getCategories: () => api.get("/spending/analytics/categories"),
};

export const billsAPI = {
  getAll: () => api.get("/bills"),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post("/bills", data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),

  markPaid: (id) => api.put(`/bills/${id}/paid`),
  markUnpaid: (id) => api.put(`/bills/${id}/unpaid`),
};

export const loansAPI = {
  getAll: () => api.get("/loans"),
  getActive: () => api.get("/loans/active"),
  getPaid: () => api.get("/loans/paid"),
  getById: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post("/loans", data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
  markPaid: (id) => api.put(`/loans/${id}/paid`),
  markUnpaid: (id) => api.put(`/loans/${id}/unpaid`),
  addPayment: (id, data) => api.post(`/loans/${id}/payment`, data),
  getPayments: (id) => api.get(`/loans/${id}/payments`),
  getAmortization: (id) => api.get(`/loans/analytics/amortization/${id}`),
  getSummary: () => api.get("/loans/analytics/summary"),
};

export const earningsAPI = {
  getCurrent: () => api.get("/earnings/current"),
  getHistory: () => api.get("/earnings/history"),
  setEarning: ({ amount, month }) => api.post("/earnings", { amount, month }),
  updateEarning: (id, { amount, month }) =>
    api.put(`/earnings/${id}`, { amount, month }),
  deleteEarning: (id) => api.delete(`/earnings/${id}`),

  getComparison: () => api.get("/earnings/analytics/comparison"),
};

export default api;
