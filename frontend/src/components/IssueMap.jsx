import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { categoryIcon, LAHORE_CENTER, LAHORE_ZOOM } from '../utils/leaflet';
import { categoryByValue } from '../utils/constants';
import { getImageUrl } from '../services/api';

// Adds a leaflet.markercluster group and syncs it with the issues prop.
function MarkerCluster({ issues }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 45,
      showCoverageOnHover: false,
    });

    issues.forEach((issue) => {
      const [lng, lat] = issue.location.coordinates;
      const marker = L.marker([lat, lng], {
        icon: categoryIcon(iconColor(issue.category)),
      });
      marker.bindPopup(popupHtml(issue));
      group.addLayer(marker);
    });

    groupRef.current = group;
    map.addLayer(group);

    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [map, issues]);

  return null;
}

// Maps category value -> color key used by categoryIcon().
const iconColor = (category) => {
  const colors = { pothole: 'orange', streetlight: 'yellow', garbage: 'green', water: 'blue', other: 'purple' };
  return colors[category] || 'other';
};

const popupHtml = (issue) => {
  const category = categoryByValue(issue.category);
  return `
    <div style="max-width:220px; font-family:system-ui,sans-serif;">
      ${issue.images[0] ? `<img src="${getImageUrl(issue.images[0])}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
      <strong style="font-size:14px;">${issue.title}</strong>
      <div style="font-size:12px;color:#6b7280;">${category.label} · ${issue.status}</div>
      ${issue.address ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">${issue.address}</div>` : ''}
      <div style="font-size:12px;margin-top:4px;">▲ ${issue.upvoteCount} upvote${issue.upvoteCount === 1 ? '' : 's'}</div>
      <a href="/issues/${issue.id}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#2563eb;text-decoration:none;">View details →</a>
    </div>
  `;
};

export default function IssueMap({ issues }) {
  return (
    <MapContainer
      center={LAHORE_CENTER}
      zoom={LAHORE_ZOOM}
      className="h-[60vh] w-full rounded-xl border border-gray-200 shadow-sm"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerCluster issues={issues} />
    </MapContainer>
  );
}