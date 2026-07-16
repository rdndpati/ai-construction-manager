"use client";
import MarkupDialog from "@/components/MarkupDialog";
import { getRevisions } from "@/lib/revisions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import NewRevisionDialog from "@/components/NewRevisionDialog";
import NewRFIDialog from "@/components/NewRFIDialog";
import { createRFI } from "@/lib/rfis";
import { updateMarkupPosition } from "@/lib/markups";

import { supabase } from "@/lib/supabase";
import { getMarkups, createMarkup } from "@/lib/markups";

export default function DrawingViewerPage() {
  const params = useParams();

  const drawingId = params.drawingId as string;
  const projectId = params.id as string;

  const [drawing, setDrawing] = useState<any>(null);
  const [markups, setMarkups] = useState<any[]>([]);
  const [revisions,setRevisions]=useState<any[]>([]);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [selectedMarkup, setSelectedMarkup] = useState<any>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showCreateRFI, setShowCreateRFI] = useState(false);   

  const [showMarkupDialog, setShowMarkupDialog] = useState(false);

  const [showRFIDialog, setShowRFIDialog] = useState(false);


  useEffect(() => {
    async function loadDrawing() {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("id", drawingId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setDrawing(data);
      const revs = await getRevisions(data.id);
setRevisions(revs);
console.log("Loaded revisions:", revs);

      const pins = await getMarkups(drawingId);
      setMarkups(pins);
    }

    if (drawingId) {
      loadDrawing();
    }
  }, [drawingId]);

  async function handlePdfClick(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    try {
      console.log("CLICKED");

      const rect = e.currentTarget.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log("X:", x);
      console.log("Y:", y);
      console.log("Drawing ID:", drawingId);

      const markup = await createMarkup({
        drawing_id: drawingId,
        x,
        y,
        title: "Pin",
        description: "",
      });

      console.log("Returned:", markup);

      if (markup) {
        setMarkups((prev) => [...prev, markup]);
      }
    } catch (err) {
      console.error("HANDLE CLICK ERROR:", err);
      alert("Check browser console");
    }
  }
  function openMarkup(markup: any) {
  setSelectedMarkup(markup);

  if (markup.rfi_id) {
    window.location.href = `/projects/${projectId}/rfis`;
  } else {
    setShowCreateRFI(true);
  }
}
  async function handleDrop(
  e: React.MouseEvent<HTMLDivElement>
) {
  if (!draggingId) return;

  const rect = e.currentTarget.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const updated = await updateMarkupPosition(
    draggingId,
    x,
    y
  );

  if (updated) {
    setMarkups((prev) =>
      prev.map((m) =>
        m.id === updated.id ? updated : m
      )
    );
  }

  setDraggingId(null);
}

  // ************** IMPORTANT FIX **************
  if (!drawing) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  // *******************************************

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">

        <div>
          <Link
            href={`/projects/${projectId}/drawings`}
            className="text-blue-600 hover:underline"
          >
            ← Back to Drawings
          </Link>

          <h1 className="text-3xl font-bold mt-2">
            {drawing.number}
          </h1>

          <p className="text-gray-500">
            {drawing.name}
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => window.open(drawing.file_url)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            🔗 Open
          </button>

          <button
            onClick={() => window.open(drawing.file_url, "_blank")}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            ⬇ Download
          </button>

          <button
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            }}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            ⛶ Full Screen
          </button>
          <button
    onClick={() => setShowRevisionDialog(true)}
    className="bg-orange-600 text-white px-4 py-2 rounded-lg"
>
    + New Revision
</button>

        </div>

      </div>

      <div className="flex">

        {/* PDF Viewer */}

        <div className="flex-1 p-6">

          <div
  className="bg-white rounded-xl shadow overflow-hidden relative"
  onClick={handlePdfClick}
  onMouseUp={handleDrop}
>

            <iframe
              src={drawing.file_url}
              width="100%"
              height="900"
              className="border-0 pointer-events-none"
              title={drawing.name}
            />

           {markups.map((pin) => (

  <div
    key={pin.id}
    onClick={(e) => {
      e.stopPropagation();

      setSelectedMarkup(pin);

      setShowMarkupDialog(true);
    }}
    style={{
      position: "absolute",
      left: pin.x,
      top: pin.y,
      width: 18,
      height: 18,
      background: "red",
      borderRadius: "50%",
      border: "2px solid white",
      transform: "translate(-50%, -50%)",
      cursor: "pointer",
      zIndex: 100,
    }}
  />

))}

          </div>

        </div>

        {/* Information Panel */}

        <aside className="w-80 bg-white border-l p-6">

          <h2 className="text-xl font-bold mb-6">
            Drawing Information
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-gray-500 text-sm">
                Number
              </p>
              <p className="font-semibold">
                {drawing.number}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Name
              </p>
              <p className="font-semibold">
                {drawing.name}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Revision
              </p>
              <p className="font-semibold">
                {drawing.revision}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Status
              </p>
              <p className="font-semibold">
                {drawing.status}
              </p>
            </div>
            <hr className="my-6" />

<h3 className="text-lg font-bold mb-4">
    Revision History
</h3>

<div className="space-y-3">
  <p className="text-red-500">
  Total Revisions: {revisions.length}
</p>
 
    {revisions.map((rev:any)=>(
    <div
        key={rev.id}
        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-100"
    >

        <div className="font-semibold">
            {rev.revision_number}
        </div>

        <div className="text-sm text-gray-500">
            {rev.revision_date}
        </div>

    </div>
))}

</div>

            <div>
              <a
                href={drawing.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Original PDF
              </a>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Markups
              </p>
              <p className="font-semibold text-red-600">
                {markups.length} Pins
              </p>
            </div>

          </div>

        </aside>

      </div>
      {selectedMarkup && (
  <MarkupDialog
  markup={selectedMarkup}
  onClose={() => setSelectedMarkup(null)}
  onSave={async (updatedMarkup) => {
      const { data, error } = await supabase
        .from("markups")
        .update(updatedMarkup)
        .eq("id", updatedMarkup.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setMarkups((prev) =>
        prev.map((m) =>
          m.id === data.id ? data : m
        )
      );

      setSelectedMarkup(null);
    }}
  />
)}
{showCreateRFI && selectedMarkup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-xl p-8 w-[500px]">
      <h2 className="text-2xl font-bold mb-4">
        Create RFI for this markup?
      </h2>

      <p className="mb-6">
        This pin doesn't have an RFI yet.
      </p>

      <button
        className="bg-blue-600 text-white px-5 py-2 rounded"
        onClick={() => {
          window.location.href = `/projects/${projectId}/rfis`;
        }}
      >
        Go to RFIs
      </button>

      <button
        className="ml-3"
        onClick={() => setShowCreateRFI(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}
{showMarkupDialog && selectedMarkup && (

  <MarkupDialog
    markup={selectedMarkup}
    onClose={() => setShowMarkupDialog(false)}

    onSave={(updated) => {

      setMarkups((prev) =>
        prev.map((m) =>
          m.id === updated.id ? updated : m
        )
      );

      setShowMarkupDialog(false);
    }}

    onCreateRFI={() => {

      setShowMarkupDialog(false);

      setShowRFIDialog(true);

    }}

  />

)}

{showRFIDialog && (

  <NewRFIDialog

    onClose={() => setShowRFIDialog(false)}

    onSave={async (form) => {

      await createRFI({

        ...form,

        project_id: projectId,

        drawing_id: drawingId,

        markup_id: selectedMarkup.id,

      });

      alert("RFI Created!");

      setShowRFIDialog(false);

    }}
    
  

  />

)}
{showRevisionDialog && (
  <NewRevisionDialog
  drawingId={drawing.id}
  onClose={() => setShowRevisionDialog(false)}
  onSave={async (revision) => {

  const { data, error } = await supabase
    .from("drawing_revisions")
    .insert([revision]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  alert("Revision Saved!");

  setShowRevisionDialog(false);

  

}}
/>
)}


    </main>
  );
}