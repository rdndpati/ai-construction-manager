"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/types/project";

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
  project: Project;
  onUpdated: () => void;
};

export default function EditProjectDialog({
  project,
  onUpdated,
}: Props) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client);
  const [location, setLocation] = useState(project.location);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(project.progress ?? 0);

  async function handleUpdate() {
    setSaving(true);

    try {
      // Verify user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in again.");
        return;
      }

      const { error } = await supabase
        .from("projects")
        .update({
  name,
  client,
  location,
  status,
  progress,
})
        .eq("id", project.id);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
  <Dialog>

    <DialogTrigger className="border rounded-md px-4 py-2 hover:bg-gray-100 cursor-pointer">
      ✏️ Edit
    </DialogTrigger>

    <DialogContent>

      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">

        <div>
          <Label>Project Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <div>
          <Label>Status</Label>

          <select
            className="w-full border rounded-md p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Planning</option>
            <option>Engineering</option>
            <option>Construction</option>
            <option>Commissioning</option>
            <option>Completed</option>
          </select>

        </div>
        <div>
  <Label>Project Progress (%)</Label>

  <Input
    type="number"
    min="0"
    max="100"
    value={progress}
    onChange={(e) => {
      const value = Math.min(
        100,
        Math.max(0, Number(e.target.value))
      );

      setProgress(value);
    }}
  />

  <p className="text-sm text-gray-500 mt-1">
    Enter a value from 0% to 100%.
  </p>
</div>

        <Button
          className="w-full"
          onClick={handleUpdate}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

      </div>

    </DialogContent>

  </Dialog>
);
}