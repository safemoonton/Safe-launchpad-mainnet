import axiosInstance from "./axiosInstance";

const icoService = {
  getICO: async (id) => {
    try {
      const response = await axiosInstance.get(`/launchpad/${id}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getAllICOs: async () => {
    try {
      const response = await axiosInstance.get("/all-launchpad");
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createICO: async (icoData) => {
    try {
      const response = await axiosInstance.post("/launchpad", icoData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  updateICO: async (id, icoData) => {
    try {
      const response = await axiosInstance.put(`/launchpad/${id}`, icoData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createPurchase: async (purchaseData) => {
    try {
      const response = await axiosInstance.post("/purchases", purchaseData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  updatePurchase: async (purchaseId, purchaseData) => {
    try {
      const response = await axiosInstance.put(
        `/purchases/${purchaseId}`,
        purchaseData
      );
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getPurchasesByICO: async (icoId) => {
    try {
      const response = await axiosInstance.get(`/purchases/${icoId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },
};

export default icoService;
