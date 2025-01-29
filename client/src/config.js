let config = {};


switch (import.meta.env.VITE_APP_ENV) {
  case "local":
    config = {
      API: "http://localhost:8080/api/v1",
      PLATFORM_OWNER_ADDRESS:
        "0QDz0SbZpnuFAuxZBCOMxE24CIjhw9bKc1OamHITrrvLM6mj",
      ADMIN_WALLETS: [
        "0QC8mzdlvXH8GKYV_shfnAzA7nlWbsD89fjBE1nRpaQxREFz",
        "0QDrRLLjPYZUXQHIZxeeDEIJ8D6xK3IqWuW_D9RPeChqpWet",
      ],
      NETWORK: "testnet",
      API_URL: "https://testnet.tonapi.io/v2/accounts/",
      API_TON_URL: "https://testnet.tonapi.io/v2/jettons/",
    };
    break;
  case "testnet":
    config = {
      API: "https://safe-launch-api.vercel.app/api/v1",
      PLATFORM_OWNER_ADDRESS:
        "0QDz0SbZpnuFAuxZBCOMxE24CIjhw9bKc1OamHITrrvLM6mj",
      ADMIN_WALLETS: [
        "0QC8mzdlvXH8GKYV_shfnAzA7nlWbsD89fjBE1nRpaQxREFz",
        "0QDrRLLjPYZUXQHIZxeeDEIJ8D6xK3IqWuW_D9RPeChqpWet",
      ],
      NETWORK: "testnet",
      API_URL: "https://testnet.tonapi.io/v2/accounts/",
      API_TON_URL: "https://testnet.tonapi.io/v2/jettons/",
    };
    break;
  case "mainnet_local":
    config = {
      API: "http://localhost:8080/api/v1",
      PLATFORM_OWNER_ADDRESS:
        "UQDz0SbZpnuFAuxZBCOMxE24CIjhw9bKc1OamHITrrvLMxIp",
      ADMIN_WALLETS: [
        "UQDrRLLjPYZUXQHIZxeeDEIJ8D6xK3IqWuW_D9RPeChqpdwn",
      ],
      NETWORK: "mainnet",
      API_URL: "https://tonapi.io/v2/accounts/",
      API_TON_URL: "https://tonapi.io/v2/jettons/",
    };
    break;
  case "mainnet":
    config = {
      API: "https://safe-launchpad-mainnet-api.vercel.app/api/v1",
      PLATFORM_OWNER_ADDRESS:
        "UQDz0SbZpnuFAuxZBCOMxE24CIjhw9bKc1OamHITrrvLMxIp",
      ADMIN_WALLETS: [
        "UQDrRLLjPYZUXQHIZxeeDEIJ8D6xK3IqWuW_D9RPeChqpdwn",
      ],
      NETWORK: "mainnet",
      API_URL: "https://tonapi.io/v2/accounts/",
      API_TON_URL: "https://tonapi.io/v2/jettons/",
    };
    break;
  default:
    break;
}

export default config;
