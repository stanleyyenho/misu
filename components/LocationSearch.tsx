"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (result: LocationResult) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapkit: any;
  }
}

export function LocationSearch({ value, onChange, onSelect, placeholder = "Search for a venue..." }: Props) {
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<unknown>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.mapkit) { initSearch(); return; }

    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
    script.async = true;
    script.onload = initSearch;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initSearch() {
    const res = await fetch("/api/mapkit/token");
    if (!res.ok) return;
    const { token } = await res.json();

    window.mapkit.init({
      authorizationCallback: (done: (token: string) => void) => done(token),
    });

    searchRef.current = new window.mapkit.Search({ includePointsOfInterest: true });
    setReady(true);
  }

  function handleChange(query: string) {
    onChange(query);
    setResults([]);
    if (!ready || !query.trim()) { setOpen(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (searchRef.current as any).search(query, (err: unknown, data: any) => {
        if (err || !data?.places) { setOpen(false); return; }
        const mapped: LocationResult[] = data.places.slice(0, 5).map((p: any) => ({
          name: p.name,
          address: p.formattedAddress ?? "",
          lat: p.coordinate?.latitude ?? 0,
          lng: p.coordinate?.longitude ?? 0,
        }));
        setResults(mapped);
        setOpen(mapped.length > 0);
      });
    }, 350);
  }

  function handleSelect(r: LocationResult) {
    onChange(r.name);
    setResults([]);
    setOpen(false);
    onSelect(r);
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={ready ? placeholder : "Loading map search..."}
        disabled={!ready}
        style={{ borderRadius: "8px" }}
      />
      {open && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-[8px] border-2 border-[#1F2024] bg-popover text-sm shadow-md overflow-hidden"
          style={{ boxShadow: "3px 3px 0 #1F2024" }}
        >
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              >
                <p className="font-semibold truncate">{r.name}</p>
                {r.address && <p className="text-xs text-muted-foreground truncate">{r.address}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
