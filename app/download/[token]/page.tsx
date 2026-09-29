"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

type DownloadResponse =
  | { type: "files"; files: { fileName: string; url: string }[]; instructions: string | null }
  | { type: "external"; url: string; instructions: string | null }
  | { error: string };

export default function DownloadPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<DownloadResponse | null>(null);

  useEffect(() => {
    fetch(`/api/download/${params.token}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setState(json.error ? "error" : "ready");
      })
      .catch(() => setState("error"));
  }, [params.token]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="mb-6 font-display text-2xl text-ink">Your download</h1>

        {state === "loading" && <p className="text-muted">Generating delivery link...</p>}

        {state === "error" && (
          <div className="rounded-card border border-border bg-surface p-5 text-sm text-muted">
            {(data as any)?.error ?? "This download link is invalid."}
          </div>
        )}

        {state === "ready" && data && "type" in data && data.type === "files" && (
          <div className="space-y-3">
            {data.instructions && <p className="text-sm text-muted">{data.instructions}</p>}
            {data.files.map((f, i) => (
              <a
                key={i}
                href={f.url}
                className="block w-full rounded-full bg-accent py-3 text-center text-sm font-medium text-white"
              >
                Download {f.fileName}
              </a>
            ))}
          </div>
        )}

        {state === "ready" && data && "type" in data && data.type === "external" && (
          <div className="space-y-3">
            {data.instructions && <p className="text-sm text-muted">{data.instructions}</p>}
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-full bg-accent py-3 text-center text-sm font-medium text-white">
              Access Product
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
