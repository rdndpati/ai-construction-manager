"use client";

import { supabase } from "@/lib/supabase";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";

type Props = {
  project: Project;
  onDeleted: () => void;
};

export default function DeleteProjectDialog({
  project,
  onDeleted,
}: Props) {
  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${project.name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      alert(error.message);
      return;
    }

    onDeleted();
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
    >
      🗑 Delete
    </Button>
  );
}