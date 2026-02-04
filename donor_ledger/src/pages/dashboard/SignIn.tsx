import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import "./otp.css";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpMode && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [otpMode, timer]);

  // Sign In → Send OTP
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !accountType) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, accountType }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        toast.success("OTP sent to your email!");
        setOtpMode(true);
        setTimer(60);
        setCanResend(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoading(false);
      toast.error("Server error. Please try again.");
      console.error(err);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setCanResend(false);
      setTimer(60);
      const res = await fetch("http://localhost:5000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, accountType }),
      });
      const data = await res.json();
      if (res.ok) toast.success("New OTP sent to your email!");
      else toast.error(data.message || "Failed to resend OTP");
    } catch {
      toast.error("Error resending OTP");
    }
  };

  // OTP input handling
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = e.target.value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < otp.length - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "Enter") handleOtpSubmit();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(paste)) {
      setOtp(paste.split(""));
      otpRefs.current[3]?.focus();
    } else {
      toast.error("Please paste a valid 4-digit OTP");
    }
  };

  // Verify OTP
  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      toast.error("Enter 4-digit OTP");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();

                if (res.ok) {
            toast.success("Login successful!");

            const normalizedType =
              data.accountType?.toLowerCase() === "hospital" ||
              data.accountType?.toLowerCase() === "hospital admin"
                ? "Hospital Admin"
                : data.accountType;

                

            // ✅ Store auth data with consistent keys
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("email", data.email);
            localStorage.setItem("fullName", data.fullName);      // ⭐ add this
            localStorage.setItem("accountType", normalizedType);


            navigate("/dashboard");
            


      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary rounded-lg p-2">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">LifeLink</span>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          {!otpMode ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/ForgotPassword"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <select
                  id="accountType"
                  className="w-full mt-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="Donor">Donor</option>
                  <option value="Recipient">Recipient</option>
                  <option value="Hospital Admin">Hospital Admin</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-6"
            >
              <h2 className="text-xl font-semibold">Enter 4-Digit OTP</h2>
              <div className="flex gap-3">
                {otp.map((digit, idx) => (
                  <Input
                    key={idx}
                    maxLength={1}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    className="w-12 text-center text-xl font-bold"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                  />
                ))}
              </div>

              <Button onClick={handleOtpSubmit} className="w-full">
                Verify OTP
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-3">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    className="text-primary font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span>Resend OTP in {timer}s</span>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
