import axios from "axios";
import { Address } from "ton-core";
import config from "../config";

const API_URL = config.API_URL;
const API_TON_URL = config.API_TON_URL;

export async function getTokenDataNew(address: string, walletAddress?: string) {
  try {
    const response = await axios.get(
      `${API_TON_URL}${Address.normalize(address)}`
    );

    const parsedContent = response.data;
    const decimals = parseInt(parsedContent.metadata.decimals, 10);
    const data = {
      name: parsedContent.metadata.name || "",
      symbol: parsedContent.metadata.symbol || "",
      decimals: parsedContent.metadata.decimals || "",
      description: parsedContent.metadata.description || "",
      logo: parsedContent?.metadata.image || "",
      admin_address: Address.normalize(parsedContent?.admin.address) || "",
      contract_address: Address.normalize(address) || "",
      total_supply:
        (parsedContent?.total_supply / 10 ** decimals).toString() || "",
      user_balance: "",
      user_jetton_address: "",
    };

    if (walletAddress) {
      const user_response = await axios.get(
        `${API_URL}${Address.normalize(walletAddress)}/jettons`
      );
      const result = user_response.data.balances?.find(
        (item) =>
          Address.normalize(item.jetton.address) === Address.normalize(address)
      );

      if (result) {
        data.user_balance = (result.balance / 10 ** decimals).toString() || "";
        data.user_jetton_address = Address.normalize(
          result.wallet_address.address
        );
      } else {
        data.user_jetton_address = "0";
        data.user_balance = "0";
      }
    }

    return data;
  } catch (error) {
    console.log("ERRER:", error);
    throw error; // re-throw the error after showing the toast
  }
}

export async function IsTokenCreated(address: string) {
  try {
    const response = await axios.get(`${API_TON_URL}${address}`);
    if (response.data.type !== null) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
