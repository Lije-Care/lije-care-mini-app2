import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
// import { ChapaInitializeResponse } from "../types/chapa";

interface FormData {
  amount: string;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  tx_ref: string;
}

const PaymentForm: React.FC = () => {
  // Generate a unique transaction reference
  const tx_ref = `AP-${Date.now()}`;
  const [formData, setFormData] = useState<FormData>({
    amount: "100",
    currency: "ETB",
    email: "test@Gmail.com",
    firstName: "Test",
    lastName: "User",
    tx_ref,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // console.log({ requestData });
      const response = await axios.post<any>(
        "http://localhost:1020/api/v1/chapa/initialize",
        formData
      );
      // console.log({ response });

      if (response.data.status === "success") {
        window.location.href = response.data.data.checkout_url;
      } else {
        alert("Payment initialization failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("An error occurred during payment.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Payment Details</h2>
      <label>
        Amount:
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        First Name:
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Last Name:
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Email:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </label>
      {/* Add more fields as needed */}
      <button type="submit">Pay with Chapa</button>
    </form>
  );
};

export default PaymentForm;
