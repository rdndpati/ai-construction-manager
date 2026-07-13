"use client";

import { useState } from "react";

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
  addProject: (project: Project) => void;
};

export default function NewProjectDialog({ addProject }: Props) {
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");

  function handleSave() {
    if (!projectName || !client || !location) {
      alert("Please fill in all fields.");
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      client,
      location,
      status: "Engineering",
    };

    addProject(newProject);

    setProjectName("");
    setClient("");
    setLocation("");

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