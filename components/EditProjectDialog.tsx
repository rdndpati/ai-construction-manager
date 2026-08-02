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

  async function handleUpdate() {
    const { error } = await supabase
      .from("projects")
      .update({
        name,
        client,
        location,
        status,
      })
      .eq("id", project.id);

    if (error) {
      alert(error.message);
      return;
    }

    onUpdated();
  }

  return (
    <Dialog>
      <DialogTrigger
  className="border rounded-md px-4 py-2 hover:bg-gray-100 cursor-pointer"
>
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

          <Button
            className="w-full"
            onClick={handleUpdate}
          >
            Save Changes
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}