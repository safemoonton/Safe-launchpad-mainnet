import axiosInstance from './axiosInstance';

const airdropService = {
  getAirdrop: async (id) => {
    try {
      const response = await axiosInstance.get(`/airdrop/${id}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getAirdropbyAddress: async (address) => {
    try {
      const response = await axiosInstance.get(`/airdrop/token/${address}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getAllAirdrops: async () => {
    try {
      const response = await axiosInstance.get('/all-airdrop');
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createAirdrop: async (airdropData) => {
    try {
      const response = await axiosInstance.post('/airdrop', airdropData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  updateAirdrop: async (id, airdropData) => {
    try {
      const response = await axiosInstance.put(`/airdrop/${id}`, airdropData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createClaim: async (claimData) => {
    try {
      const response = await axiosInstance.post('/claims', claimData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getClaimsByAirdrop: async (airdropId) => {
    try {
      const response = await axiosInstance.get(`/claims/${airdropId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },
};

export default airdropService;
