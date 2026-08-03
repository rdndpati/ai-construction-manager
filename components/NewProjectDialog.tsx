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

type Props = {
  onCreated: () => void;
};

export default function NewProjectDialog({
  onCreated,
}: Props) {
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");

  async function handleSave() {
  if (!projectName || !client || !location) {
    alert("Please fill in all fields.");
    return;
  }

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please login again.");
    return;
  }

  // Get user's company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    alert("Company not found.");
    return;
  }

  // Create project
  const { error } = await supabase
    .from("projects")
    .insert({
      name: projectName,
      client,
      location,
      status: "Engineering",
      company_id: profile.company_id,
    });

  if (error) {
    alert(error.message);
    return;
  }

  setProjectName("");
  setClient("");
  setLocation("");

  onCreated();

  alert("Project Created!");
}
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        + New Project
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div>
            <Label>Client</Label>
            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
          >
            Save Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}