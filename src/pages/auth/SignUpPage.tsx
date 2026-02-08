import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@/components/ui";
import api from "@/api/axios";
import toast from "react-hot-toast";

const CITIES = ["Addis Ababa", "Adama", "Mekelle", "Hawassa", "Dire Dawa", "Bahir Dar", "Jimma"];

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const SignUpPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'parent' | 'child'>('parent');

  const [parentData, setParentData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    city: "",
  });

  const [childData, setChildData] = useState({
    name: "",
    gender: "Male",
    date_of_birth: "",
    weight: "",
    height: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateParentStep = () => {
    const newErrors: Record<string, string> = {};

    if (!parentData.firstName) newErrors.firstName = "First name is required";
    if (!parentData.phone) newErrors.phone = "Phone number is required";
    if (!parentData.password || parentData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateChildStep = () => {
    const newErrors: Record<string, string> = {};

    if (!childData.name) newErrors.childName = "Child's name is required";
    if (!childData.date_of_birth) newErrors.dob = "Date of birth is required";
    if (!childData.weight) newErrors.weight = "Weight is required";
    if (!childData.height) newErrors.height = "Height is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateParentStep()) {
      setStep('child');
    }
  };

  const handleSignUp = async () => {
    if (!validateChildStep()) return;

    try {
      setLoading(true);

      // Create user first
      const userResponse = await api.post("/users/create", {
        ...parentData,
        role: "PARENT",
      });

      // Then create child
      await api.post("/children/create", {
        parentId: userResponse.data.id,
        name: childData.name,
        gender: childData.gender,
        date_of_birth: childData.date_of_birth,
        weight: parseFloat(childData.weight),
        height: parseFloat(childData.height),
        activity_level: "Moderate",
      });

      toast.success("Account created successfully!");
      navigate("/signin");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Quicksand']">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-10 px-4 py-4 flex items-center gap-4 border-b border-slate-100">
        <button
          onClick={() => step === 'child' ? setStep('parent') : navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <BackIcon />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500">
            Step {step === 'parent' ? '1' : '2'} of 2 - {step === 'parent' ? 'Your Details' : 'Child Details'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          <div className={`flex-1 h-1.5 rounded-full ${step === 'parent' ? 'bg-sky-500' : 'bg-sky-500'}`}></div>
          <div className={`flex-1 h-1.5 rounded-full ${step === 'child' ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6 pb-32">
        {step === 'parent' ? (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome!</h2>
              <p className="text-slate-500">Let's set up your account</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="John"
                value={parentData.firstName}
                onChange={(e) => setParentData({ ...parentData, firstName: e.target.value })}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={parentData.lastName}
                onChange={(e) => setParentData({ ...parentData, lastName: e.target.value })}
              />
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+251912345678"
              value={parentData.phone}
              onChange={(e) => setParentData({ ...parentData, phone: e.target.value })}
              error={errors.phone}
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={parentData.password}
              onChange={(e) => setParentData({ ...parentData, password: e.target.value })}
              error={errors.password}
            />

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
                City
              </label>
              <select
                value={parentData.city}
                onChange={(e) => setParentData({ ...parentData, city: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium outline-none focus:border-sky-400 transition-colors"
              >
                <option value="">Select your city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <Button
                color="sky"
                fullWidth
                size="lg"
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👶</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Child Details</h2>
              <p className="text-slate-500">Tell us about your little one</p>
            </div>

            <Input
              label="Child's Name"
              placeholder="Enter child's name"
              value={childData.name}
              onChange={(e) => setChildData({ ...childData, name: e.target.value })}
              error={errors.childName}
            />

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Male", "Female"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setChildData({ ...childData, gender })}
                    className={`py-4 rounded-2xl border text-sm font-bold transition-all ${
                      childData.gender === gender
                        ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'
                    }`}
                  >
                    {gender === "Male" ? "👦 " : "👧 "}{gender}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={childData.date_of_birth}
                onChange={(e) => setChildData({ ...childData, date_of_birth: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium outline-none focus:border-sky-400 transition-colors"
              />
              {errors.dob && <p className="mt-2 text-sm text-rose-500 ml-1">{errors.dob}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Weight (kg)"
                type="number"
                placeholder="e.g. 12"
                value={childData.weight}
                onChange={(e) => setChildData({ ...childData, weight: e.target.value })}
                error={errors.weight}
              />
              <Input
                label="Height (cm)"
                type="number"
                placeholder="e.g. 85"
                value={childData.height}
                onChange={(e) => setChildData({ ...childData, height: e.target.value })}
                error={errors.height}
              />
            </div>

            <div className="pt-4">
              <Button
                color="sky"
                fullWidth
                size="lg"
                onClick={handleSignUp}
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        <div className="text-center pt-6">
          <p className="text-slate-500 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="text-sky-500 font-bold hover:text-sky-600 transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
