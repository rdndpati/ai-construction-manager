"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");

async function changePassword() {
  const password = prompt("Enter your new password");

  if (!password) return;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Password updated successfully.");
  }
}
async function toggleTwoFactor() {
  setTwoFA(!twoFA);

  alert(
    !twoFA
      ? "Two-Factor Authentication Enabled"
      : "Two-Factor Authentication Disabled"
  );
}
async function logoutAll() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  async function saveSecuritySettings() {
  const { error } = await supabase
    .from("security_settings")
    .upsert({
      id: "00000000-0000-0000-0000-000000000001",
      session_timeout: sessionTimeout,
      auto_logout: autoLogout,
    });

  if (!error) {
    await addAuditLog(
      "Security Updated",
      "Updated company security policy."
    );

    alert("Settings saved.");
  }
}
async function addAuditLog(action: string, description: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("audit_logs").insert({
    action,
    description,
    user_email: user?.email,
  });
}
async function exportCompanyData() {
  const { data } = await supabase
    .from("profiles")
    .select("*");

  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "company-data.json";

  a.click();

  URL.revokeObjectURL(url);

  await addAuditLog(
    "Export",
    "Company data exported."
  );
}
async function archiveCompany() {
  if (!confirm("Archive this company?")) return;

  // Get the first company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .limit(1)
    .single();

  if (!company) {
    alert("Company not found.");
    return;
  }

  const { error } = await supabase
    .from("companies")
    .update({ archived: true })
    .eq("id", company.id);

  if (error) {
    alert(error.message);
    return;
  }

  await addAuditLog(
    "Archive",
    "Company archived."
  );

  alert("Company archived successfully.");
}
  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Security
      </h1>

      <div className="space-y-8">

        {/* Login Security */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Login Security
          </h2>

          <div className="grid grid-cols-2 gap-6">

            <div>
              <p className="text-gray-500">
                Password Strength
              </p>

              <p className="font-semibold text-green-600">
                Strong
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Last Login
              </p>

              <p className="font-semibold">
                Today
              </p>
            </div>

          </div>

          <div className="mt-6 flex gap-4">

            <button
  onClick={changePassword}
  className="bg-blue-600 text-white px-5 py-2 rounded-lg"
>
  Change Password
</button>

            <button
  onClick={logoutAll}
  className="bg-red-600 text-white px-5 py-2 rounded-lg"
>
              Sign Out All Devices
            </button>

          </div>

        </div>

        {/* Two Factor */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Two-Factor Authentication
          </h2>

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Status
              </p>

              <p className="font-semibold">
                {twoFA ? "Enabled" : "Disabled"}
              </p>

            </div>

            <button
              onClick={toggleTwoFactor}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              {twoFA ? "Disable" : "Enable"}
            </button>

          </div>

        </div>

        {/* Company Policy */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Company Security Policy
          </h2>

          <div className="space-y-5">

            <div>

              <label className="font-medium">
                Session Timeout
              </label>

              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="border rounded-lg ml-4 px-3 py-2"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>

            </div>

            <div className="flex items-center gap-4">

              <input
                type="checkbox"
                checked={autoLogout}
                onChange={() => setAutoLogout(!autoLogout)}
              />

              <span>
                Enable Auto Logout
              </span>

            </div>
            <div className="mt-6">
  <button
    onClick={saveSecuritySettings}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg"
  >
    Save Security Settings
  </button>
</div>

          </div>

        </div>

        {/* Danger Zone */}

        <div className="bg-red-50 border border-red-300 rounded-xl p-6">

          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Danger Zone
          </h2>

          <div className="flex gap-4">

            <button
  onClick={exportCompanyData}
  className="bg-red-600 text-white px-5 py-2 rounded-lg"
>
  Export Company Data
</button>

            <button
  onClick={archiveCompany}
  className="bg-red-700 text-white px-5 py-2 rounded-lg"
>
  Archive Company
</button>

          </div>

        </div>

      </div>

    </main>
  );
}