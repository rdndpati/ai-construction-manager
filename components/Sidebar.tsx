"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
  const [costOpen, setCostOpen] = useState(false);

  const menu = [
    { name: "🏠 Dashboard", href: "/" },
    { name: "📁 Projects", href: "/app/projects" },
    { name: "👥 Company", href: "/app/company" },
    { name: "📋 RFI Management", href: "/app/rfis" },
  
    { name: "📄 Submittals", href: "/app/submittals" },
    { name: "📚 Specifications", href: "/app/specifications" },
    
    
    { name: "⚙️ Settings", href: "/settings" },
  ];

  const costManagement = [
    {
      name: "📊 Cost Dashboard",
      href: "/app/cost-management",
    },
    {
      name: "💵 Budget",
      href: "/app/cost-management/budget",
    },
    {
      name: "🏷️ Cost Codes",
      href: "/app/cost-management/cost-codes",
    },
    {
      name: "📝 Commitments",
      href: "/app/cost-management/commitments",
    },
    {
      name: "💳 Actual Costs",
      href: "/app/cost-management/actual-costs",
    },
    {
      name: "📈 Forecast",
      href: "/app/cost-management/forecast",
    },
    {
      name: "🔄 Change Orders",
      href: "/app/cost-management/change-orders",
    },
    {
      name: "🏦 Contingency",
      href: "/app/cost-management/contingency",
    },
    {
      name: "📐 Earned Value",
      href: "/app/cost-management/earned-value",
    },
    {
      name: "📑 Cost Reports",
      href: "/app/cost-management/reports",
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">

      {/* Logo / Title */}
      <h1 className="text-2xl font-bold mb-8">
        AI Construction Manager
      </h1>

      <nav className="space-y-2">

        {/* Existing Menu */}
        {menu.slice(0, 2).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {item.name}
          </Link>
        ))}

        {/* ================================================= */}
        {/* COST MANAGEMENT */}
        {/* ================================================= */}

        <div>

          <button
            type="button"
            onClick={() =>
              setCostOpen(!costOpen)
            }
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-700 transition text-left"
          >

            <span>
              💰 Cost Management
            </span>

            <span className="text-sm">
              {costOpen ? "▲" : "▼"}
            </span>

          </button>

          {/* Cost Management Submenu */}
          {costOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">

              {costManagement.map(
                (item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    {item.name}
                  </Link>
                )
              )}

            </div>
          )}

        </div>

        {/* ================================================= */}
        {/* REST OF EXISTING MENU */}
        {/* ================================================= */}

        {menu.slice(2).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {item.name}
          </Link>
        ))}

      </nav>

    </aside>
  );
}