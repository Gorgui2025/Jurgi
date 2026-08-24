const API_URL = process.env.UNITECHPAY_API_URL || "https://api.unitech.sn/api.php";
const API_KEY = process.env.UNITECHPAY_API_KEY || "";
const WEBHOOK_SECRET = process.env.UNITECHPAY_WEBHOOK_SECRET || "";

interface UnitechPayResponse {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  code?: number;
}

async function request(action: string, method: "GET" | "POST" = "POST", data?: Record<string, unknown>): Promise<UnitechPayResponse> {
  const url = `${API_URL}?action=${action}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" && data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  return res.json();
}

export async function createWavePayment(
  amount: number,
  customerNumber: string,
  description: string,
  callbackSuccess: string,
  callbackCancel: string
): Promise<UnitechPayResponse> {
  return request("create_wave_payment", "POST", {
    amount,
    customer_number: customerNumber,
    description,
    callback_success: callbackSuccess,
    callback_cancel: callbackCancel,
  });
}

export async function createOrangeOM(
  amount: number,
  customerNumber: string,
  description: string,
  callbackSuccess: string,
  callbackCancel: string
): Promise<UnitechPayResponse> {
  return request("create_orange_om", "POST", {
    amount,
    customer_number: customerNumber,
    description,
    callback_success: callbackSuccess,
    callback_cancel: callbackCancel,
  });
}

export async function createOrangeQR(
  amount: number,
  reference: string,
  description: string,
  callbackSuccess: string,
  callbackCancel: string
): Promise<UnitechPayResponse> {
  return request("create_orange_qr", "POST", {
    amount,
    reference,
    description,
    callback_success: callbackSuccess,
    callback_cancel: callbackCancel,
  });
}

export async function createOrangeMaxIt(
  amount: number,
  customerNumber: string,
  description: string,
  callbackSuccess: string,
  callbackCancel: string
): Promise<UnitechPayResponse> {
  return request("create_orange_maxit", "POST", {
    amount,
    customer_number: customerNumber,
    description,
    callback_success: callbackSuccess,
    callback_cancel: callbackCancel,
  });
}

export async function getBalance(): Promise<UnitechPayResponse> {
  return request("balance", "GET");
}

export function verifyWebhookSignature(body: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!signatureHeader) return false;

  const expected = require("crypto")
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return expected === signatureHeader;
}

export function verifyWebhookBody(data: Record<string, unknown>): boolean {
  if (!WEBHOOK_SECRET) return true;

  const signed = `${data.event || ""}|${data.reference || ""}|${data.amount || ""}|${data.status || ""}|${data.signed_at || ""}`;

  const crypto = require("crypto");
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
  return expected === (data.signature as string || "");
}
