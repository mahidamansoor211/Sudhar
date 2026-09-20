import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { categoryIcon, LAHORE_CENTER, LAHORE_ZOOM } from '../utils/leaflet';
import { categoryByValue } from '../utils/constants';
import { getImageUrl } from '../services/api';

// leaflet.markercluster is a UMD plugin that augments the *global* Leaflet
// instance, so it must load after window.L is set and can only be imported
// dynamically to guarantee execution order.
let clusterReady = null;
function ensureMarkerCluster() {
  if (L.markerClusterGroup) return Promise.resolve();
  if (!clusterReady) {
    window.L = L;
    clusterReady = import('leaflet.markercluster');
  }
  return clusterReady;
}

// Adds a leaflet.markercluster group and syncs it with the issues prop.
function MarkerCluster({ issues }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    ensureMarkerCluster().then(() => {
      if (disposed) return;
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

      if (disposed) {
        return;
      }
      groupRef.current = group;
      map.addLayer(group);
    });

    return () => {
      disposed = true;
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
      <div style="font-size:12px;margin-top:4px;">${issue.upvoteCount} upvote${issue.upvoteCount === 1 ? '' : 's'}</div>
      <a href="/issues/${issue.id}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#059669;text-decoration:none;">View details →</a>
    </div>
  `;
};

export default function IssueMap({ issues }) {
  return (
    <MapContainer
      center={LAHORE_CENTER}
      zoom={LAHORE_ZOOM}
      className="h-[60vh] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerCluster issues={issues} />
    </MapContainer>
  );
}