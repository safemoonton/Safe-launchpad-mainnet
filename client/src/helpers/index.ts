import {
  Address,
  toNano,
  beginCell,
  storeStateInit,
  StateInit,
} from "@ton/core";
import { TonClient, JettonMaster } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import config from "../config";

const NETWORK = config.NETWORK;

export const makeElipsisAddress = (
  address?: string | null,
  padding?: number
): string => {
  const paddingValue = padding || 10;
  if (!address) return "";
  const firstPart = address.substring(0, paddingValue);
  const secondPart = address.substring(address.length - paddingValue);
  return `${firstPart}...${secondPart}`;
};

export const normalizeAddress = (address: any) => {
  return address ? address.toLowerCase().trim() : '';
};

export function checkImageURL(url: string) {
  return url.match(/\.(jpeg|jpg|gif|png|svg)$/) != null;
}

export function formatNumber(numberString: any) {
  if (!numberString) return "";

  // Convert the input to a number
  const number = parseFloat(numberString);

  if (isNaN(number)) return "";

  // Use the toLocaleString method to add commas
  return number.toLocaleString();
}

export function formatDateTimeOld(isoString) {
  const date = new Date(isoString);

  // Extract date components
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is zero-based
  const year = date.getFullYear();

  // Extract time components
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Determine AM/PM
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, "0");

  // Format date and time
  const formattedDate = `${day}/${month}/${year}`;
  const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

  return `${formattedDate} ${formattedTime}`;
}

export function formatDateTimeFromTimestamp(unixTimestamp) {
  // Convert the Unix timestamp (in seconds) to milliseconds
  const date = new Date(unixTimestamp * 1000);

  const formatter = new Intl.DateTimeFormat("UTC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formattedParts = formatter.formatToParts(date);

  // Extract and rearrange the parts to match "MM/DD/YYYY HH:MM"
  const dateTimeParts = {};
  formattedParts.forEach(({ type, value }) => {
    dateTimeParts[type] = value;
  });

  //@ts-ignore
  return `${dateTimeParts.month}/${dateTimeParts.day}/${dateTimeParts.year} ${dateTimeParts.hour}:${dateTimeParts.minute}`;
}

export function formatDateTime(dateTimeString) {
  // Create a new Date object from the input string
  const date = new Date(dateTimeString);

  // Get individual date and time components
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  // Format the date and time as "MM/DD/YYYY HH:MM"
  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

export function formatDateTimeUTC(isoString) {
  const date = new Date(isoString);

  // Extract date components
  const day = date.getUTCDate();
  const month = date.toLocaleString("default", {
    month: "long",
    timeZone: "UTC",
  });
  const year = date.getUTCFullYear();

  // Extract time components in UTC
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  // Format date and time
  const formattedDate = `${day} ${month} ${year}`;
  const formattedTime = `${hours}:${minutes} (UTC)`;

  return `${formattedTime} ${formattedDate}`;
}

export function checkDecimals(value: string) {
  if (!value) return true;
  if (value.includes(".")) return false;

  const num = parseInt(value);
  return num >= 0 && num <= 255;
}

export function parseAirdropEntries(input: any) {
  const entries = input.split("\n").map((line) => {
    const [address, amount] = line.split(": ");
    return {
      address: Address.parse(address.trim()),
      amount: toNano(amount.trim()),
    };
  });

  return entries;
}

export function parseAirdropEntriesNormal(input) {
  if (input == undefined) {
    return {
      entries: [],
      totalAmount: 0,
    };
  } else {
    const entries = input.split("\n").map((line) => {
      const [address, amount] = line.split(": ");
      return {
        address: Address.normalize(address.trim()),
        amount: parseFloat(amount.trim()),
      };
    });

    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      entries,
      totalAmount,
    };
  }
}

export function parseICOEntries(input: any) {
  const entries = input.split(",").map((entry) => entry.trim());
  return entries.map((entry) => Address.normalize(entry));
}

export function findAirdropEntryIndex(input: string, addressToFind: string) {
  const entries = input.split("\n").map((line) => {
    const [address, amount] = line.split(": ");
    return {
      address: Address.parse(address.trim()),
      amount: toNano(amount.trim()),
    };
  });

  const index = entries.findIndex((entry) =>
    entry.address.equals(Address.parse(addressToFind.trim()))
  );

  if (index !== -1) {
    return { index: index, claimAmount: entries[index].amount.toString() };
  } else {
    return { index: -1, claimAmount: null };
  }
}

export const getJettonWalletAddress = async (
  jettonMinterAddress: string,
  airdropAddress: string
) => {
  const endpoint = await getHttpEndpoint({
    network: NETWORK,
  });

  const client = new TonClient({ endpoint: endpoint });
  const jettonAddress = Address.parse(jettonMinterAddress);
  const dropAddress = Address.parse(airdropAddress);

  const jettonMaster = client.open(JettonMaster.create(jettonAddress));
  const address = await jettonMaster.getWalletAddress(dropAddress);
  return address;
};

export function isAddressWhitelisted(
  address,
  startTime,
  whitelistType,
  basicWhitelist,
  tieredWhitelist
) {
  const currentTime = new Date().getTime();
  const icoStartTime = new Date(startTime).getTime();
  // Helper function to convert delay to milliseconds
  const getDelayInMs = (delay) => delay * 60 * 1000; // delay in minutes to milliseconds

  if (whitelistType === "basic" && basicWhitelist !== undefined) {
    // Check if the address is in the basic whitelist
    const entries = parseICOEntries(basicWhitelist);
    return entries.includes(Address.normalize(address.trim()));
  } else if (whitelistType === "tiered" && tieredWhitelist !== undefined) {
    // Check each tier for the address
    for (const tier of tieredWhitelist) {
      const { addresses, delay } = tier;
      const entries = parseICOEntries(addresses.toString());
      if (entries.includes(Address.normalize(address.trim()))) {
        const tierStartTime = icoStartTime + getDelayInMs(delay);
        if (currentTime >= tierStartTime) {
          return true;
        }
      }
    }
  }

  // Address not found in whitelist or tier conditions not met
  return false;
}

export const getJettonWalletAddressLock = async (
  jettonMinterAddress: string,
  airdropAddress: string
) => {
  const endpoint = await getHttpEndpoint({
    network: NETWORK,
  });

  const client = new TonClient({ endpoint: endpoint });
  const jettonAddress = Address.parse(jettonMinterAddress);
  const dropAddress = Address.parse(airdropAddress);

  const jettonMaster = client.open(JettonMaster.create(jettonAddress));
  const address = await jettonMaster.getWalletAddress(dropAddress);
  return Address.normalize(address);
};

export const getJettonInit = async (jettonWalletAddress: Address) => {
  const endpoint = await getHttpEndpoint({
    network: NETWORK,
  });

  const client = new TonClient({ endpoint: endpoint });
  const jettonWalletDataResult = await client.runMethod(
    jettonWalletAddress,
    "get_wallet_data"
  );
  jettonWalletDataResult.stack.readNumber();
  const ownerAddress = jettonWalletDataResult.stack.readAddress();
  const jettonMasterAddress = jettonWalletDataResult.stack.readAddress();
  const jettonCode = jettonWalletDataResult.stack.readCell();
  const jettonData = beginCell()
    .storeCoins(0)
    .storeAddress(ownerAddress)
    .storeAddress(jettonMasterAddress)
    .storeRef(jettonCode)
    .endCell();

  const stateInit: StateInit = {
    code: jettonCode,
    data: jettonData,
  };

  const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

  const initCell = stateInitCell.toBoc().toString("base64");

  return initCell;
};

export function isTimeGreaterThanCurrent(isoString) {
  const givenDate = new Date(isoString);
  const currentDate = new Date();

  return givenDate > currentDate;
}

export function isTimeGreaterThanCurrentNormal(isoString) {
  try {
    // Parse the input string to a Date object
    const givenDate = new Date(isoString);

    // Ensure the date is valid
    if (isNaN(givenDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // Get the current date and time
    const currentDate = new Date();

    // Compare the given date with the current date
    return givenDate > currentDate;
  } catch (error) {
    console.error("Error parsing date:", error);
    return false;
  }
}
