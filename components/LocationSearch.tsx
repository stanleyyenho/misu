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
  const [mapOpen, setMapOpen] = useState(false);
  const searchRef = useRef<unknown>(null);
  const geocoderRef = useRef<unknown>(null);
  const mapRef = useRef<unknown>(null);
  const annotationRef = useRef<unknown>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
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
    geocoderRef.current = new window.mapkit.Geocoder({ getsUserLocation: true });
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

  // Initialise interactive map when toggled open
  useEffect(() => {
    if (!mapOpen || !ready || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialised

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapkit = window.mapkit as any;
    const map = new mapkit.Map(mapContainerRef.current, {
      showsUserLocation: true,
      tracksUserLocation: false,
      isRotationEnabled: false,
    });
    mapRef.current = map;

    map.addEventListener("single-tap", (event: { pointOnPage: { x: number; y: number } }) => {
      const coord = map.convertPointOnPageToCoordinate(event.pointOnPage);
      placePin(coord.latitude, coord.longitude);
      reverseGeocodeAndSelect(coord.latitude, coord.longitude);
    });

    // Try to centre on user; fallback to a sensible default.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.region = new mapkit.CoordinateRegion(
            new mapkit.Coordinate(pos.coords.latitude, pos.coords.longitude),
            new mapkit.CoordinateSpan(0.05, 0.05),
          );
        },
        () => {},
        { timeout: 3000 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen, ready]);

  function placePin(lat: number, lng: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapkit = window.mapkit as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapRef.current as any;
    if (!map) return;
    if (annotationRef.current) {
      map.removeAnnotation(annotationRef.current);
      annotationRef.current = null;
    }
    const coord = new mapkit.Coordinate(lat, lng);
    const annotation = new mapkit.MarkerAnnotation(coord, { draggable: true });
    annotation.addEventListener("drag-end", () => {
      reverseGeocodeAndSelect(annotation.coordinate.latitude, annotation.coordinate.longitude);
    });
    annotationRef.current = annotation;
    map.addAnnotation(annotation);
  }

  function reverseGeocodeAndSelect(lat: number, lng: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapkit = window.mapkit as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geocoder = geocoderRef.current as any;
    if (!geocoder) return;
    const coord = new mapkit.Coordinate(lat, lng);
    geocoder.reverseLookup(coord, (err: unknown, data: any) => {
      const place = data?.results?.[0];
      const name = place?.name || place?.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const address = place?.formattedAddress ?? "";
      onChange(name);
      onSelect({ name, address, lat, lng });
    });
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
      <button
        type="button"
        onClick={() => setMapOpen((v) => !v)}
        disabled={!ready}
        className="mt-1.5 text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
      >
        {mapOpen ? "Hide map" : "Or pick on a map"}
      </button>
      {mapOpen && (
        <div
          ref={mapContainerRef}
          className="mt-2 h-64 w-full rounded-[8px] border-2 border-[#1F2024] overflow-hidden"
          style={{ boxShadow: "2px 2px 0 #1F2024" }}
        />
      )}
    </div>
  );
}
