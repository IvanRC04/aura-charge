"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_CENTER: [number, number] = [39.4827, -0.3447]; // UPV Vera campus, Valencia
const DEFAULT_ZOOM = 14;

function auraIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="aura-marker"><span>⚡</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type MapPickerProps = {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
};

export function MapPicker({ value, onChange }: MapPickerProps) {
  const icon = useMemo(() => auraIcon(), []);
  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        subdomains={["a", "b", "c", "d"]}
      />
      <ClickHandler onPick={onChange} />
      {value && (
        <>
          <Recenter lat={value.lat} lng={value.lng} />
          <Marker
            position={[value.lat, value.lng]}
            icon={icon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                onChange(ll.lat, ll.lng);
              },
            }}
          />
        </>
      )}
    </MapContainer>
  );
}

type GeoResult = { lat: number; lng: number; address: string };

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,
      { headers: { "User-Agent": "aura-charge-demo/1.0" } },
    );
    if (!r.ok) return null;
    const json = (await r.json()) as { display_name?: string };
    return json.display_name ?? null;
  } catch {
    return null;
  }
}

export async function searchAddress(q: string): Promise<GeoResult | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&accept-language=es&countrycodes=es`,
      { headers: { "User-Agent": "aura-charge-demo/1.0" } },
    );
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!arr.length) return null;
    const first = arr[0]!;
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      address: first.display_name,
    };
  } catch {
    return null;
  }
}
