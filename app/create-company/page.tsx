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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        address,
        phone,
        website,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        company_id: data.id,
        is_owner: true,
      })
      .eq("user_id", user.id);

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8">

        <h1 className="text-3xl font-bold mb-2">
          Create Company
        </h1>

        <p className="text-gray-500 mb-8">
          Set up your company before creating projects.
        </p>

        <form onSubmit={createCompany} className="space-y-5">

          <input
            required
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            placeholder="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          {error && (
            <div className="text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg p-3"
          >
            {loading ? "Creating..." : "Create Company"}
          </button>

        </form>
      </div>
    </main>
  );
}