"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CompanyProfilePage() {
  const [companyId, setCompanyId] = useState("");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    setLoading(true);
    setError("");

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in again.");
        return;
      }

      // Get user's company
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setError("Unable to load your company.");
        return;
      }

      if (!profile?.company_id) {
        setError("No company is assigned to your account.");
        return;
      }

      setCompanyId(profile.company_id);

      // Get company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (companyError) {
        console.error("COMPANY ERROR:", companyError);
        setError("Unable to load company information.");
        return;
      }

      if (!company) {
        setError("Company not found.");
        return;
      }

      setName(company.name || "");
      setWebsite(company.website || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setAddress(company.address || "");
    } catch (err) {
      console.error("LOAD COMPANY ERROR:", err);
      setError("Something went wrong while loading the company.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCompany() {
    if (!companyId) {
      setError("Company ID is missing.");
      return;
    }

    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: name.trim(),
          website: website.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        })
        .eq("id", companyId);

      if (error) {
        console.error("SAVE COMPANY ERROR:", error);
        setError(error.message);
        return;
      }

      setSuccess("Company information updated successfully.");
      setEditing(false);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setError("Unable to save company information.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
    setSuccess("");

    // Reload original values from database
    loadCompany();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-gray-500">
              Loading company information...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Company
            </h1>

            <p className="text-gray-500 mt-2">
              Manage your company information and profile.
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-sm"
            >
              ✏️ Edit Company
            </button>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
            ✓ {success}
          </div>
        )}

        {!editing ? (

          /* =========================
             COMPANY OVERVIEW
          ========================== */

          <div className="space-y-6">

            {/* Company Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

              <div className="flex flex-col md:flex-row md:items-center gap-6">

                {/* Company Icon */}
                <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl">
                  🏢
                </div>

                <div className="flex-1">

                  <h2 className="text-3xl font-bold text-gray-900">
                    {name || "Company Name"}
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Construction & Engineering Company
                  </p>

                </div>

                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Active
                </div>

              </div>

            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Phone */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    📞 Phone
                  </p>

                  <p className="text-lg font-semibold text-gray-900">
                    {phone || "Not provided"}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    ✉️ Email
                  </p>

                  <p className="text-lg font-semibold text-gray-900">
                    {email || "Not provided"}
                  </p>
                </div>

                {/* Website */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    🌐 Website
                  </p>

                  {website ? (
                    <a
                      href={
                        website.startsWith("http")
                          ? website
                          : `https://${website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {website}
                    </a>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">
                      Not provided
                    </p>
                  )}
                </div>

                {/* Company ID */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    🆔 Company ID
                  </p>

                  <p className="text-sm font-mono text-gray-700 break-all">
                    {companyId}
                  </p>
                </div>

                {/* Address */}
                <div className="md:col-span-2">

                  <p className="text-sm font-medium text-gray-500 mb-2">
                    📍 Address
                  </p>

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">

                    <p className="text-gray-800 whitespace-pre-line">
                      {address || "No address provided."}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Company Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                <div className="text-3xl mb-3">
                  📁
                </div>

                <p className="text-gray-500">
                  Projects
                </p>

                <p className="text-3xl font-bold mt-2">
                  —
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  View from Projects
                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                <div className="text-3xl mb-3">
                  👥
                </div>

                <p className="text-gray-500">
                  Team Members
                </p>

                <p className="text-3xl font-bold mt-2">
                  —
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  Team management
                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                <div className="text-3xl mb-3">
                  🔐
                </div>

                <p className="text-gray-500">
                  Company Status
                </p>

                <p className="text-xl font-bold text-green-600 mt-2">
                  Active
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  Account is active
                </p>

              </div>

            </div>

          </div>

        ) : (

          /* =========================
             EDIT COMPANY
          ========================== */

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-gray-900">
                Edit Company Information
              </h2>

              <p className="text-gray-500 mt-2">
                Update your company's information below.
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Company Name */}
              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Company Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ABC Construction"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Website */}
              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Website
                </label>

                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Phone */}
              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Phone
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 901-555-1234"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Email */}
              <div>

                <label className="block font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@company.com"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Address */}
              <div className="md:col-span-2">

                <label className="block font-semibold text-gray-700 mb-2">
                  Address
                </label>

                <textarea
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Company Address"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-8">

              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCompany}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}