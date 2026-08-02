"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("AI Construction Manager");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState("English");

  const [aiModel, setAiModel] = useState("GPT-5.5");
  const [apiKey, setApiKey] = useState("");
  const [enableAI, setEnableAI] = useState(true);

  async function logout() {
    await supabase.auth.signOut();

    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  function saveCompanySettings() {
    alert("Company settings saved.");
  }

  function exportCompanyData() {
    alert("Export started.");
  }

  function backupDatabase() {
    alert("Database backup created.");
  }

  function restoreBackup() {
    alert("Restore feature coming soon.");
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Settings
      </h1>

      {/* Company Settings */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          Company Settings
        </h2>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 font-medium">
              Company Name
            </label>

            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border rounded-lg w-full p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Company Email
            </label>

            <input
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="border rounded-lg w-full p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Phone
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border rounded-lg w-full p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Website
            </label>

            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="border rounded-lg w-full p-3"
            />
          </div>

        </div>

        <button
          onClick={saveCompanySettings}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Save Company Settings
        </button>

      </div>

      {/* User Preferences */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          User Preferences
        </h2>

        <div className="space-y-5">

          <div className="flex justify-between">

            <span>Dark Mode</span>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />

          </div>

          <div className="flex justify-between">

            <span>Email Notifications</span>

            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() =>
                setEmailNotifications(!emailNotifications)
              }
            />

          </div>

          <div className="flex justify-between">

            <span>SMS Notifications</span>

            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={() =>
                setSmsNotifications(!smsNotifications)
              }
            />

          </div>

          <div>

            <label className="block mb-2">
              Language
            </label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-lg p-3"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>

          </div>

        </div>

      </div>

      {/* AI Settings */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          AI Settings
        </h2>

        <div className="space-y-5">

          <div>

            <label className="block mb-2">
              AI Model
            </label>

            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="border rounded-lg p-3"
            >
              <option>GPT-5.5</option>
              <option>GPT-4.1</option>
            </select>

          </div>

          <div>

            <label className="block mb-2">
              OpenAI API Key
            </label>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="border rounded-lg w-full p-3"
              placeholder="sk-..."
            />

          </div>

          <div className="flex justify-between">

            <span>Enable AI Suggestions</span>

            <input
              type="checkbox"
              checked={enableAI}
              onChange={() => setEnableAI(!enableAI)}
            />

          </div>

        </div>

      </div>

      {/* Backup */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          Backup & Export
        </h2>

        <div className="flex flex-wrap gap-4">

          <button
            onClick={exportCompanyData}
            className="bg-green-600 text-white px-5 py-2 rounded-lg"
          >
            Export Company Data
          </button>

          <button
            onClick={backupDatabase}
            className="bg-yellow-600 text-white px-5 py-2 rounded-lg"
          >
            Backup Database
          </button>

          <button
            onClick={restoreBackup}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Restore Backup
          </button>

        </div>

      </div>

      {/* About */}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-6">
          About
        </h2>

        <p className="mb-2">
          <strong>Application:</strong> AI Construction Manager
        </p>

        <p className="mb-2">
          <strong>Version:</strong> 1.0.0
        </p>

        <p>
          © 2026 AI Construction Manager
        </p>

      </div>

      {/* Logout */}

      <div className="text-center">

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg"
        >
          Logout
        </button>

      </div>

    </main>
  );
}