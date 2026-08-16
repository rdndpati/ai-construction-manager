"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateCompanyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // CHECK LOGIN + EXISTING COMPANY
  // =========================================================

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        // Check profile
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error("PROFILE CHECK ERROR:", profileError);

          setError(
            "Unable to check your company information. Please try again."
          );

          return;
        }

        // User already belongs to a company
        if (profile?.company_id) {
          router.replace("/app/dashboard");
          return;
        }

      } catch (err) {
        console.error("CHECK USER ERROR:", err);

        setError(
          "Unable to verify your account. Please log in again."
        );
      } finally {
        setChecking(false);
      }
    }

    checkUser();
  }, [router]);

  // =========================================================
  // CREATE COMPANY
  // =========================================================

  async function createCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");

    // Basic validation
    if (!name.trim()) {
      setError("Please enter your company name.");
      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------------------
      // Get logged-in user
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("USER ERROR:", userError);

        setError(
          "Unable to verify your account. Please log in again."
        );

        return;
      }

      if (!user) {
        setError(
          "Your session has expired. Please log in again."
        );

        router.replace("/login");

        return;
      }

      console.log(
        "Creating company for user:",
        user.id
      );

      // -----------------------------------------------------
      // Double-check profile before creating company
      // -----------------------------------------------------

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfileError) {
        console.error(
          "EXISTING PROFILE ERROR:",
          existingProfileError
        );

        setError(
          "Unable to verify your company profile."
        );

        return;
      }

      // If already connected, don't create another company
      if (existingProfile?.company_id) {
        router.replace("/app/dashboard");
        router.refresh();

        return;
      }

      // -----------------------------------------------------
      // Create company
      // -----------------------------------------------------

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .insert({
          name: name.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) {
        console.error(
          "COMPANY CREATE ERROR:",
          companyError
        );

        setError(
          `Could not create company: ${companyError.message}`
        );

        return;
      }

      if (!company) {
        setError(
          "Company was not created. Please try again."
        );

        return;
      }

      console.log(
        "COMPANY CREATED:",
        company
      );

      // -----------------------------------------------------
      // Connect profile to company
      // -----------------------------------------------------

      const {
        data: updatedProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          company_id: company.id,
          is_owner: true,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) {
        console.error(
          "PROFILE UPDATE ERROR:",
          profileError
        );

        setError(
          `Company was created, but your profile could not be connected. ${profileError.message}`
        );

        return;
      }

      console.log(
        "PROFILE UPDATED:",
        updatedProfile
      );

      // -----------------------------------------------------
      // Success
      // -----------------------------------------------------

      alert("Company created successfully!");

      router.replace("/app/dashboard");
      router.refresh();

    } catch (err: any) {
      console.error(
        "CREATE COMPANY ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while creating the company."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Checking your account...
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* =================================================
            BRAND
        ================================================= */}

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

        {/* =================================================
            CARD
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create Your Company
            </h2>

            <p className="text-gray-500 mt-2">
              Set up your company before creating
              construction projects.
            </p>

          </div>

          <form
            onSubmit={createCompany}
            className="space-y-5"
          >

            {/* =================================================
                COMPANY NAME
            ================================================= */}

            <div>

              <label
                htmlFor="companyName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Company Name
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <input
                id="companyName"
                type="text"
                required
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="ABC Construction"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>

            {/* =================================================
                ADDRESS
            ================================================= */}

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
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="123 Main Street, Memphis, TN"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>

            {/* =================================================
                PHONE
            ================================================= */}

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
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="(901) 555-1234"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>

            {/* =================================================
                WEBSITE
            ================================================= */}

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
                value={website}
                onChange={(e) =>
                  setWebsite(e.target.value)
                }
                placeholder="https://www.example.com"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>

              </div>

            )}

            {/* =================================================
                INFO
            ================================================= */}

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">

              <p className="text-sm text-blue-700">
                You will become the owner of this company
                and can invite additional team members
                later.
              </p>

            </div>

            {/* =================================================
                CREATE BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Creating Company...

                </span>
              ) : (
                "Create Company"
              )}

            </button>

          </form>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 AI Construction Manager
        </p>

      </div>

    </main>
  );
}