import { supabase } from "./supabase";

/* =========================================================
   GET DRAWINGS
========================================================= */

export async function getDrawings(projectId: string) {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Drawings Error:", error);
    return [];
  }

  return data ?? [];
}


/* =========================================================
   CREATE DRAWING
========================================================= */

export async function createDrawing(drawing: {
  project_id: string;
  number: string;
  name: string;
  revision: string;
  status: string;
  file_url?: string;
}) {
  console.log("Creating drawing:", drawing);

  const { data, error } = await supabase
    .from("drawings")
    .insert([
      {
        project_id: drawing.project_id,
        number: drawing.number,
        name: drawing.name,
        revision: drawing.revision,
        status: drawing.status,
        file_url: drawing.file_url ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Create Drawing Error:", error);
    alert(error.message);
    return null;
  }

  return data;
}


/* =========================================================
   UPDATE DRAWING
========================================================= */

export async function updateDrawing(
  id: string,
  updates: {
    number: string;
    name: string;
    revision: string;
    status: string;
    file_url?: string;
  }
) {
  const { data, error } = await supabase
    .from("drawings")
    .update({
      number: updates.number,
      name: updates.name,
      revision: updates.revision,
      status: updates.status,
      file_url: updates.file_url ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Drawing Error:", error);
    alert(error.message);
    return null;
  }

  return data;
}


/* =========================================================
   DELETE DRAWING
========================================================= */

export async function deleteDrawing(id: string) {
  const { error } = await supabase
    .from("drawings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Drawing Error:", error);
    alert(error.message);
    return false;
  }

  return true;
}


/* =========================================================
   VALIDATE DRAWING PDF
========================================================= */

function validateDrawingFile(file: File) {
  if (!file) {
    return "Please select a file.";
  }

  // PDF only
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "Only PDF files are allowed.";
  }

  // 50 MB limit
  const MAX_SIZE = 50 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    return "PDF must be smaller than 50 MB.";
  }

  return null;
}


/* =========================================================
   CREATE SAFE FILE NAME
========================================================= */

function createSafeFileName(file: File) {
  return file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}


/* =========================================================
   UPLOAD SINGLE DRAWING PDF
========================================================= */

export async function uploadDrawingFile(file: File) {
  try {
    /* -----------------------------------------
       Validate file
    ----------------------------------------- */

    const validationError =
      validateDrawingFile(file);

    if (validationError) {
      alert(validationError);
      return null;
    }

    /* -----------------------------------------
       Create unique file path
    ----------------------------------------- */

    const safeFileName =
      createSafeFileName(file);

    const fileName =
      `drawings/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    console.log(
      "Uploading drawing:",
      fileName
    );

    /* -----------------------------------------
       Upload to Supabase Storage
    ----------------------------------------- */

    const {
      data: uploadData,
      error: uploadError,
    } = await supabase.storage
      .from("drawings")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    console.log(
      "Upload result:",
      uploadData
    );

    if (uploadError) {
      console.error(
        "Drawing PDF Upload Error:",
        uploadError
      );

      alert(
        `PDF upload failed:\n\n${uploadError.message}`
      );

      return null;
    }

    /* -----------------------------------------
       Get public URL
    ----------------------------------------- */

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("drawings")
      .getPublicUrl(fileName);

    if (
      !publicUrlData ||
      !publicUrlData.publicUrl
    ) {
      alert(
        "PDF uploaded, but a public URL could not be created."
      );

      return null;
    }

    console.log(
      "PDF Public URL:",
      publicUrlData.publicUrl
    );

    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error(
      "Unexpected Drawing Upload Error:",
      error
    );

    alert(
      error?.message ||
        "Something went wrong while uploading the PDF."
    );

    return null;
  }
}


/* =========================================================
   UPLOAD MULTIPLE DRAWING PDFs
========================================================= */

export async function uploadMultipleDrawingFiles(
  files: File[]
) {
  const uploadedFiles: {
    file: File;
    url: string;
  }[] = [];

  if (!files || files.length === 0) {
    alert("Please select at least one PDF.");
    return [];
  }

  /* -----------------------------------------
     Check all files first
  ----------------------------------------- */

  for (const file of files) {
    const validationError =
      validateDrawingFile(file);

    if (validationError) {
      alert(
        `${file.name}\n\n${validationError}`
      );

      return [];
    }
  }

  /* -----------------------------------------
     Upload files one by one
  ----------------------------------------- */

  for (const file of files) {
    try {
      const safeFileName =
        createSafeFileName(file);

      const fileName =
        `drawings/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      console.log(
        "Uploading multiple drawing file:",
        fileName
      );

      const {
        data: uploadData,
        error: uploadError,
      } = await supabase.storage
        .from("drawings")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      console.log(
        "Upload result:",
        uploadData
      );

      if (uploadError) {
        console.error(
          `Upload failed for ${file.name}:`,
          uploadError
        );

        alert(
          `Upload failed for:\n${file.name}\n\n${uploadError.message}`
        );

        // Continue with remaining files
        continue;
      }

      /* -----------------------------------------
         Get public URL
      ----------------------------------------- */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("drawings")
        .getPublicUrl(fileName);

      if (
        !publicUrlData ||
        !publicUrlData.publicUrl
      ) {
        console.error(
          `Could not create URL for ${file.name}`
        );

        continue;
      }

      uploadedFiles.push({
        file,
        url: publicUrlData.publicUrl,
      });

    } catch (error) {
      console.error(
        `Unexpected error uploading ${file.name}:`,
        error
      );
    }
  }

  console.log(
    "Successfully uploaded files:",
    uploadedFiles
  );

  return uploadedFiles;
}


/* =========================================================
   DELETE DRAWING FILE FROM STORAGE
========================================================= */

export async function deleteDrawingFile(
  fileUrl: string
) {
  try {
    if (!fileUrl) {
      return false;
    }

    /*
      Example public URL:

      https://xxxxx.supabase.co/storage/v1/object/public/drawings/drawings/file.pdf

      We need everything after /drawings/
    */

    const marker =
      "/storage/v1/object/public/drawings/";

    const index =
      fileUrl.indexOf(marker);

    if (index === -1) {
      console.error(
        "Could not determine storage path from URL:",
        fileUrl
      );

      return false;
    }

    const filePath =
      fileUrl.substring(
        index + marker.length
      );

    console.log(
      "Deleting storage file:",
      filePath
    );

    const { error } =
      await supabase.storage
        .from("drawings")
        .remove([filePath]);

    if (error) {
      console.error(
        "Delete Storage File Error:",
        error
      );

      return false;
    }

    return true;

  } catch (error) {
    console.error(
      "Unexpected storage delete error:",
      error
    );

    return false;
  }
}


/* =========================================================
   DELETE DRAWING + PDF FILE
========================================================= */

export async function deleteDrawingWithFile(
  id: string,
  fileUrl?: string
) {
  try {
    /* -----------------------------------------
       Delete database record
    ----------------------------------------- */

    const { error } = await supabase
      .from("drawings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Delete Drawing Error:",
        error
      );

      alert(error.message);

      return false;
    }

    /* -----------------------------------------
       Delete PDF from storage
    ----------------------------------------- */

    if (fileUrl) {
      await deleteDrawingFile(fileUrl);
    }

    return true;

  } catch (error: any) {
    console.error(
      "Delete Drawing With File Error:",
      error
    );

    alert(
      error?.message ||
        "Unable to delete drawing."
    );

    return false;
  }
}