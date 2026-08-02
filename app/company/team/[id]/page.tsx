"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditUserPage() {
  const { id } = useParams();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    setUser(data);
  }

  async function saveUser() {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: user.full_name,
      })
      .eq("id", id);

    if (!error) {
      alert("User updated successfully.");
    }
  }

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Edit User
      </h1>

      <div className="space-y-6">

        <div>
          <label>Name</label>

          <input
            className="border rounded w-full p-3"
            value={user.full_name || ""}
            onChange={(e) =>
              setUser({
                ...user,
                full_name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>Email</label>

          <input
            disabled
            className="border rounded w-full p-3 bg-gray-100"
            value={user.email}
          />
        </div>

        <button
          onClick={saveUser}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Save Changes
        </button>

      </div>

    </main>
  );
}