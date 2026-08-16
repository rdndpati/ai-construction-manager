"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Settings = {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  phone: string;
  website: string;

  emailNotifications: boolean;
  smsNotifications: boolean;
  deadlineNotifications: boolean;
  rfiNotifications: boolean;
  submittalNotifications: boolean;

  darkMode: boolean;

  defaultRfiPriority: string;
  defaultSubmittalPriority: string;
  defaultProjectView: string;

  language: string;
  timezone: string;
};

const defaultSettings: Settings = {
  companyName: "",
  companyEmail: "",
  companyAddress: "",
  phone: "",
  website: "",

  emailNotifications: true,
  smsNotifications: false,
  deadlineNotifications: true,
  rfiNotifications: true,
  submittalNotifications: true,

  darkMode: false,

  defaultRfiPriority: "Medium",
  defaultSubmittalPriority: "Medium",
  defaultProjectView: "List",

  language: "English",
  timezone: "America/Chicago",
};

export default function SettingsPage() {
  const router = useRouter();

  const [activeSection, setActiveSection] =
    useState("company");

  const [settings, setSettings] =
    useState<Settings>(defaultSettings);

  const [userEmail, setUserEmail] =
    useState("");

  const [companyId, setCompanyId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [canEditCompany, setCanEditCompany] =
    useState(false);

  // =========================================================
  // NEW:
  // Company Profile starts in VIEW mode.
  // It only becomes editable after clicking Edit.
  // =========================================================

  const [isEditingCompany, setIsEditingCompany] =
    useState(false);

  // =========================================================
  // LOAD SETTINGS
  // =========================================================

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      // -------------------------------------------------------
      // Get logged-in user
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "");

      // -------------------------------------------------------
      // Get profile
      // -------------------------------------------------------

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            `
              id,
              company_id,
              is_owner,
              roles (
                name
              )
            `
          )
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "PROFILE LOAD ERROR:",
          profileError
        );

        setError(
          "Unable to load your company profile."
        );

        return;
      }

      if (!profile?.company_id) {
        router.replace("/create-company");
        return;
      }

      setCompanyId(profile.company_id);

      // -------------------------------------------------------
      // Determine role
      // -------------------------------------------------------

      const roleData = profile.roles as unknown as
        | { name: string }
        | { name: string }[]
        | null;

      const roleName = Array.isArray(roleData)
        ? roleData[0]?.name
        : roleData?.name;

      const isOwner =
        profile.is_owner === true;

      const isAdmin =
        roleName === "Admin";

      setCanEditCompany(
        isOwner || isAdmin
      );

      // -------------------------------------------------------
      // Get company from Supabase
      // -------------------------------------------------------

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select(
          "id, name, address, phone, website"
        )
        .eq("id", profile.company_id)
        .single();

      if (companyError) {
        console.error(
          "COMPANY LOAD ERROR:",
          companyError
        );

        setError(
          companyError.message ||
            "Unable to load company information."
        );

        return;
      }

      if (!company) {
        setError(
          "Company information could not be found."
        );

        return;
      }

      // -------------------------------------------------------
      // Load saved preferences from localStorage
      // -------------------------------------------------------

      let savedPreferences: Partial<Settings> = {};

      try {
        const saved =
          localStorage.getItem(
            "construction-manager-settings"
          );

        if (saved) {
          savedPreferences =
            JSON.parse(saved);
        }
      } catch (storageError) {
        console.error(
          "LOCAL STORAGE ERROR:",
          storageError
        );
      }

      // -------------------------------------------------------
      // IMPORTANT:
      // Company information comes from Supabase.
      // Preferences come from localStorage.
      // -------------------------------------------------------

      setSettings({
        ...defaultSettings,

        ...savedPreferences,

        companyName:
          company.name ?? "",

        companyAddress:
          company.address ?? "",

        phone:
          company.phone ?? "",

        website:
          company.website ?? "",

        companyEmail:
          savedPreferences.companyEmail ??
          user.email ??
          "",
      });

      // -------------------------------------------------------
      // Always start in VIEW mode
      // -------------------------------------------------------

      setIsEditingCompany(false);
    } catch (err) {
      console.error(
        "SETTINGS LOAD ERROR:",
        err
      );

      setError(
        "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // START EDITING COMPANY
  // =========================================================

  function startEditingCompany() {
    if (!canEditCompany) {
      setError(
        "You do not have permission to edit the company profile."
      );

      return;
    }

    setMessage("");
    setError("");
    setIsEditingCompany(true);
  }

  // =========================================================
  // CANCEL COMPANY EDIT
  // =========================================================

  async function cancelCompanyEdit() {
    setMessage("");
    setError("");

    // Reload the actual saved company values
    // so any unsaved changes disappear.
    await loadCompanyOnly();

    setIsEditingCompany(false);
  }

  // =========================================================
  // SAVE COMPANY PROFILE
  // =========================================================

  async function saveCompanyProfile() {
    if (!companyId) {
      setError(
        "Company information is not available."
      );

      return;
    }

    if (!canEditCompany) {
      setError(
        "You do not have permission to edit the company profile."
      );

      return;
    }

    if (!isEditingCompany) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      // -------------------------------------------------------
      // Update company in Supabase
      // -------------------------------------------------------

      const {
        error: updateError,
      } = await supabase
        .from("companies")
        .update({
          name: settings.companyName.trim(),
          address:
            settings.companyAddress.trim(),
          phone: settings.phone.trim(),
          website: settings.website.trim(),
        })
        .eq("id", companyId);

      if (updateError) {
        console.error(
          "COMPANY UPDATE ERROR:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to save company profile."
        );

        return;
      }

      // -------------------------------------------------------
      // Save company email locally
      // -------------------------------------------------------

      try {
        localStorage.setItem(
          "construction-manager-settings",
          JSON.stringify(settings)
        );
      } catch (storageError) {
        console.error(
          "LOCAL STORAGE ERROR:",
          storageError
        );
      }

      // -------------------------------------------------------
      // Reload actual saved values
      // -------------------------------------------------------

      await loadCompanyOnly();

      // -------------------------------------------------------
      // IMPORTANT:
      // Return to VIEW mode after successful save
      // -------------------------------------------------------

      setIsEditingCompany(false);

      setMessage(
        "Company profile saved successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 4000);
    } catch (err) {
      console.error(
        "SAVE COMPANY ERROR:",
        err
      );

      setError(
        "Something went wrong while saving the company profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // RELOAD COMPANY ONLY
  // =========================================================

  async function loadCompanyOnly() {
    if (!companyId) return;

    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select(
        "id, name, address, phone, website"
      )
      .eq("id", companyId)
      .single();

    if (companyError) {
      console.error(
        "RELOAD COMPANY ERROR:",
        companyError
      );

      setError(
        "Unable to reload company information."
      );

      return;
    }

    if (!company) return;

    setSettings((previous) => ({
      ...previous,

      companyName:
        company.name ?? "",

      companyAddress:
        company.address ?? "",

      phone:
        company.phone ?? "",

      website:
        company.website ?? "",
    }));
  }

  // =========================================================
  // SAVE OTHER SETTINGS
  // =========================================================

  function savePreferences() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      localStorage.setItem(
        "construction-manager-settings",
        JSON.stringify(settings)
      );

      setMessage(
        "Settings saved successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "SAVE SETTINGS ERROR:",
        err
      );

      setError(
        "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // UPDATE SETTING
  // =========================================================

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  // =========================================================
  // RESET PREFERENCES
  // =========================================================

  function resetPreferences() {
    const confirmed = window.confirm(
      "Reset your preferences to the default settings?"
    );

    if (!confirmed) return;

    const reset = {
      ...settings,

      emailNotifications: true,
      smsNotifications: false,
      deadlineNotifications: true,
      rfiNotifications: true,
      submittalNotifications: true,

      darkMode: false,

      defaultRfiPriority: "Medium",
      defaultSubmittalPriority: "Medium",
      defaultProjectView: "List",

      language: "English",
      timezone: "America/Chicago",
    };

    setSettings(reset);

    localStorage.setItem(
      "construction-manager-settings",
      JSON.stringify(reset)
    );

    setMessage(
      "Preferences restored to defaults."
    );

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  // =========================================================
  // SIDEBAR
  // =========================================================

  const menuItems = [
    {
      id: "company",
      label: "Company Profile",
      icon: "🏢",
    },
    {
      id: "account",
      label: "My Account",
      icon: "👤",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: "🎨",
    },
    {
      id: "projects",
      label: "Project Preferences",
      icon: "📋",
    },
    {
      id: "security",
      label: "Security",
      icon: "🔐",
    },
    {
      id: "data",
      label: "Data & Backup",
      icon: "💾",
    },
  ];

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-3xl mb-3">
            ⚙️
          </div>

          <p className="text-gray-600">
            Loading your company settings...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-8 py-6">

          <h1 className="text-3xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your company, account,
            notifications, and application preferences.
          </p>

        </div>

      </div>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid grid-cols-12 gap-8">

          {/* ================================================= */}
          {/* SETTINGS MENU */}
          {/* ================================================= */}

          <aside className="col-span-3">

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

              <div className="p-4 border-b">

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Settings
                </p>

              </div>

              <div className="p-2">

                {menuItems.map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMessage("");
                      setError("");
                    }}
                    className={`
                      w-full
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                      rounded-lg
                      text-left
                      transition
                      ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >

                    <span className="text-lg">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>

                  </button>

                ))}

              </div>

              <div className="border-t p-3">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-lg
                    text-red-600
                    hover:bg-red-50
                    text-left
                  "
                >
                  🚪
                  <span>
                    Logout
                  </span>
                </button>

              </div>

            </div>

          </aside>

          {/* ================================================= */}
          {/* CONTENT */}
          {/* ================================================= */}

          <section className="col-span-9">

            {/* ERROR */}

            {error && (

              <div className="
                mb-6
                bg-red-50
                border
                border-red-200
                text-red-700
                rounded-lg
                px-4
                py-3
              ">
                <strong>
                  Error:
                </strong>{" "}
                {error}
              </div>

            )}

            {/* SUCCESS */}

            {message && (

              <div className="
                mb-6
                bg-green-50
                border
                border-green-200
                text-green-700
                rounded-lg
                px-4
                py-3
                font-medium
              ">
                ✓ {message}
              </div>

            )}

            {/* ================================================= */}
            {/* COMPANY PROFILE */}
            {/* ================================================= */}

            {activeSection === "company" && (

              <SettingsCard
                title="Company Profile"
                description="Manage the information displayed for your construction company."
                headerAction={
                  canEditCompany && !isEditingCompany ? (
                    <button
                      type="button"
                      onClick={startEditingCompany}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        border
                        border-gray-300
                        bg-white
                        text-gray-700
                        px-4
                        py-2
                        rounded-lg
                        font-medium
                        hover:bg-gray-50
                        hover:border-gray-400
                        transition
                      "
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                  ) : null
                }
              >

                {/* VIEW MODE MESSAGE */}

                {!isEditingCompany && canEditCompany && (

                  <div className="
                    mb-6
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-gray-500
                  ">
                    <span className="
                      inline-flex
                      items-center
                      justify-center
                      w-5
                      h-5
                      rounded-full
                      bg-green-100
                      text-green-600
                    ">
                      ✓
                    </span>

                    <span>
                      Company information is saved. Click
                      <strong className="mx-1">
                        Edit
                      </strong>
                      to make changes.
                    </span>
                  </div>

                )}

                {/* NON-ADMIN MESSAGE */}

                {!canEditCompany && (

                  <div className="
                    mb-6
                    bg-yellow-50
                    border
                    border-yellow-200
                    text-yellow-700
                    rounded-lg
                    px-4
                    py-3
                    text-sm
                  ">
                    You can view the company profile, but only the
                    company owner or an Admin can edit it.
                  </div>

                )}

                {/* COMPANY FIELDS */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <Input
                    label="Company Name"
                    value={settings.companyName}
                    disabled={
                      !canEditCompany ||
                      !isEditingCompany
                    }
                    onChange={(value) =>
                      updateSetting(
                        "companyName",
                        value
                      )
                    }
                  />

                  <Input
                    label="Company Email"
                    type="email"
                    value={settings.companyEmail}
                    disabled={
                      !canEditCompany ||
                      !isEditingCompany
                    }
                    onChange={(value) =>
                      updateSetting(
                        "companyEmail",
                        value
                      )
                    }
                  />

                  <Input
                    label="Company Address"
                    value={settings.companyAddress}
                    disabled={
                      !canEditCompany ||
                      !isEditingCompany
                    }
                    onChange={(value) =>
                      updateSetting(
                        "companyAddress",
                        value
                      )
                    }
                  />

                  <Input
                    label="Phone"
                    value={settings.phone}
                    disabled={
                      !canEditCompany ||
                      !isEditingCompany
                    }
                    onChange={(value) =>
                      updateSetting(
                        "phone",
                        value
                      )
                    }
                  />

                  <Input
                    label="Website"
                    value={settings.website}
                    disabled={
                      !canEditCompany ||
                      !isEditingCompany
                    }
                    onChange={(value) =>
                      updateSetting(
                        "website",
                        value
                      )
                    }
                  />

                </div>

                {/* INFORMATION BOX */}

                <div className="
                  mt-6
                  rounded-lg
                  bg-gray-50
                  border
                  p-4
                ">

                  <p className="text-sm text-gray-500">
                    Company information is stored in your
                    Supabase company record.
                  </p>

                </div>

                {/* ================================================= */}
                {/* EDIT MODE BUTTONS */}
                {/* ================================================= */}

                {canEditCompany && isEditingCompany && (

                  <div className="
                    mt-8
                    flex
                    justify-end
                    items-center
                    gap-3
                  ">

                    {/* CANCEL */}

                    <button
                      type="button"
                      onClick={cancelCompanyEdit}
                      disabled={saving}
                      className="
                        border
                        border-gray-300
                        bg-white
                        text-gray-700
                        px-5
                        py-3
                        rounded-lg
                        font-medium
                        hover:bg-gray-50
                        disabled:opacity-50
                        transition
                      "
                    >
                      Cancel
                    </button>

                    {/* SAVE */}

                    <button
                      type="button"
                      onClick={saveCompanyProfile}
                      disabled={saving}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        bg-blue-600
                        hover:bg-blue-700
                        disabled:bg-gray-400
                        text-white
                        px-6
                        py-3
                        rounded-lg
                        font-medium
                        transition
                      "
                    >

                      {saving ? (
                        <>
                          <span className="animate-spin">
                            ⟳
                          </span>

                          Saving...
                        </>
                      ) : (
                        <>
                          <span>
                            ✓
                          </span>

                          Save Changes
                        </>
                      )}

                    </button>

                  </div>

                )}

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* ACCOUNT */}
            {/* ================================================= */}

            {activeSection === "account" && (

              <SettingsCard
                title="My Account"
                description="View your account information."
              >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>

                    <input
                      value={userEmail}
                      disabled
                      className="
                        w-full
                        border
                        rounded-lg
                        px-4
                        py-3
                        bg-gray-100
                        text-gray-500
                      "
                    />

                  </div>

                  <Input
                    label="Display Name"
                    value="Rakesh"
                    disabled
                    onChange={() => {}}
                  />

                  <Input
                    label="Role"
                    value="Project Engineer"
                    disabled
                    onChange={() => {}}
                  />

                  <Input
                    label="Department"
                    value="Project Management"
                    disabled
                    onChange={() => {}}
                  />

                </div>

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* NOTIFICATIONS */}
            {/* ================================================= */}

            {activeSection === "notifications" && (

              <SettingsCard
                title="Notifications"
                description="Choose which project events should notify you."
              >

                <Toggle
                  title="Email Notifications"
                  description="Receive important project updates by email."
                  checked={
                    settings.emailNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "emailNotifications",
                      value
                    )
                  }
                />

                <Toggle
                  title="SMS Notifications"
                  description="Receive urgent project notifications by text message."
                  checked={
                    settings.smsNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "smsNotifications",
                      value
                    )
                  }
                />

                <Toggle
                  title="RFI Notifications"
                  description="Notify me when RFIs are created, answered, or updated."
                  checked={
                    settings.rfiNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "rfiNotifications",
                      value
                    )
                  }
                />

                <Toggle
                  title="Submittal Notifications"
                  description="Notify me when submittals change status or require review."
                  checked={
                    settings.submittalNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "submittalNotifications",
                      value
                    )
                  }
                />

                <Toggle
                  title="Due Date Reminders"
                  description="Receive reminders for upcoming RFI and submittal deadlines."
                  checked={
                    settings.deadlineNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "deadlineNotifications",
                      value
                    )
                  }
                />

                <SaveButton
                  saving={saving}
                  onClick={savePreferences}
                />

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* APPEARANCE */}
            {/* ================================================= */}

            {activeSection === "appearance" && (

              <SettingsCard
                title="Appearance"
                description="Customize how the application looks."
              >

                <Toggle
                  title="Dark Mode"
                  description="Use a darker interface throughout the application."
                  checked={settings.darkMode}
                  onChange={(value) =>
                    updateSetting(
                      "darkMode",
                      value
                    )
                  }
                />

                <div className="mt-8">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>

                  <select
                    value={settings.language}
                    onChange={(e) =>
                      updateSetting(
                        "language",
                        e.target.value
                      )
                    }
                    className="
                      border
                      rounded-lg
                      px-4
                      py-3
                      w-full
                      max-w-md
                    "
                  >

                    <option value="English">
                      English
                    </option>

                    <option value="Spanish">
                      Spanish
                    </option>

                  </select>

                </div>

                <div className="mt-6">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>

                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      updateSetting(
                        "timezone",
                        e.target.value
                      )
                    }
                    className="
                      border
                      rounded-lg
                      px-4
                      py-3
                      w-full
                      max-w-md
                    "
                  >

                    <option value="America/Chicago">
                      Central Time
                    </option>

                    <option value="America/New_York">
                      Eastern Time
                    </option>

                    <option value="America/Denver">
                      Mountain Time
                    </option>

                    <option value="America/Los_Angeles">
                      Pacific Time
                    </option>

                  </select>

                </div>

                <SaveButton
                  saving={saving}
                  onClick={savePreferences}
                />

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* PROJECT PREFERENCES */}
            {/* ================================================= */}

            {activeSection === "projects" && (

              <SettingsCard
                title="Project Preferences"
                description="Set default values used when creating project records."
              >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <Select
                    label="Default RFI Priority"
                    value={
                      settings.defaultRfiPriority
                    }
                    options={[
                      "Low",
                      "Medium",
                      "High",
                      "Critical",
                    ]}
                    onChange={(value) =>
                      updateSetting(
                        "defaultRfiPriority",
                        value
                      )
                    }
                  />

                  <Select
                    label="Default Submittal Priority"
                    value={
                      settings.defaultSubmittalPriority
                    }
                    options={[
                      "Low",
                      "Medium",
                      "High",
                      "Critical",
                    ]}
                    onChange={(value) =>
                      updateSetting(
                        "defaultSubmittalPriority",
                        value
                      )
                    }
                  />

                  <Select
                    label="Default Project View"
                    value={
                      settings.defaultProjectView
                    }
                    options={[
                      "List",
                      "Grid",
                    ]}
                    onChange={(value) =>
                      updateSetting(
                        "defaultProjectView",
                        value
                      )
                    }
                  />

                </div>

                <SaveButton
                  saving={saving}
                  onClick={savePreferences}
                />

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* SECURITY */}
            {/* ================================================= */}

            {activeSection === "security" && (

              <SettingsCard
                title="Security"
                description="Manage your account security."
              >

                <div className="
                  border
                  rounded-lg
                  p-5
                  mb-4
                ">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                      <h3 className="font-semibold">
                        Password
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Change your account password.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={async () => {

                        if (!userEmail) {
                          alert(
                            "Unable to determine your email."
                          );

                          return;
                        }

                        const {
                          error,
                        } =
                          await supabase.auth.resetPasswordForEmail(
                            userEmail
                          );

                        if (error) {
                          alert(
                            error.message
                          );

                          return;
                        }

                        alert(
                          "Password reset instructions have been sent to your email."
                        );
                      }}
                      className="
                        border
                        border-gray-300
                        px-4
                        py-2
                        rounded-lg
                        hover:bg-gray-50
                      "
                    >
                      Change Password
                    </button>

                  </div>

                </div>

                <div className="
                  border
                  rounded-lg
                  p-5
                ">

                  <h3 className="font-semibold">
                    Account Session
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Sign out of your current account.
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      mt-4
                      bg-red-600
                      hover:bg-red-700
                      text-white
                      px-5
                      py-2
                      rounded-lg
                    "
                  >
                    Logout
                  </button>

                </div>

              </SettingsCard>

            )}

            {/* ================================================= */}
            {/* DATA */}
            {/* ================================================= */}

            {activeSection === "data" && (

              <SettingsCard
                title="Data & Backup"
                description="Manage your project data and preferences."
              >

                <div className="
                  border
                  rounded-lg
                  p-5
                  mb-4
                ">

                  <h3 className="font-semibold">
                    Export Company Data
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Export your project information
                    for backup or reporting.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        "Data export can be connected to your Supabase project tables."
                      );
                    }}
                    className="
                      mt-4
                      bg-green-600
                      hover:bg-green-700
                      text-white
                      px-5
                      py-2
                      rounded-lg
                    "
                  >
                    Export Data
                  </button>

                </div>

                <div className="
                  border
                  border-red-200
                  bg-red-50
                  rounded-lg
                  p-5
                ">

                  <h3 className="font-semibold text-red-700">
                    Reset Preferences
                  </h3>

                  <p className="text-sm text-red-600 mt-1">
                    Restore notification and display
                    preferences to their defaults.
                  </p>

                  <button
                    type="button"
                    onClick={resetPreferences}
                    className="
                      mt-4
                      border
                      border-red-300
                      text-red-700
                      px-5
                      py-2
                      rounded-lg
                      hover:bg-red-100
                    "
                  >
                    Reset Preferences
                  </button>

                </div>

              </SettingsCard>

            )}

          </section>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   SETTINGS CARD
========================================================= */

function SettingsCard({
  title,
  description,
  children,
  headerAction,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="
      bg-white
      rounded-xl
      border
      shadow-sm
      p-8
    ">

      <div className="
        border-b
        pb-6
        mb-6
        flex
        items-start
        justify-between
        gap-6
      ">

        <div>

          <h2 className="text-2xl font-bold text-gray-900">
            {title}
          </h2>

          <p className="text-gray-500 mt-1">
            {description}
          </p>

        </div>

        {headerAction && (
          <div className="flex-shrink-0">
            {headerAction}
          </div>
        )}

      </div>

      {children}

    </div>
  );
}


/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`
          w-full
          border
          rounded-lg
          px-4
          py-3
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          transition
          ${
            disabled
              ? "bg-gray-100 text-gray-600 cursor-default border-gray-200"
              : "bg-white"
          }
        `}
      />

    </div>
  );
}


/* =========================================================
   SELECT
========================================================= */

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          w-full
          border
          rounded-lg
          px-4
          py-3
          bg-white
        "
      >

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="
      flex
      items-center
      justify-between
      py-5
      border-b
      last:border-b-0
    ">

      <div className="pr-6">

        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative
          inline-flex
          h-6
          w-11
          flex-shrink-0
          rounded-full
          transition
          ${
            checked
              ? "bg-blue-600"
              : "bg-gray-300"
          }
        `}
      >

        <span
          className={`
            inline-block
            h-5
            w-5
            transform
            rounded-full
            bg-white
            shadow
            transition
            mt-0.5
            ${
              checked
                ? "translate-x-5"
                : "translate-x-0.5"
            }
          `}
        />

      </button>

    </div>
  );
}


/* =========================================================
   SAVE BUTTON
========================================================= */

function SaveButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-end">

      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="
          bg-blue-600
          hover:bg-blue-700
          disabled:bg-gray-400
          text-white
          px-6
          py-3
          rounded-lg
          font-medium
          transition
        "
      >
        {saving
          ? "Saving..."
          : "Save Changes"}
      </button>

    </div>
  );
}