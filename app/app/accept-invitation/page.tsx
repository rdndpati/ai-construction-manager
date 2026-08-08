import { Suspense } from "react";
import AcceptInvitationClient from "./AcceptInvitationClient";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">
            <div className="text-5xl mb-5">✉️</div>

            <h1 className="text-2xl font-bold text-gray-900">
              Loading Invitation
            </h1>

            <p className="text-gray-500 mt-3">
              Please wait...
            </p>

            <div className="mt-6">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            </div>
          </div>
        </main>
      }
    >
      <AcceptInvitationClient />
    </Suspense>
  );
}