"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhoneImportIllustration } from "@/components/illustrations/PhoneImportIllustration";

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<NativeContact[]>;
  getProperties(): Promise<string[]>;
}

interface NativeContact {
  name?: string[];
  tel?: { value: string }[];
  email?: { value: string }[];
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nativeSupported, setNativeSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setNativeSupported("contacts" in navigator && typeof navigator.contacts?.select === "function");
  }, []);

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

  async function handleNativeImport() {
    if (!navigator.contacts) return;
    setLoading(true);
    try {
      const selected = await navigator.contacts.select(["name", "tel", "email"], { multiple: true });
      if (!selected || selected.length === 0) {
        toast.info("No contacts selected");
        return;
      }
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
      toast.success(
        `Imported ${data.imported} contact${data.imported !== 1 ? "s" : ""}` +
        (data.skipped > 0 ? ` · ${data.skipped} skipped` : "")
      );
      router.push("/contacts");
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Could not access contacts");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-xl md:text-2xl font-extrabold mb-1">Import contacts</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pull in your people from your device contacts or from a <strong>.vcf</strong> file.
      </p>

      {/* Native contacts picker — shown only when the API is available (Android Chrome / iOS Safari) */}
      {nativeSupported && (
        <div className="mb-6 rounded-2xl border-2 border-[#1F2024] bg-accent/40 p-5 flex flex-col items-center gap-3 text-center"
          style={{ boxShadow: "3px 3px 0 #1F2024" }}>
          <div className="text-2xl">📱</div>
          <div>
            <p className="font-extrabold text-base">Import from device contacts</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pick contacts directly from your iOS or Android contacts list.
            </p>
          </div>
          <Button
            onClick={handleNativeImport}
            disabled={loading}
            className="rounded-full font-bold border-2 border-[#1F2024]"
            style={{ boxShadow: "2px 2px 0 #1F2024" }}
          >
            Open contacts list
          </Button>
        </div>
      )}

      {/* VCF instructions */}
      <div className="mb-6 rounded-2xl border bg-secondary/50 p-4 text-sm space-y-2">
        <p className="font-bold text-sm">How to export a .vcf from your phone</p>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">iPhone</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open <strong>iCloud.com → Contacts</strong></li>
              <li>Select all → Export vCard</li>
              <li>AirDrop or email the .vcf file here</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Android</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open the Contacts app</li>
              <li>Menu → Import/Export → Export to .vcf</li>
              <li>Share the file here</li>
            </ol>
          </div>
        </div>
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
