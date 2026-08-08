"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ComplianceHistoryPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const { data } = await supabase
      .from("compliance_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data);
    }
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        📜 Compliance History
      </h1>

      <table className="w-full border rounded-lg">

        <thead className="bg-gray-100">

          <tr>
            <th className="p-3 text-left">
              Submittal
            </th>

            <th className="p-3 text-left">
              Recommendation
            </th>

            <th className="p-3 text-left">
              Date
            </th>
          </tr>

        </thead>

        <tbody>

          {reports.map((report) => (

            <tr
              key={report.id}
              className="border-t"
            >

              <td className="p-3">
                {report.submittal_name}
              </td>

              <td className="p-3">
                {report.recommendation}
              </td>

              <td className="p-3">
                {new Date(
                  report.created_at
                ).toLocaleDateString()}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </main>
  );
}