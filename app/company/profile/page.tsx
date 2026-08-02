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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    setCompanyId(profile.company_id);

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();

    if (!company) return;

    setName(company.name || "");
    setWebsite(company.website || "");
    setPhone(company.phone || "");
    setEmail(company.email || "");
    setAddress(company.address || "");
  }

 async function saveCompany() {
  console.log("Save button clicked");
  console.log("Company ID:", companyId);
console.log({
  name,
  website,
  phone,
  email,
  address,
});

  setLoading(true);

  const { data, error } = await supabase
    .from("companies")
    .update({
      name,
      website,
      phone,
      email,
      address,
    })
    .eq("id", companyId)
    .select();

  console.log("Company:", data);
  console.log("Error:", error);

  if (error) {
    alert(error.message);
    setLoading(false);
    return;
  }

  setSuccess("Company saved successfully.");
  setLoading(false);
}
  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        Company Profile
      </h1>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="font-semibold">Company Name</label>
            <input
  className="w-full border rounded-lg p-3 mt-2"
  placeholder="ABC Construction"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
          </div>

          <div>
            <label className="font-semibold">Website</label>
            <input
  className="w-full border rounded-lg p-3 mt-2"
  placeholder="https://company.com"
  value={website}
  onChange={(e) => setWebsite(e.target.value)}
/>
          </div>

          <div>
            <label className="font-semibold">Phone</label>
            <input
  className="w-full border rounded-lg p-3 mt-2"
  placeholder="+1 901-555-1234"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>
          </div>

          <div>
            <label className="font-semibold">Email</label>
            <input
  className="w-full border rounded-lg p-3 mt-2"
  placeholder="info@company.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold">Address</label>
            <textarea
  className="w-full border rounded-lg p-3 mt-2"
  rows={4}
  placeholder="Company Address"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
/>
          </div>

        </div>

       <button
  onClick={saveCompany}
  disabled={loading}
  className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg"
>
  {loading ? "Saving..." : "Save Company"}
</button>

      </div>
    </main>
  );
}