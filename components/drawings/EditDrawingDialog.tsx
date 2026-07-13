"use client";

import { useState, useEffect } from "react";

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

type Drawing = {
  id: string;
  project_id: string;
  number: string;
  name: string;
  revision: string;
  status: string;
  file_url?: string;
};

type Props = {
  drawing: Drawing;
  onSave: (drawing: Drawing) => void;
};

export default function EditDrawingDialog({
  drawing,
  onSave,
}: Props) {
  const [form, setForm] = useState<Drawing>(drawing);

  useEffect(() => {
    setForm(drawing);
  }, [drawing]);

  function handleSave() {
    onSave(form);
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Drawing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Drawing Number</Label>

            <Input
              value={form.number}
              onChange={(e) =>
                setForm({
                  ...form,
                  number: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Drawing Name</Label>

            <Input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Revision</Label>

            <Input
              value={form.revision}
              onChange={(e) =>
                setForm({
                  ...form,
                  revision: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Status</Label>

            <Input
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}