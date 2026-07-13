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

import {
  createDrawing,
  uploadDrawingFile,
} from "@/lib/drawings";

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
  projectId: string;
  addDrawing: (drawing: Drawing) => void;
};

export default function UploadDrawingDialog({
  projectId,
  addDrawing,
}: Props) {
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [revision, setRevision] = useState("");
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload() {
    try {
      let fileUrl = "";

      console.log("========== START UPLOAD ==========");
      console.log("Project ID:", projectId);
      console.log("Selected File:", file);

      if (file) {
        const uploadedUrl = await uploadDrawingFile(file);

        console.log("Returned URL:", uploadedUrl);

        if (!uploadedUrl) {
          alert("File upload failed.");
          return;
        }

        fileUrl = uploadedUrl;
      }

      console.log("Saving Drawing...");
      console.log({
        project_id: projectId,
        number,
        name: title,
        revision,
        status,
        file_url: fileUrl,
      });

      const newDrawing = await createDrawing({
        project_id: projectId,
        number,
        name: title,
        revision,
        status,
        file_url: fileUrl,
      });

      console.log("Inserted Drawing:", newDrawing);

      if (!newDrawing) {
        alert("Drawing insert failed.");
        return;
      }

      addDrawing(newDrawing);

      setNumber("");
      setTitle("");
      setRevision("");
      setStatus("");
      setFile(null);

      console.log("========== SUCCESS ==========");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        + Upload Drawing
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Drawing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Drawing Number</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>

          <div>
            <Label>Drawing Name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Revision</Label>
            <Input
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Input
              placeholder="IFC / Review / Approved"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          <div>
            <Label>Drawing File</Label>
            <Input
              type="file"
              accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] ?? null;
                console.log("File Selected:", selectedFile);
                setFile(selectedFile);
              }}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleUpload}
          >
            Upload Drawing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}