"use client";

import { useState } from "react";

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
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");

  function handleSave() {
    alert(
      `Project Created!

Name: ${projectName}
Client: ${client}
Location: ${location}`
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>+ New Project</Button>
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