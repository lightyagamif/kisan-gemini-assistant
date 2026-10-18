import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { ColdRoom } from "@/lib/data";

const icon = L.divIcon({ className: "", html: '<div style="font-size:26px;line-height:26px;filter:drop-shadow(0 1px 1px #0006)">❄️</div>', iconSize: [26, 26], iconAnchor: [13, 13] });

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 11 }); }, [map, pts]);
  return null;
}

export default function ColdMap({ rooms, me, onPick }: { rooms: (ColdRoom & { km: number })[]; me: [number, number]; onPick: (r: ColdRoom) => void }) {
  const pts: [number, number][] = [me, ...rooms.map((r) => [r.lat, r.lng] as [number, number])];
  return (
    <MapContainer center={me} zoom={9} className="h-64 w-full rounded-lg" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={me} radius={8} pathOptions={{ color: "#1B4332", fillColor: "#B08938", fillOpacity: 1 }}><Popup>You are here</Popup></CircleMarker>
      {rooms.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={icon}>
          <Popup><b>{r.name}</b><br />₹{r.rate_per_crate_day}/crate/day · {r.free} slots · {r.km.toFixed(1)} km<br /><button style={{ color: "#1B4332", fontWeight: 700, textDecoration: "underline" }} onClick={() => onPick(r)}>Book slot</button></Popup>
        </Marker>
      ))}
      <Fit pts={pts} />
    </MapContainer>
  );
}
