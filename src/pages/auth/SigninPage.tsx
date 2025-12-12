import {
  Button,
  Headline,
  Input,
  Text,
  Modal,
} from "@telegram-apps/telegram-ui";
import { useState, useEffect } from "react";
import "./sign-in-page.css";
import { Page } from "@/components/Page";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const SignInPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotPhoneError, setForgotPhoneError] = useState("");

  const [forgotPhone, setForgotPhone] = useState(""); // ✅ Separate phone field
  const [telegramId, setTelegramId] = useState("");
  // console.log({ telegramId });
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // console.log({ successMessage });
  const [errorMessage, setErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [passwordLengthErrorMessage, setPasswordLengthErrorMessage] =
    useState("");
  const [resetData, setResetData] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const tgUserId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
      ?.id;
    if (tgUserId) setTelegramId(tgUserId.toString());
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneFromBot = urlParams.get("phone");

    if (phoneFromBot) {
      setPhone("+" + phoneFromBot);
    }
  }, []);

  // ✅ Accept both Ethio Telecom (+2519...) and Safaricom (+2517...) numbers
  // const validatePhone = (value: string) => /^\+251(9|7)\d{8}$/.test(value);

  const signin = async () => {
    setError("");

    // if (!validatePhone(phone)) {
    //   setError("Phone must start with +2519|7 and be 12 digits.");
    //   return;
    // }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/signin", { phone, password });

      const { access_token, refresh_token, data } = response.data;
      // console.log({ data });

      if (data.role !== "PARENT") {
        setError("Only parent are allowed to sign in.");
        toast.error("Only parent are allowed to sign in.");
        return; // ⛔ stop here, don’t save tokens
      }

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(data));

      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPhone) {
      setForgotPhoneError("Please enter your phone number");
      return;
    }

    // if (!validatePhone(forgotPhone)) {
    //   setForgotPhoneError(
    //     "Enter a valid phone number starting with +2519 or +2517"
    //   );
    //   return;
    // }

    try {
      const res = await api.post("/auth/forget-password", {
        phone: forgotPhone,
        telegramId: telegramId || "359880861",
      });

      if (res.status === 200 || res.status === 201) {
        setSuccessMessage("Success!, OTP sent to your Telegram bot.");
        toast.success("OTP sent to your Telegram bot.");
        setResetToken(res.data?.token || "");
        setShowForgotModal(false);
        setShowResetModal(true);
        setForgotPhoneError("");
        if (resetData.otp != res.data.otp) {
          setOtpMessage("Please enter valid OPT!");
        }
      }
    } catch (error: any) {
      setErrorMessage("Error! Something went wrong.");
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPassword = async () => {
    const { otp, password, confirmPassword } = resetData;

    // Reset previous messages
    setPasswordLengthErrorMessage("");
    setOtpMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    // 1️⃣ Check OTP
    // const expectedOtpFromServer = localStorage.getItem("expectedOtp") || "";
    if (!otp) {
      setOtpMessage("Please enter the OTP.");
      return;
    }
    if (otp !== resetData.otp) {
      setOtpMessage("Incorrect OTP. Please try again.");
      return;
    }

    // 2️⃣ Check password length
    if (password.length < 6) {
      setPasswordLengthErrorMessage("Password must be at least 6 characters.");
      return;
    }

    // 3️⃣ Check password match
    if (password !== confirmPassword) {
      setPasswordLengthErrorMessage("Passwords do not match.");
      return;
    }

    // ✅ All validations passed
    try {
      const res = await api.post("/auth/reset-password", {
        token: resetToken,
        otp,
        password,
      });

      setSuccessMessage(res.data?.message || "Password reset successfully.");
      toast.success(res.data?.message || "Password reset successfully.");

      setResetData({ otp: "", password: "", confirmPassword: "" });
      setResetToken("");
      setShowResetModal(false);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Reset failed.");
      toast.error(error?.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <Page back={true}>
      <div
        className=" bg-gray-800"
        style={{
          padding: "10px",

          height: "100vh",
          margin: "auto",
        }}
      >
        <div style={{ padding: "15px", borderRadius: "20px" }}>
          <Headline className=" text-white flex justify-center items-center font-bold text-xl my-5 mx-2.5 py-4">
            Sign In
          </Headline>

          <div
            className="p-2 mb-4 mt-3 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
            role="alert"
          >
            <span className="font-medium">If you delete your account, </span>
            please go to the Bot, click /start, and then sign up again.
          </div>

          <div className=" bg-gray-800">
            {/* Phone */}
            <div className="mt-10 bg-gray-800">
              <label
                htmlFor="phone"
                className="text-white block font-medium mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+2519XXXXXXXX"
                className="w-full px-4 text-white py-2 rounded-lg border border-gray-300 focus:outline-none bg-gray-700"
                value={phone}
                disabled={!!phone} // 👈 disables if phone exists
                readOnly
              />
            </div>

            {/* Password Field with Eye Icon */}
            <div className="mt-4 relative">
              <label
                htmlFor="password"
                className="text-white block font-medium mb-1"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"} // 👁 toggle visibility
                placeholder="******"
                className="w-full px-4 text-white py-2 rounded-lg border border-gray-300 focus:outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* 👁 Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  // 👁‍🗨 Eye-off icon (password visible)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-.573.05-1.134.146-1.68M6.708 6.707a9.956 9.956 0 016.588-2.707c5.523 0 10 4.477 10 10 0 1.85-.502 3.58-1.383 5.072M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3l18 18"
                    />
                  </svg>
                ) : (
                  // 👁 Eye icon (password hidden)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <Text style={{ color: "red", marginTop: "10px" }}>{error}</Text>
            )}

            <Text
              className="forgot-password"
              style={{ marginTop: "10px", cursor: "pointer" }}
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </Text>

            <Text
              onClick={() => navigate("/onboarding")}
              className="forgot-password"
              style={{ marginTop: "10px", cursor: "pointer" }}
            >
              Don’t have an account? Sign up
            </Text>

            <Button
              size="l"
              stretched
              className="signin-button"
              style={{ marginTop: "40px" }}
              onClick={signin}
              color="primary"
              disabled={loading}
              loading={loading}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {/* Forgot Password Modal */}
      <Modal
        open={showForgotModal}
        onOpenChange={setShowForgotModal}
        className=" bg-white"
      >
        <div className="p-4 bg-gray-800">
          <Headline
            style={{ marginBottom: "12px" }}
            className=" text-white font-black text-base"
          >
            📩 Forgot Password
          </Headline>

          <div
            className="p-2 mb-4 mt-3 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
            role="alert"
          >
            <span className="font-medium px-0.5">
              Forgot password works only on your phone.
            </span>
            Please open the Telegram mini app, enter your phone number, and
            you’ll receive an OTP in your <span className="font-bold">bot</span>
            .
          </div>

          <div className="mb-1">
            <input
              placeholder="+251912345678"
              value={forgotPhone}
              className={`w-full px-4 py-2  text-white rounded-lg border focus:outline-none ${
                forgotPhoneError ? "border-red-500" : "border-gray-300"
              }`}
              onChange={(e) => {
                setForgotPhone(e.target.value);
                setForgotPhoneError(""); // clear error on change
              }}
            />
            {forgotPhoneError && (
              <p className="text-red-500 text-sm mt-1">{forgotPhoneError}</p>
            )}
          </div>
          <p className="text-red-500"> {errorMessage}</p>
          <Button
            onClick={handleForgotPassword}
            stretched
            style={{ marginTop: "16px" }}
          >
            Send OTP
          </Button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showResetModal} onOpenChange={setShowResetModal}>
        <div className="p-4 bg-gray-800">
          <p className="text-green-500 py-2 ml-3">{successMessage}</p>
          <Headline
            style={{ marginBottom: "12px" }}
            className="text-white font-black text-base"
          >
            🔐 Reset Password
          </Headline>

          <Input
            name="otp"
            placeholder="Enter OTP"
            className="text-white"
            value={resetData.otp}
            onChange={handleResetChange}
          />
          {otpMessage && (
            <p className="text-red-500 text-sm  ml-5 -mt-1">{otpMessage}</p>
          )}

          <Input
            name="password"
            type="password"
            placeholder="New Password"
            value={resetData.password}
            onChange={handleResetChange}
            className="mb-2 text-white"
          />
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={resetData.confirmPassword}
            onChange={handleResetChange}
            className="mb-2 text-white"
          />
          {passwordLengthErrorMessage && (
            <p className="text-red-500 text-sm mb-2">
              {passwordLengthErrorMessage}
            </p>
          )}

          {errorMessage && (
            <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
          )}

          <Button onClick={handleResetPassword} stretched>
            Confirm Reset
          </Button>
        </div>
      </Modal>
    </Page>
  );
};

export default SignInPage;
