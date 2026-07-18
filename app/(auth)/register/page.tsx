"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "consent">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    class: 9,
    schoolName: "",
    parentPhone: "",
  });

  const [studentId, setStudentId] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setStudentId(data.studentId);
      setStep("consent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = async (otp: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Consent verification failed");
      }

      // Store studentId in localStorage
      localStorage.setItem("antraai_student_id", studentId);
      localStorage.setItem("antraai_student_name", form.name);
      localStorage.setItem("antraai_student_class", String(form.class));

      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === "consent") {
    return <ConsentStep onSubmit={handleConsent} loading={loading} error={error} />;
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Antra<span className="text-secondary">AI</span>
          </h1>
          <p className="text-muted mt-2">Create your student account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                value={form.class}
                onChange={(e) =>
                  setForm({ ...form, class: Number(e.target.value) as 9 | 10 })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={9}>Class 9</option>
                <option value={10}>Class 10</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                required
                value={form.schoolName}
                onChange={(e) =>
                  setForm({ ...form, schoolName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your school name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent&apos;s Mobile Number
              </label>
              <input
                type="tel"
                required
                value={form.parentPhone}
                onChange={(e) =>
                  setForm({ ...form, parentPhone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
              />
              <p className="text-xs text-muted mt-1">
                We&apos;ll send an OTP to verify parental consent
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function ConsentStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (otp: string) => void;
  loading: boolean;
  error: string;
}) {
  const [otp, setOtp] = useState("");

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Antra<span className="text-secondary">AI</span>
          </h1>
          <p className="text-muted mt-2">Parental Consent Verification</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-sm text-gray-600">
              An OTP has been sent to your parent&apos;s mobile number.
              Please enter it below to verify consent.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter OTP"
              maxLength={6}
            />

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={() => onSubmit(otp)}
              disabled={loading || otp.length < 4}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>

          <div className="mt-4 text-xs text-muted text-center">
            <p>For this demo, use OTP: <strong>123456</strong></p>
          </div>
        </div>
      </div>
    </main>
  );
}
