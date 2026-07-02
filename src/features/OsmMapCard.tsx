/**
 * OpenStreetMap embed card. Dependency-free (iframe embed, attribution
 * included by OSM). The pin marks a postcode/city centroid — approximate
 * by nature, and the caption says so.
 */
export function OsmMapCard({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const dLon = 0.012;
  const dLat = 0.006;
  const bbox = [longitude - dLon, latitude - dLat, longitude + dLon, latitude + dLat].join(",");
  const embedSrc =
    `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}` +
    `&layer=mapnik&marker=${latitude},${longitude}`;
  const largeMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;

  return (
    <div className="osm-card">
      <iframe
        src={embedSrc}
        title={`Map of ${label}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="osm-card__footer">
        <span>Approximate area — {label}. The pin is not the exact branch address.</span>
        <a href={largeMapUrl} target="_blank" rel="noopener noreferrer">
          View larger map
        </a>
      </div>
    </div>
  );
}
