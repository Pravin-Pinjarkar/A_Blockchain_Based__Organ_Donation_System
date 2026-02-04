import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    aadhaar: "",
    accountType: "",
    bloodType: "",
    dateOfBirth: "",
    age: "",
    organName: "",
    status: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.accountType !== "hospital" && !/^\d{12}$/.test(formData.aadhaar)) {
      toast.error("Invalid Aadhaar number. It must be 12 digits.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Invalid phone number. It must be 10 digits.");
      return;
    }

    const ageValue = Number(formData.age);
    if (isNaN(ageValue) || ageValue <= 0) {
      toast.error("Invalid age. Please enter a positive number.");
      return;
    }

    if (formData.accountType === "recipient" && !formData.status) {
      toast.error("Please select urgency status");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const normalizedType =
        formData.accountType.toLowerCase() === "hospital" ||
        formData.accountType.toLowerCase() === "hospital admin"
          ? "Hospital Admin"
          : formData.accountType;

      const payload = {
        ...formData,
        accountType: normalizedType,
        status: formData.accountType === "recipient" ? formData.status : null,
      };

      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 200 || res.status === 201) {
        toast.success("Your Account Created Successfully!");
        navigate("/signin");
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (error) {
      toast.error("Server error. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary rounded-lg p-2">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">LifeLink</span>
          </div>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">Join LifeLink</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your account to start saving lives
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">

            <div>
              <Label>Full Name</Label>
              <Input placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input placeholder="Enter your email address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input placeholder="10-digit phone number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            {formData.accountType !== "hospital" && (
              <div>
                <Label>Aadhaar</Label>
                <Input placeholder="Enter 12-digit Aadhaar"
                  maxLength={12}
                  value={formData.aadhaar}
                  onChange={(e) =>
                    setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
            )}

            <div>
              <Label>Account Type</Label>
              <Select value={formData.accountType} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="recipient">Recipient</SelectItem>
                  <SelectItem value="hospital">Hospital Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.accountType !== "hospital" && (
              <div>
                <Label>Organ Name</Label>
                <Input placeholder="Which organ are you donating/receiving?"
                  value={formData.organName}
                  onChange={(e) => setFormData({ ...formData, organName: e.target.value })}
                />
              </div>
            )}

            {formData.accountType === "recipient" && (
              <div>
                <Label>Urgency Status</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Age</Label>
              <Input placeholder="Enter your age"
                type="number"
                min="1"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            {formData.accountType !== "hospital" && (
              <div>
                <Label>Blood Type</Label>
                <Select value={formData.bloodType} onValueChange={(value) => setFormData({ ...formData, bloodType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Date of Birth</Label>
              <Input placeholder="dd-mm-yyyy"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Label>Password</Label>
              <Input placeholder="Create a strong password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Label>Confirm Password</Label>
              <Input placeholder="Re-enter your password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[38px]">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full">Create Account</Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/signin" className="text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
