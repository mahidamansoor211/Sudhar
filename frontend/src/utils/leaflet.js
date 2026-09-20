import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';

// Leaflet's default icon images break under bundlers (URLs resolve wrong).
// We use colored divIcons instead, so fix the base default too to be safe.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const COLOR_HEX = {
  orange: '#f97316',
  yellow: '#eab308',
  green: '#16a34a',
  blue: '#0284c7',
  purple: '#9333ea',
  emerald: '#059669',
};

// A colored circular pin with an optional emoji/label, used for category markers.
export const categoryIcon = (colorKey, isDraggable = false) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:${isDraggable ? 34 : 28}px; height:${isDraggable ? 34 : 28}px;
        background:${COLOR_HEX[colorKey] || '#6b7280'};
        border:3px solid white; border-radius:50% 50% 50% 0;
        transform:rotate(-45deg); box-shadow:0 2px 5px rgba(0,0,0,.4);
      ">
        <div style="transform:rotate(45deg); width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:${isDraggable ? 16 : 13}px; color:#fff;"></div>
      </div>`,
    iconSize: isDraggable ? [34, 34] : [28, 28],
    iconAnchor: isDraggable ? [17, 34] : [14, 28],
    popupAnchor: isDraggable ? [0, -34] : [0, -28],
  });

export const LAHORE_CENTER = [31.5204, 74.3587];
export const LAHORE_ZOOM = 12;