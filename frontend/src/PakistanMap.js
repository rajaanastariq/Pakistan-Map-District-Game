// frontend/src/PakistanMap.js
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Papa from "papaparse";
import PakistanFlag from "./map.png"; // local flag
import "./PakistanMap.css";

// hide default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;

// centroid helper
function centroidOfRing(ring) {
  let area = 0,
    cx = 0,
    cy = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const a = x0 * y1 - x1 * y0;
    area += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }
  area = area / 2;
  if (Math.abs(area) < 1e-9) {
    const sum = ring.reduce(
      (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
      [0, 0]
    );
    return [sum[0] / ring.length, sum[1] / ring.length];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

function getCentroid(geometry) {
  if (!geometry) return [69.3451, 30.3753];
  if (geometry.type === "Polygon") return centroidOfRing(geometry.coordinates[0]);
  if (geometry.type === "MultiPolygon") {
    let best = null,
      bestArea = -Infinity;
    for (const poly of geometry.coordinates) {
      const ring = poly[0];
      let area = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        area += x0 * y1 - x1 * y0;
      }
      const absArea = Math.abs(area / 2);
      if (absArea > bestArea) {
        bestArea = absArea;
        best = ring;
      }
    }
    if (best) return centroidOfRing(best);
  }
  return [69.3451, 30.3753];
}

// zoom controller
function MapController({ provinceGeo, selectedProvince }) {
  const map = useMap();
  useEffect(() => {
    if (!provinceGeo) return;
    if (!selectedProvince || selectedProvince === "All Pakistan") {
      const layer = L.geoJSON(provinceGeo);
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [40, 40] });
      return;
    }
    const norm = (s = "") =>
      s.toString().toLowerCase().replace(/[\W_]+/g, "").trim();
    const want = norm(selectedProvince);
    const found = provinceGeo.features.find((f) => {
      const nm = norm(f.properties?.NAME_1 || "");
      return nm === want || nm.includes(want) || want.includes(nm);
    });
    if (found) {
      const lay = L.geoJSON(found);
      const bounds = lay.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [provinceGeo, selectedProvince, map]);
  return null;
}

function escapeHtml(s = "") {
  return s
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function PakistanMap() {
  const [districts, setDistricts] = useState([]);
  const [guessed, setGuessed] = useState([]);
  const [guess, setGuess] = useState("");
  const [provinceGeo, setProvinceGeo] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState("All Pakistan");
  const [modalOpen, setModalOpen] = useState(false);

  // load CSV
  useEffect(() => {
    Papa.parse("/pakistan_districts_clean.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const raw = results.data || [];
        const cleaned = raw
          .map((r) => {
            let prov = (r.province || "").toString().trim();
            if (/f\.?a\.?t\.?a|federally|tribal/i.test(prov))
              prov = "Khyber Pakhtunkhwa";
            if (/islamabad|capital/i.test(prov)) prov = "";
            return {
              ...r,
              province: prov,
              district: (r.district || "").trim(),
            };
          })
          .filter((r) => r.province && r.district && r.latitude && r.longitude);
        setDistricts(cleaned);
      },
    });
  }, []);

  // load GeoJSON
  useEffect(() => {
    fetch("/pakistan_provinces_clean.json")
      .then((r) => r.json())
      .then((g) => {
        if (!g?.features) return setProvinceGeo(null);
        const keepNames = [
          "punjab",
          "sindh",
          "khyber",
          "baloch",
          "gilgit",
          "azad",
          "jammu",
        ];
        const filtered = g.features.filter((f) => {
          const nm = (f.properties?.NAME_1 || "").toLowerCase();
          if (/islamabad|capital|fata|tribal/i.test(nm)) return false;
          return keepNames.some((k) => nm.includes(k));
        });
        setProvinceGeo({ type: "FeatureCollection", features: filtered });
      });
  }, []);

  const handleGuess = (e) => {
    e.preventDefault();
    const normalized = guess.trim().toLowerCase();
    if (!normalized) {
      setGuess("");
      return;
    }
    const found = districts.find(
      (d) =>
        d.district.toLowerCase() === normalized &&
        !guessed.some((g) => g.district === d.district) &&
        (selectedProvince === "All Pakistan" || d.province === selectedProvince)
    );
    if (found) setGuessed((s) => [...s, found]);
    setGuess("");
  };

  const desiredOrder = [
    "Punjab",
    "Khyber Pakhtunkhwa",
    "Sindh",
    "Azad Jammu and Kashmir",
    "Balochistan",
    "Gilgit-Baltistan",
  ];
  const provinceOptions = desiredOrder.filter((prov) =>
    districts.some((d) => d.province === prov)
  );

  const missed =
    (selectedProvince === "All Pakistan"
      ? districts
      : districts.filter((d) => d.province === selectedProvince)
    ).filter((d) => !guessed.some((g) => g.district === d.district));

  const styleForFeature = (feature) => {
    const nm = (feature.properties?.NAME_1 || "").toLowerCase();
    const sel = (selectedProvince || "").toLowerCase();
    const isSelected =
      selectedProvince !== "All Pakistan" &&
      (nm === sel || nm.includes(sel) || sel.includes(nm));
    return {
      fillColor: isSelected ? "#0b6623" : "#2e7d32",
      color: isSelected ? "#083e2b" : "#145a32",
      weight: isSelected ? 3 : 1,
      fillOpacity: isSelected ? 0.6 : 0.22,
    };
  };

  return (
    <div className="pm-root">
      {/* LEFT PANEL */}
      <div className="pm-left">
        <div className="pm-brand">
          <h1 className="pm-title">
            <img
              src={PakistanFlag}
              alt="Pakistan Flag"
              className="pm-flag-icon"
            />
            Pakistan Guessing Game
          </h1>
          <div className="pm-sub">
            Type district names — correct ones appear on the map
          </div>
        </div>

        {/* Province selection */}
        <div className="pm-section">
          <div className="pm-section-title">Select Province</div>

          <button
            className={`prov-btn allpak ${
              selectedProvince === "All Pakistan" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedProvince("All Pakistan");
              setGuessed([]);
            }}
          >
            All Pakistan
          </button>

          <div className="pm-province-grid-2cols">
            {provinceOptions.map((prov, idx) => (
              <button
                key={idx}
                className={`prov-btn ${
                  selectedProvince === prov ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedProvince(prov);
                  setGuessed([]);
                }}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="pm-score">
          <span className="pm-section-title">Score</span>
          <strong>
            {guessed.length} /{" "}
            {selectedProvince === "All Pakistan"
              ? districts.length
              : districts.filter((d) => d.province === selectedProvince).length}
          </strong>
        </div>

        {/* Guess input */}
        <form onSubmit={handleGuess} className="pm-guess-form">
          <input
            className="pm-input"
            placeholder="Enter district name..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <div className="pm-guess-actions">
            <button type="submit" className="pm-btn primary">
              Guess
            </button>
            <button
              type="button"
              className="pm-btn ghost"
              onClick={() => setModalOpen(true)}
            >
              🏳️ Give Up
            </button>
          </div>
        </form>

        <p className="pm-tip">
          💡 Click on <strong>Give Up</strong> to see which districts you missed.
        </p>
      </div>

      {/* MAP */}
      <div className="pm-map">
        <MapContainer
          center={[30.3753, 69.3451]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution="&copy; OSM &copy; CARTO"
          />
          {provinceGeo && (
            <GeoJSON
              data={provinceGeo}
              style={styleForFeature}
              onEachFeature={(feature, layer) => {
                layer.on("click", () => {
                  const nm = (feature.properties?.NAME_1 || "").toString();
                  setSelectedProvince(nm);
                  setGuessed([]);
                });
              }}
            />
          )}

          {/* Province names auto-fit boxes */}
          {provinceGeo?.features.map((feat, i) => {
            const [lng, lat] = getCentroid(feat.geometry);
            return (
              <Marker
                key={`prov-${i}`}
                position={[lat, lng]}
                icon={L.divIcon({
                  html: `<div class="province-label-box">${escapeHtml(
                    feat.properties?.NAME_1 || ""
                  )}</div>`,
                  className: "",
                })}
                interactive={false}
              />
            );
          })}

          {/* District names in red */}
          {guessed.map((d, i) => {
            const lat = parseFloat(d.latitude);
            const lng = parseFloat(d.longitude);
            if (!isFinite(lat) || !isFinite(lng)) return null;
            return (
              <Marker
                key={`g-${i}`}
                position={[lat, lng]}
                icon={L.divIcon({
                  html: `<span class="district-label-red">${escapeHtml(
                    d.district
                  )}</span>`,
                  className: "",
                })}
                interactive={false}
              />
            );
          })}

          <MapController
            provinceGeo={provinceGeo}
            selectedProvince={selectedProvince}
          />
        </MapContainer>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="pm-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>❌ Districts you missed</h2>
            <div className="pm-missed-grid">
              {Object.entries(
                missed.reduce((acc, d) => {
                  acc[d.province] = acc[d.province] || [];
                  acc[d.province].push(d.district);
                  return acc;
                }, {})
              ).map(([prov, list]) => (
                <div className="pm-missed-prov" key={prov}>
                  <div className="pm-missed-prov-title">{prov}</div>
                  <ul>
                    {list.map((x, idx) => (
                      <li key={idx}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pm-modal-controls">
              <button
                className="pm-btn dashed"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
