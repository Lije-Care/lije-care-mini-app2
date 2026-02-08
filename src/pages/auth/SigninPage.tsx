import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@/components/ui";
import { BottomSheet } from "@/components/ui";
import api from "@/api/axios";
import toast from "react-hot-toast";

// Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const SignInPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotPhoneError, setForgotPhoneError] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetData, setResetData] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const tgUserId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgUserId) setTelegramId(tgUserId.toString());
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneFromBot = urlParams.get("phone");
    if (phoneFromBot) {
      setPhone("+" + phoneFromBot);
    }
  }, []);

  const signin = async () => {
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/signin", { phone, password });
      const { access_token, refresh_token, data } = response.data;

      if (data.role !== "PARENT") {
        setError("Only parents are allowed to sign in.");
        toast.error("Only parents are allowed to sign in.");
        return;
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

    try {
      const res = await api.post("/auth/forget-password", {
        phone: forgotPhone,
        telegramId: telegramId || "359880861",
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("OTP sent to your Telegram bot.");
        setResetToken(res.data?.token || "");
        setShowForgotModal(false);
        setShowResetModal(true);
        setForgotPhoneError("");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
      setForgotPhoneError(error?.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleResetPassword = async () => {
    const { otp, password, confirmPassword } = resetData;

    setOtpError("");
    setPasswordError("");

    if (!otp) {
      setOtpError("Please enter the OTP.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      const res = await api.post("/auth/reset-password", {
        token: resetToken,
        otp,
        password,
      });

      toast.success(res.data?.message || "Password reset successfully.");
      setResetData({ otp: "", password: "", confirmPassword: "" });
      setResetToken("");
      setShowResetModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Reset failed.");
      setPasswordError(error?.response?.data?.message || "Reset failed.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      signin();
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Quicksand']">
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        {/* Logo */}
        <div className="w-24 h-24 mb-8 bg-sky-100 rounded-3xl flex items-center justify-center">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
            <span className="text-white font-black text-2xl">LC</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">Welcome Back</h1>
        <p className="text-slate-500 text-center mb-8">
          Sign in to continue caring for your little one.
        </p>

        {/* Info Banner */}
        <div className="w-full max-w-sm bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6">
          <p className="text-sm text-sky-700">
            <span className="font-bold">Tip:</span> If you deleted your account, please go to the Bot, click /start, and sign up again.
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm space-y-4" onKeyPress={handleKeyPress}>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+251912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
              <p className="text-rose-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowForgotModal(true)}
              className="text-sky-500 font-semibold text-sm hover:text-sky-600 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="button"
            color="sky"
            fullWidth
            size="lg"
            onClick={signin}
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>

          <div className="text-center pt-4">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/onboarding")}
                className="text-sky-500 font-bold hover:text-sky-600 transition-colors"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Bottom Sheet */}
      <BottomSheet
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Forgot Password"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-700">
              <span className="font-bold">Note:</span> Enter your phone number and you'll receive an OTP in your Telegram bot.
            </p>
          </div>

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+251912345678"
            value={forgotPhone}
            onChange={(e) => {
              setForgotPhone(e.target.value);
              setForgotPhoneError("");
            }}
            error={forgotPhoneError}
          />

          <Button
            color="sky"
            fullWidth
            size="lg"
            onClick={handleForgotPassword}
          >
            Send OTP
          </Button>
        </div>
      </BottomSheet>

      {/* Reset Password Bottom Sheet */}
      <BottomSheet
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Password"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-sm text-emerald-700">
              OTP sent successfully! Check your Telegram bot.
            </p>
          </div>

          <Input
            label="OTP Code"
            placeholder="Enter the OTP"
            value={resetData.otp}
            onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
            error={otpError}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={resetData.password}
            onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            value={resetData.confirmPassword}
            onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
            error={passwordError}
          />

          <Button
            color="sky"
            fullWidth
            size="lg"
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default SignInPage;
