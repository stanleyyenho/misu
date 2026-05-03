"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhoneImportIllustration } from "@/components/illustrations/PhoneImportIllustration";

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    if (!file.name.endsWith(".vcf") && file.type !== "text/vcard") {
      toast.error("Please upload a .vcf vCard file");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/contacts/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
      toast.success(
        `Imported ${data.imported} contact${data.imported !== 1 ? "s" : ""}` +
        (data.skipped > 0 ? ` · ${data.skipped} skipped` : "")
      );
      router.push("/contacts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-xl md:text-2xl font-extrabold mb-1">Import contacts</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Export a <strong>.vcf</strong> file from your iPhone, then drop it here.
      </p>

      {/* Instructions */}
      <div className="mb-6 rounded-2xl border bg-secondary/50 p-4 text-sm space-y-2">
        <p className="font-bold text-sm">How to export from iPhone</p>
        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
          <li>Open the Contacts app on your iPhone</li>
          <li>Tap a contact → Share Contact (for one person)</li>
          <li>To export all: go to <strong>iCloud.com → Contacts</strong> → select all → Export vCard</li>
          <li>AirDrop or email the .vcf file to your Mac</li>
        </ol>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/8 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        }`}
      >
        <PhoneImportIllustration size={72} />
        <div className="text-center">
          <p className="font-bold">Drop your .vcf file here</p>
          <p className="text-sm text-muted-foreground mt-0.5">or tap to browse</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".vcf,text/vcard"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {loading && (
        <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse font-semibold">
          Importing contacts...
        </p>
      )}

      <div className="mt-6 text-center">
        <Button variant="outline" onClick={() => router.push("/contacts")} disabled={loading} className="rounded-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
