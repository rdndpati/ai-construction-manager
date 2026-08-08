"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProjectDialog() {
  const [open, setOpen] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!projectName.trim() || !client.trim() || !location.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setSaving(true);

    try {
      // 1. Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please log in again.");
        return;
      }

      console.log("CURRENT USER:", user.id);
      console.log("CURRENT EMAIL:", user.email);

      // 2. Get user's company
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        alert("Unable to find your company.");
        return;
      }

      if (!profile?.company_id) {
        alert("Your account is not connected to a company.");
        return;
      }

      console.log("USER COMPANY:", profile.company_id);

      // 3. Create project under user's company
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectName.trim(),
          client: client.trim(),
          location: location.trim(),
          status: "Engineering",
          company_id: profile.company_id,
          archived: false,
        })
        .select()
        .single();

      if (projectError) {
        console.error("PROJECT CREATE ERROR:", projectError);
        alert(projectError.message);
        return;
      }

      console.log("NEW PROJECT:", newProject);

      // 4. Clear form
      setProjectName("");
      setClient("");
      setLocation("");

      // 5. Close dialog
      setOpen(false);

      // 6. Refresh project list
      window.location.reload();
    } catch (err) {
      console.error("CREATE PROJECT ERROR:", err);
      alert("Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">
  + New Project
</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <Label>Project Name</Label>

            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
            />
          </div>

          <div>
            <Label>Client</Label>

            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client"
            />
          </div>

          <div>
            <Label>Location</Label>

            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Creating..." : "Save Project"}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}