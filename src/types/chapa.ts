export interface ChapaPaymentData {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  return_url: string; // The backend should append this, but good to have
}

export interface ChapaInitializeResponse {
  status: "created" | "failed";
  message: string;
  data: {
    checkout_url: string;
  };
}
