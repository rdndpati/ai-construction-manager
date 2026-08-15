import { supabase } from "@/lib/supabase";

const BUCKET = "rfi-attachments";

export async function getChangeOrderAttachments(
  changeOrderId: string
) {
  const { data, error } = await supabase
    .from("change_order_attachments")
    .select("*")
    .eq("change_order_id", changeOrderId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "CHANGE ORDER ATTACHMENTS ERROR:",
      error
    );
    return [];
  }

  return data ?? [];
}

export async function uploadChangeOrderAttachment(
  file: File,
  changeOrderId: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No logged-in user.");
    return null;
  }

  const fileExt =
    file.name.split(".").pop() || "file";

  const filePath =
    `change-orders/${changeOrderId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } =
    await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: false,
      });

  if (uploadError) {
    console.error(
      "CHANGE ORDER FILE UPLOAD ERROR:",
      uploadError
    );

    throw uploadError;
  }

  const { data: publicData } =
    supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

  const fileUrl =
    publicData.publicUrl;

  const { data, error } =
    await supabase
      .from("change_order_attachments")
      .insert({
        change_order_id:
          changeOrderId,

        file_name:
          file.name,

        file_url:
          fileUrl,

        uploaded_by:
          user.id,
      })
      .select()
      .single();

  if (error) {
    console.error(
      "CHANGE ORDER ATTACHMENT DATABASE ERROR:",
      error
    );

    // Remove uploaded file if DB insert failed
    await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    throw error;
  }

  return data;
}

export async function deleteChangeOrderAttachment(
  id: string,
  fileUrl: string
) {
  try {
    // Extract storage path from URL
    const marker =
      `/storage/v1/object/public/${BUCKET}/`;

    const index =
      fileUrl.indexOf(marker);

    if (index !== -1) {
      const filePath =
        fileUrl.substring(
          index + marker.length
        );

      const { error: storageError } =
        await supabase.storage
          .from(BUCKET)
          .remove([filePath]);

      if (storageError) {
        console.error(
          "STORAGE DELETE ERROR:",
          storageError
        );
      }
    }

    const { error } =
      await supabase
        .from(
          "change_order_attachments"
        )
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "DATABASE DELETE ERROR:",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "DELETE ATTACHMENT ERROR:",
      error
    );

    return false;
  }
}