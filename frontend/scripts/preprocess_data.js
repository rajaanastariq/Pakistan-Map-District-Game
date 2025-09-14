// frontend/scripts/preprocess_data.js
// Node script to:
//  - merge FATA polygons into Khyber Pakhtunkhwa
//  - remove Islamabad
//  - produce cleaned files in frontend/public:
//      pakistan_provinces_clean.json
//      pakistan_districts_clean.csv

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", ".."); // assumes script is in frontend/scripts
const csvDir = path.join(projectRoot, "csv"); // raw files located at <projectRoot>/csv
const inProvinces = path.join(csvDir, "pakistan_provinces.json");
const inDistricts = path.join(csvDir, "pakistan_districts.csv");

const outDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outProvinces = path.join(outDir, "pakistan_provinces_clean.json");
const outDistricts = path.join(outDir, "pakistan_districts_clean.csv");

if (!fs.existsSync(inProvinces) || !fs.existsSync(inDistricts)) {
  console.error("❌ Input files not found. Put raw files in:", csvDir);
  process.exit(1);
}

const rawProvinces = JSON.parse(fs.readFileSync(inProvinces, "utf8"));
const rawDistrictCsv = fs.readFileSync(inDistricts, "utf8");

// Helper utilities
const norm = (s) => (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();

// 1) Merge FATA into Khyber Pakhtunkhwa and remove Islamabad
const features = rawProvinces.features || [];

// find KPK candidate (search by substring 'khyber')
const kpkIndex = features.findIndex((f) =>
  /khyber/i.test(f.properties?.NAME_1 || "")
);

if (kpkIndex === -1) {
  console.warn("⚠️ Could not find Khyber Pakhtunkhwa feature by name. Merging FATA will be skipped.");
}

// locate FATA features (multiple naming variants)
const fataIndexes = [];
features.forEach((f, idx) => {
  const name = f.properties?.NAME_1 || "";
  if (/f\.?a\.?t\.?a|federally\s+administered|tribal\s+areas|fata/i.test(name)) {
    fataIndexes.push(idx);
  }
});

// merge geometries from FATA features into KPK
if (kpkIndex !== -1 && fataIndexes.length) {
  const kpk = features[kpkIndex];

  // helper to make geometry into MultiPolygon coordinates array
  const toMultiCoords = (geom) => {
    if (!geom) return [];
    if (geom.type === "Polygon") {
      // Polygon => [ [ ring0, ring1... ] ]
      return [geom.coordinates];
    }
    if (geom.type === "MultiPolygon") {
      return geom.coordinates;
    }
    return [];
  };

  let kpkCoords = toMultiCoords(kpk.geometry);

  fataIndexes.forEach((fi) => {
    const fgeom = features[fi].geometry;
    const fcoords = toMultiCoords(fgeom);
    // append each polygon of FATA into KPK coords
    kpkCoords = kpkCoords.concat(fcoords);
  });

  // write back merged MultiPolygon into KPK geometry
  kpk.geometry = {
    type: "MultiPolygon",
    coordinates: kpkCoords,
  };

  console.log(`✅ Merged ${fataIndexes.length} FATA feature(s) into Khyber Pakhtunkhwa.`);
}

// Filter out Islamabad and FATA features
const keepNames = [
  "punjab",
  "sindh",
  "khyber",
  "balochistan",
  "gilgit",
  "azad",
  "azad jammu", // some variants
  "azad jammu and kashmir",
];
const cleanedFeatures = features.filter((f, idx) => {
  const n = (f.properties?.NAME_1 || "").toString();
  const nl = n.toLowerCase();

  // drop Islamabad
  if (/islamabad|capital/i.test(nl)) return false;

  // drop FATA (we already merged)
  if (/f\.?a\.?t\.?a|federally\s+administered|tribal\s+areas/i.test(nl)) return false;

  // keep only allowed provinces by checking substrings
  const keep = keepNames.some((k) => nl.includes(k));
  return keep;
});

const provincesClean = {
  type: "FeatureCollection",
  features: cleanedFeatures,
};

fs.writeFileSync(outProvinces, JSON.stringify(provincesClean, null, 2), "utf8");
console.log("✅ provinces cleaned ->", outProvinces);

// 2) Clean districts CSV: map any FATA province -> Khyber Pakhtunkhwa; remove Islamabad rows
// robust CSV line parser (handles quoted commas)
function parseLine(line) {
  const res = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      res.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  res.push(cur);
  return res;
}
function csvEscape(field) {
  if (field == null) return "";
  const s = field.toString();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const lines = rawDistrictCsv.split(/\r?\n/).filter((ln) => ln.trim() !== "");
const header = lines.shift();
const headerCols = parseLine(header);
const provinceCol = headerCols.findIndex((c) => /province/i.test(c));
if (provinceCol === -1) {
  console.warn("⚠️ Could not detect province column in district CSV header. Provinces will not be modified.");
}

const cleanedRows = [];
lines.forEach((ln) => {
  const parts = parseLine(ln);
  const provRaw = provinceCol >= 0 ? (parts[provinceCol] || "") : "";
  const provNorm = provRaw.toString().toLowerCase();

  // skip Islamabad
  if (/islamabad|capital/i.test(provNorm)) return;

  // map FATA -> Khyber Pakhtunkhwa
  if (/f\.?a\.?t\.?a|federally\s+administered|tribal\s+areas/i.test(provNorm)) {
    if (provinceCol >= 0) parts[provinceCol] = "Khyber Pakhtunkhwa";
  }

  // only keep rows whose province matches allowed list
  const keep = keepNames.some((k) => (parts[provinceCol] || "").toLowerCase().includes(k));
  if (!keep) return;

  cleanedRows.push(parts.map(csvEscape).join(","));
});

const outCsv = [header, ...cleanedRows].join("\n");
fs.writeFileSync(outDistricts, outCsv, "utf8");
console.log("✅ districts cleaned ->", outDistricts);

console.log("🎉 Preprocessing complete. Now start your frontend (npm start) and the backend (uvicorn) if needed.");
