import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ELURU_CENTER, TILE_LAYER_ATTRIBUTION, TILE_LAYER_URL } from '../constants/geo';

const DEFAULT_CENTER = ELURU_CENTER;
const BUS_ICON_URL = '/markers/bus.png';
const STOP_ICON_URL = '/markers/stop.png';

const createIcon = (iconUrl, options = {}) =>
  new L.Icon({
    iconUrl,
    iconSize: options.iconSize || [32, 48],
    iconAnchor: options.iconAnchor || [16, 46],
    popupAnchor: options.popupAnchor || [0, -36],
    className: options.className
  });

const busIcon = createIcon(BUS_ICON_URL, {
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const stopIcon = createIcon(STOP_ICON_URL, {
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const FitBounds = ({ busPosition, stopPosition }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const targets = [busPosition, stopPosition].filter(Boolean);
    if (!targets.length) return;
    if (targets.length === 1) {
      map.setView(targets[0], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(targets.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds.pad(0.25), { animate: true });
  }, [busPosition, stopPosition, map]);
  return null;
};

const AnimatedMarker = ({ position, icon, popupText, children }) => {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  if (!position) return null;
  return (
    <Marker ref={markerRef} position={position} icon={icon} title={popupText}>
      {children}
    </Marker>
  );
};

const StudentMap = ({ busPosition, stopPosition, routeGeojson, routeStops = [], allEtas = {}, studentStopSeq }) => {
  const center = useMemo(() => busPosition || stopPosition || DEFAULT_CENTER, [busPosition, stopPosition]);

  // Provide a key so GeoJSON re-renders if routeGeojson changes
  const geojsonKey = useMemo(() => {
    return routeGeojson ? JSON.stringify(routeGeojson).length : 'empty';
  }, [routeGeojson]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Live map</p>
          <p className="text-sm text-slate-600">Bus & your stop plotted on OpenStreetMap</p>
        </div>
      </div>
      <MapContainer center={center} zoom={15} minZoom={5} className="h-80 w-full" scrollWheelZoom>
        <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />
        {routeGeojson && (
          <GeoJSON 
            key={geojsonKey} 
            data={routeGeojson} 
            style={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} 
          />
        )}
        <AnimatedMarker position={busPosition} icon={busIcon} popupText="Bus" />
        
        {/* Render all stops */}
        {routeStops.map(stop => {
          const isStudentStop = String(stop.seq) === String(studentStopSeq);
          const etaMs = allEtas[stop.seq];
          const etaText = typeof etaMs === 'number' 
            ? `${Math.ceil(etaMs / 60000)} min`
            : '';
            
          return (
            <AnimatedMarker 
              key={stop._id || stop.seq} 
              position={{ lat: stop.lat, lng: stop.lng }} 
              icon={stopIcon}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={isStudentStop}>
                <div className="text-center">
                  <div className="font-semibold text-slate-800">{stop.name}</div>
                  {etaText && (
                    <div className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full mt-1 border border-orange-200">
                      ETA: {etaText}
                    </div>
                  )}
                  {isStudentStop && (
                    <div className="text-[10px] text-blue-600 font-bold mt-0.5 uppercase tracking-wider">Your Stop</div>
                  )}
                </div>
              </Tooltip>
            </AnimatedMarker>
          );
        })}

        <FitBounds busPosition={busPosition} stopPosition={stopPosition} />
      </MapContainer>
    </section>
  );
};

export default StudentMap;
