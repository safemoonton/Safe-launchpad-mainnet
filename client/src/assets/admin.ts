import { Address } from "ton-core";
import config from "../config";

export const admin = config.ADMIN_WALLETS;

export function isAdmin(walletAddress) {
  const address = Address.normalize(walletAddress);

  if (walletAddress) {
    return admin.includes(address) || admin.includes(walletAddress);
  }
}
