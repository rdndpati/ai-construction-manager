"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

// ============================================================
// CALLBACK CONTENT
// ============================================================

function AuthCallbackContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [message, setMessage] =
    useState(
      "Completing authentication..."
    );

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        console.log(
          "===================================="
        );

        console.log(
          "AUTH CALLBACK CLIENT"
        );

        console.log(
          "===================================="
        );

        // ======================================================
        // INVITATION ID FROM QUERY STRING
        // ======================================================

        const invitationId =
          searchParams.get(
            "invitation_id"
          );

        console.log(
          "INVITATION ID:",
          invitationId ||
            "NONE"
        );

        // ======================================================
        // CHECK FOR NORMAL AUTH CODE
        // ======================================================

        const code =
          searchParams.get(
            "code"
          );

        // ======================================================
        // PKCE / CODE FLOW
        // ======================================================

        if (code) {
          console.log(
            "AUTH CODE FOUND"
          );

          const {
            error,
          } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (error) {
            console.error(
              "CODE EXCHANGE ERROR:",
              error
            );

            if (mounted) {
              setMessage(
                "Authentication failed. Please try again."
              );
            }

            setTimeout(() => {
              router.replace(
                `/login?error=${encodeURIComponent(
                  error.message
                )}`
              );
            }, 1200);

            return;
          }

          console.log(
            "CODE EXCHANGED SUCCESSFULLY"
          );
        }

        // ======================================================
        // IMPORTANT:
        //
        // SUPABASE INVITATION / IMPLICIT FLOW
        //
        // Supabase can return:
        //
        // #access_token=...
        // &refresh_token=...
        //
        // The browser hash is NOT sent to the server.
        //
        // Therefore we manually read it here.
        // ======================================================

        if (
          typeof window !==
          "undefined"
        ) {
          const hash =
            window.location.hash;

          console.log(
            "CALLBACK HASH EXISTS:",
            hash
              ? "YES"
              : "NO"
          );

          if (hash) {
            const hashParams =
              new URLSearchParams(
                hash.substring(1)
              );

            const accessToken =
              hashParams.get(
                "access_token"
              );

            const refreshToken =
              hashParams.get(
                "refresh_token"
              );

            const hashType =
              hashParams.get(
                "type"
              );

            console.log(
              "ACCESS TOKEN FOUND:",
              !!accessToken
            );

            console.log(
              "REFRESH TOKEN FOUND:",
              !!refreshToken
            );

            console.log(
              "HASH TYPE:",
              hashType ||
                "NONE"
            );

            // ==================================================
            // SET SESSION MANUALLY
            // ==================================================

            if (
              accessToken &&
              refreshToken
            ) {
              console.log(
                "SETTING SUPABASE SESSION FROM URL HASH"
              );

              const {
                data: sessionData,
                error: sessionError,
              } =
                await supabase.auth.setSession(
                  {
                    access_token:
                      accessToken,

                    refresh_token:
                      refreshToken,
                  }
                );

              if (
                sessionError
              ) {
                console.error(
                  "SET SESSION ERROR:",
                  sessionError
                );

                if (mounted) {
                  setMessage(
                    "We could not complete your invitation."
                  );
                }

                setTimeout(() => {
                  router.replace(
                    `/login?error=${encodeURIComponent(
                      sessionError.message
                    )}`
                  );
                }, 1500);

                return;
              }

              console.log(
                "SESSION CREATED FROM INVITATION HASH"
              );

              console.log(
                "USER:",
                sessionData.user
                  ?.email
              );

              // ==================================================
              // REMOVE AUTH TOKENS FROM BROWSER URL
              //
              // Keep invitation_id.
              // ==================================================

              window.history.replaceState(
                {},
                document.title,
                `${window.location.pathname}${window.location.search}`
              );
            }
          }
        }

        // ======================================================
        // GET SESSION
        // ======================================================

        let session = null;

        for (
          let attempt = 0;
          attempt < 15;
          attempt++
        ) {
          const {
            data,
          } =
            await supabase.auth.getSession();

          session =
            data.session;

          console.log(
            `SESSION CHECK ${
              attempt + 1
            }:`,
            session
              ? "FOUND"
              : "NOT FOUND"
          );

          if (
            session?.user
          ) {
            break;
          }

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                300
              )
          );
        }

        // ======================================================
        // NO SESSION
        // ======================================================

        if (
          !session?.user
        ) {
          console.error(
            "NO SESSION FOUND AFTER CALLBACK"
          );

          if (mounted) {
            setMessage(
              "We could not complete your invitation. Please open the invitation email again."
            );
          }

          setTimeout(() => {
            router.replace(
              invitationId
                ? `/login?invitation_id=${encodeURIComponent(
                    invitationId
                  )}&error=invitation_session_missing`
                : "/login?error=session_missing"
            );
          }, 1800);

          return;
        }

        // ======================================================
        // AUTHENTICATED USER
        // ======================================================

        const user =
          session.user;

        console.log(
          "===================================="
        );

        console.log(
          "AUTHENTICATED USER"
        );

        console.log(
          "USER ID:",
          user.id
        );

        console.log(
          "EMAIL:",
          user.email
        );

        console.log(
          "===================================="
        );

        // ======================================================
        // INVITATION ID FROM USER METADATA
        // ======================================================

        const metadataInvitationId =
          user.user_metadata
            ?.invitation_id;

        console.log(
          "URL INVITATION ID:",
          invitationId ||
            "NONE"
        );

        console.log(
          "METADATA INVITATION ID:",
          metadataInvitationId ||
            "NONE"
        );

        // ======================================================
        // FINAL INVITATION ID
        // ======================================================

        const finalInvitationId =
          invitationId ||
          metadataInvitationId ||
          null;

        console.log(
          "FINAL INVITATION ID:",
          finalInvitationId ||
            "NONE"
        );

        // ======================================================
        // INVITED USER
        // ======================================================

        if (
          finalInvitationId
        ) {
          console.log(
            "===================================="
          );

          console.log(
            "INVITED USER"
          );

          console.log(
            "GOING TO ACCEPT INVITATION"
          );

          console.log(
            "INVITATION ID:",
            finalInvitationId
          );

          console.log(
            "===================================="
          );

          if (mounted) {
            setMessage(
              "Invitation verified. Joining your company..."
            );
          }

          router.replace(
            `/app/accept-invitation?invitation_id=${encodeURIComponent(
              finalInvitationId
            )}`
          );

          router.refresh();

          return;
        }

        // ======================================================
        // NORMAL USER
        // ======================================================

        console.log(
          "NORMAL USER CALLBACK"
        );

        if (mounted) {
          setMessage(
            "Authentication successful. Loading your account..."
          );
        }

        router.replace(
          "/app/dashboard"
        );

        router.refresh();

      } catch (error) {
        console.error(
          "AUTH CALLBACK UNEXPECTED ERROR:",
          error
        );

        if (mounted) {
          setMessage(
            "Something went wrong while completing authentication."
          );
        }

        setTimeout(() => {
          router.replace(
            "/login?error=callback_failed"
          );
        }, 1500);
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [
    router,
    searchParams,
  ]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl border border-gray-100">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
          🏗️
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          ConstructIQ
        </h1>

        <p className="mt-4 text-gray-500">
          {message}
        </p>

        <div className="mt-6 flex justify-center">

          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        </div>

      </div>

    </main>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl border border-gray-100">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
              🏗️
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              ConstructIQ
            </h1>

            <p className="mt-4 text-gray-500">
              Loading...
            </p>

            <div className="mt-6 flex justify-center">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            </div>

          </div>

        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}