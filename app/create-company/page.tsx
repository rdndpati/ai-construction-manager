"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateCompanyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("USER ERROR:", userError);
        setError("Unable to verify your account. Please log in again.");
        return;
      }

      if (!user) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      console.log("Creating company for user:", user.id);

      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          website: website.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) {
        console.error("COMPANY ERROR:", companyError);
        setError(companyError.message);
        return;
      }

      console.log("COMPANY CREATED:", company);

      // Connect user's profile to the company
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_id: company.id,
          is_owner: true,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("PROFILE UPDATE ERROR:", profileError);

        // Company was created but profile was not connected.
        setError(
          "Company was created, but we could not connect your account to it. Please contact support."
        );

        return;
      }

      console.log("PROFILE UPDATED SUCCESSFULLY");

      // Go to dashboard
      router.replace("/app/dashboard");
      router.refresh();

    } catch (err) {
      console.error("CREATE COMPANY ERROR:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg">
            🏗️
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            AI Construction Manager
          </h1>

          <p className="text-gray-500 mt-2">
            Engineering Project Management Platform
          </p>

        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create Your Company
            </h2>

            <p className="text-gray-500 mt-2">
              Set up your company before creating construction projects.
            </p>

          </div>

          <form onSubmit={createCompany} className="space-y-5">

            {/* Company Name */}
            <div>

              <label
                htmlFor="companyName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Company Name
              </label>

              <input
                id="companyName"
                type="text"
                required
                placeholder="ABC Construction"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Address */}
            <div>

              <label
                htmlFor="address"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Company Address
              </label>

              <input
                id="address"
                type="text"
                placeholder="123 Main Street, Memphis, TN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Phone */}
            <div>

              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Company Phone
              </label>

              <input
                id="phone"
                type="tel"
                placeholder="(901) 555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Website */}
            <div>

              <label
                htmlFor="website"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Company Website
              </label>

              <input
                id="website"
                type="url"
                placeholder="https://www.example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              You will become the owner of this company and can invite
              additional team members later.
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Company..." : "Create Company"}
            </button>

          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 AI Construction Manager
        </p>

      </div>

    </main>
  );
}