import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { categoryIcon, LAHORE_CENTER, LAHORE_ZOOM } from '../utils/leaflet';

// Click on the map to move the location marker.
function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Keeps the map centered when the marker position changes externally (e.g. GPS fix).
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 16);
  }, [map, position?.lat, position?.lng]);
  return null;
}

export default function LocationPickerMap({ position, onSelect }) {
  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : LAHORE_CENTER}
      zoom={LAHORE_ZOOM}
      className="h-72 w-full rounded-xl border border-gray-200"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} />
      <FlyTo position={position} />
      {position && (
        <Marker position={[position.lat, position.lng]} icon={categoryIcon('emerald', true)} />
      )}
    </MapContainer>
  );
}