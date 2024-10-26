import axiosInstance from "./axiosInstance";

const lockService = {
  getLock: async (lockAddress) => {
    try {
      const response = await axiosInstance.get(`/lock/${lockAddress}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getLockByToken: async (tokenAddress) => {
    try {
      const response = await axiosInstance.get(`/lock/token/${tokenAddress}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getAllLocks: async () => {
    try {
      const response = await axiosInstance.get("/all-lock");
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createLock: async (LockData) => {
    try {
      const response = await axiosInstance.post("/lock", LockData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  updateLock: async (id, LockData) => {
    try {
      const response = await axiosInstance.put(`/lock/${id}`, LockData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },
};

export default lockService;
