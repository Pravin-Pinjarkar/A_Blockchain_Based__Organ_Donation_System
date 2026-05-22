import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [timer, setTimer] = useState(60); // 🔥 1 min timer
  const [canResend, setCanResend] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  // ✅ AUTO FILL EMAIL
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // 🔥 TIMER LOGIC
  useEffect(() => {
    if (!otpSent) return;

    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // 🔥 SEND OTP
  const handleSendOtp = async () => {
    try {
      const res = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent!");
        setOtpSent(true);
        setTimer(60);
        setCanResend(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error");
    }
  };

  // 🔁 RESEND OTP
  const handleResend = () => {
    handleSendOtp();
  };

  // 🔥 RESET PASSWORD
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password updated!");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">

        <h2 className="text-2xl font-bold text-center mb-4">
          Reset Password
        </h2>

        {/* STEP 1 */}
        {!otpSent && (
          <>
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button onClick={handleSendOtp} className="w-full mt-4">
              Send OTP
            </Button>
          </>
        )}

        {/* STEP 2 */}
        {otpSent && (
          <form onSubmit={handleReset} className="space-y-4">

            <div>
              <Label>OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
              />

              {/* ⏱ TIMER */}
              <p className="text-xs text-gray-500 mt-1">
                {canResend
                  ? "OTP expired"
                  : `Valid for ${timer}s`}
              </p>

              {/* 🔁 RESEND */}
              {canResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-red-500 text-xs mt-1 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* New Password */}
            <div className="relative">
              <Label>New Password</Label>
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[38px]"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm */}
            <div className="relative">
              <Label>Confirm Password</Label>
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[38px]"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full">
              Update Password
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}