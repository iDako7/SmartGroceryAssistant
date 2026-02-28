import { useState, useEffect, useRef } from "react";

// ─── SVG Icons ───
const Plus = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const Check = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const Trash = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const ChevDown = ({ size = 18, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    style={style}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const Sparkles = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
  </svg>
);
const SettingsIco = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const EditIco = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const Clock = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPin = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const X = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const Bulb = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M9 18h6M10 22h4M12 2a7 7 0 014 12.7V17H8v-2.3A7 7 0 0112 2z" />
  </svg>
);
const Info = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const Swap = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);
const Loader = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M12 2a10 10 0 010 20 10 10 0 010-20" strokeDasharray="30 60" />
  </svg>
);

// ─── Constants & Helpers ───
const uid = () => Math.random().toString(36).slice(2, 10);
const AC = "#4CAF50",
  AC_L = "#E8F5E9",
  SG_BG = "#FFF8E1",
  SG_BD = "#FFE082",
  INS_BG = "#F3E5F5",
  INS_BD = "#CE93D8";
const DIETS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Halal",
  "Kosher",
  "Low-carb",
  "Keto",
];
const LANGS = [
  { id: "en", label: "English only" },
  { id: "en-zh", label: "English + 简体中文" },
];

function dn(en, zh, lang) {
  return lang === "en-zh" && zh ? `${en} / ${zh}` : en;
}

// ─── Test Scenarios ───
const SCENARIOS = [
  {
    id: "mei",
    tab: "🥢 Mei & Jing",
    desc: "Chinese couple — Costco run",
    profile: {
      dietary: [],
      household: "2",
      taste: "Chinese cuisine, home-style cooking, stir-fry, noodle soups",
      language: "en-zh",
    },
    sections: [
      {
        id: "s_m1",
        name: "Costco",
        collapsed: false,
        smartData: null,
        viewMode: null,
        items: [
          {
            id: "m1",
            name_en: "Chicken Breast",
            name_zh: "鸡胸肉",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m2",
            name_en: "Tomatoes",
            name_zh: "西红柿",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m3",
            name_en: "Rice Noodles",
            name_zh: "米粉",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m4",
            name_en: "Celery",
            name_zh: "芹菜",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m5",
            name_en: "Potatoes",
            name_zh: "土豆",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
        ],
      },
    ],
  },
  {
    id: "kevin",
    tab: "🍗 Kevin",
    desc: "Solo dev — meal-prep rut",
    profile: {
      dietary: [],
      household: "1",
      taste: "Healthy eating, open to new cuisines, easy meal prep",
      language: "en",
    },
    sections: [
      {
        id: "s_k1",
        name: "Walmart",
        collapsed: false,
        smartData: null,
        viewMode: null,
        items: [
          {
            id: "k1",
            name_en: "Chicken Breast",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "k2",
            name_en: "Broccoli",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "k3",
            name_en: "Rice",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "k4",
            name_en: "Eggs",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
        ],
      },
    ],
  },
  {
    id: "sarah",
    tab: "🔥 Sarah & Dave",
    desc: "BBQ party for 12",
    profile: {
      dietary: [],
      household: "4+",
      taste: "BBQ party for 12 guests, crowd-pleasing, easy to grill",
      language: "en",
    },
    sections: [
      {
        id: "s_s1",
        name: "BBQ Weekend",
        collapsed: false,
        smartData: null,
        viewMode: null,
        items: [
          {
            id: "b1",
            name_en: "Burger Patties",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "b2",
            name_en: "Hot Dog Buns",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "b3",
            name_en: "Hot Dogs",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "b4",
            name_en: "Ketchup",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "b5",
            name_en: "Mustard",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
        ],
      },
      {
        id: "s_s2",
        name: "Costco",
        collapsed: false,
        smartData: null,
        viewMode: null,
        items: [
          {
            id: "c1",
            name_en: "Chips",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "c2",
            name_en: "Bottled Water",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "c3",
            name_en: "Paper Plates",
            name_zh: "",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
        ],
      },
    ],
  },
];

// ─── Storage ───
async function load(k, fb) {
  try {
    const r = await window.storage.get(k);
    return r ? JSON.parse(r.value) : fb;
  } catch {
    return fb;
  }
}
async function save(k, v) {
  try {
    await window.storage.set(k, JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
}

// ─── API: Translate ───
async function translateItem(input, lang) {
  if (lang !== "en-zh") return { name_en: input, name_zh: "" };
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Translate this grocery item. If Chinese give English. If English give Chinese Simplified. If other give both.\nInput: "${input}"\nRespond ONLY JSON no backticks: {"name_en":"...","name_zh":"..."}`,
          },
        ],
      }),
    });
    const d = await r.json();
    const t = d.content.map((c) => c.text || "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  } catch {
    return { name_en: input, name_zh: "" };
  }
}

// ─── API: Suggest ───
async function fetchSuggestions(allSections, targetId, profile) {
  const tgt = allSections.find((s) => s.id === targetId);
  if (!tgt) return null;
  const all = allSections.flatMap((s) =>
    s.items.map((i) => ({ en: i.name_en, zh: i.name_zh, sec: s.name })),
  );
  const tItems = tgt.items.map(
    (i) => `${i.name_en}${i.name_zh ? " / " + i.name_zh : ""}`,
  );
  const bi = profile?.language === "en-zh";
  const pStr = profile
    ? `Dietary: ${(profile.dietary || []).join(", ") || "none"}. Household: ${profile.household || "?"}. Preferences: ${profile.taste || "none"}.`
    : "No profile.";

  const prompt = `You are a smart grocery assistant. Analyze the list and suggest items.

User profile: ${pStr}

All items across sections:
${all.map((i) => `- "${i.en}${i.zh ? " / " + i.zh : ""}" (in "${i.sec}")`).join("\n")}

Target section: "${tgt.name}"
Items in target: ${tItems.join(", ") || "(empty)"}

Steps:
1. GAP ANALYSIS: nutritional/category gaps (proteins, vegetables, carbs, dairy, seasonings)
2. CULTURAL MATCH: what fills gaps given user background
3. RECIPE BRIDGE: how suggested items connect to existing items, what dishes can be made

Respond ONLY valid JSON no markdown no backticks:
{
  "reason":"1-2 sentence summary",
  "clusters":[
    {"name":"Dish name","emoji":"🍜","desc":"Max 10 words",
     "items":[
       {"name_en":"Item","name_zh":"${bi ? "中文名" : ""}","existing":true,"why":""},
       {"name_en":"Suggested","name_zh":"${bi ? "中文名" : ""}","existing":false,"why":"Max 15 words"}
     ]}
  ],
  "ungrouped":[{"name_en":"Item","name_zh":"${bi ? "中文名" : ""}","existing":true}],
  "storeLayout":[{"category":"Aisle name","emoji":"🥩","items":[{"name_en":"Item","name_zh":"${bi ? "中文名" : ""}","existing":true}]}]
}

Rules:
- 2-4 recipe clusters, each with 1+ existing items and 1-2 suggested
- 3-6 NEW items total, not in ANY section
- Every existing target item in exactly one cluster or ungrouped
- storeLayout groups ALL items by store department
${bi ? "- Provide name_zh for ALL items" : "- name_zh empty string"}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    const t = d.content.map((c) => c.text || "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─── API: Inspire ───
async function fetchInspire(item, allItems, profile) {
  const bi = profile?.language === "en-zh";
  const prompt = `Creative cooking assistant. User has "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}".

Profile: ${(profile?.dietary || []).join(", ") || "none"} diet. Household: ${profile?.household || "?"}. Prefs: ${profile?.taste || "none"}.
Other items: ${allItems.map((i) => i.name_en).join(", ")}

3 recipe ideas using this item. Each needs 2-3 extra ingredients NOT in their list.
ONLY JSON no markdown:
{"recipes":[{"name":"Name","name_zh":"${bi ? "中文名" : ""}","emoji":"🍳","desc":"Max 8 words","add":[{"name_en":"Item","name_zh":"${bi ? "中文名" : ""}"}]}]}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    const t = d.content.map((c) => c.text || "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─── API: Item Info ───
async function fetchItemInfo(item, profile) {
  const bi = profile?.language === "en-zh";
  const prompt = `You are a grocery expert helping an immigrant/international student understand a product they may not be familiar with.

Item: "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}"
User background: ${profile?.taste || "not specified"}

Provide a helpful overview of this grocery item. Respond ONLY with JSON, no markdown:
{
  "taste":"What does it taste like? 1 sentence${bi ? ". In both English and Chinese." : ""}",
  "usage":"How is it commonly used in cooking? 1-2 sentences${bi ? ". In both English and Chinese." : ""}",
  "picking":"How to pick a good one at the store? 1 sentence${bi ? ". In both English and Chinese." : ""}",
  "storage":"How to store it and how long does it last? 1 sentence${bi ? ". In both English and Chinese." : ""}",
  "funFact":"One interesting or cultural fact about it. 1 sentence${bi ? ". In both English and Chinese." : ""}"
}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    const t = d.content.map((c) => c.text || "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─── API: Find Alternatives ───
async function fetchAlternatives(item, profile) {
  const bi = profile?.language === "en-zh";
  const prompt = `You are a grocery expert helping someone find alternatives/replacements for an item that may be hard to find in North American stores (Costco, Walmart, Safeway, etc).

Item: "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}"
User background: ${profile?.taste || "not specified"}

Suggest 3-4 alternatives that are easier to find in typical North American grocery stores. Consider similar taste, texture, and cooking use.

Respond ONLY JSON no markdown:
{"note":"1 sentence why alternatives might be needed${bi ? ". English and Chinese." : ""}","alts":[{"name_en":"Name","name_zh":"${bi ? "中文名" : ""}","match":"How similar - e.g. Very close, Similar texture, Different but works","desc":"1 sentence on how it compares and how to use it${bi ? ". English and Chinese." : ""}","where":"Where to find it in store - e.g. Asian aisle, Pasta section"}]}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    const t = d.content.map((c) => c.text || "").join("");
    return JSON.parse(t.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─── Chip ───
function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        border: `1.5px solid ${selected ? AC : "#ddd"}`,
        background: selected ? AC_L : "#fff",
        color: selected ? "#2E7D32" : "#555",
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ─── Onboarding ───
function Onboarding({ onComplete, onSkip, initial }) {
  const [diet, setDiet] = useState(initial?.dietary || []);
  const [hh, setHh] = useState(initial?.household || "2");
  const [taste, setTaste] = useState(initial?.taste || "");
  const [lang, setLang] = useState(initial?.language || "en");
  const toggle = (d) =>
    setDiet((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAFA",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 20,
          padding: "32px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🛒</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            Welcome to Smart Grocery
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Personalize your shopping experience
          </p>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              display: "block",
              marginBottom: 6,
            }}
          >
            Language / 语言
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: `1.5px solid ${lang === l.id ? AC : "#ddd"}`,
                  background: lang === l.id ? AC_L : "#fff",
                  color: lang === l.id ? "#2E7D32" : "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              display: "block",
              marginBottom: 6,
            }}
          >
            Dietary Restrictions
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DIETS.map((d) => (
              <Chip
                key={d}
                label={d}
                selected={diet.includes(d)}
                onClick={() => toggle(d)}
              />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              display: "block",
              marginBottom: 6,
            }}
          >
            Household Size
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {["1", "2", "3", "4+"].map((h) => (
              <button
                key={h}
                onClick={() => setHh(h)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: `1.5px solid ${hh === h ? AC : "#ddd"}`,
                  background: hh === h ? AC_L : "#fff",
                  color: hh === h ? "#2E7D32" : "#555",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#555",
              display: "block",
              marginBottom: 6,
            }}
          >
            Taste Preferences
          </label>
          <input
            value={taste}
            onChange={(e) => setTaste(e.target.value)}
            placeholder="e.g., Chinese cuisine, spicy, meal prep..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1.5px solid #ddd",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() =>
            onComplete({ dietary: diet, household: hh, taste, language: lang })
          }
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 14,
            border: "none",
            background: AC,
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          Create Profile
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 14,
            border: "1.5px solid #ddd",
            background: "#fff",
            color: "#888",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Inspire Card ───
function InspireCard({ data, lang, onAddRecipe }) {
  return (
    <div
      style={{
        margin: "4px 0 8px 34px",
        padding: 12,
        background: INS_BG,
        borderRadius: 12,
        border: `1px solid ${INS_BD}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#7B1FA2",
          marginBottom: 8,
        }}
      >
        💡 Recipe Ideas
      </div>
      {data.recipes.map((r, i) => (
        <div
          key={i}
          style={{
            padding: "8px 0",
            borderBottom:
              i < data.recipes.length - 1 ? "1px solid #E1BEE7" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {r.emoji} {dn(r.name, r.name_zh, lang)}
              </span>
              <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>
                {r.desc}
              </div>
            </div>
            <button
              onClick={() => onAddRecipe(r)}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: "#9C27B0",
                color: "#fff",
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + Add All
            </button>
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}
          >
            {r.add.map((a, j) => (
              <span
                key={j}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "#F3E5F5",
                  color: "#7B1FA2",
                }}
              >
                + {dn(a.name_en, a.name_zh, lang)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Qty Badge (tap to edit) ───
function QtyBadge({ qty, onChange }) {
  const [open, setOpen] = useState(false);
  const q = qty || 1;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          background: "#F5F5F5",
          border: "1px solid #e0e0e0",
          fontSize: 11,
          fontWeight: 700,
          color: "#666",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
          flexShrink: 0,
        }}
      >
        {q}
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 24px",
              boxShadow: "0 8px 30px rgba(0,0,0,.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              minWidth: 180,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
              Quantity
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => onChange(Math.max(1, q - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: "1.5px solid #ddd",
                  background: "#f9f9f9",
                  fontSize: 20,
                  color: "#555",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  minWidth: 30,
                  textAlign: "center",
                }}
              >
                {q}
              </span>
              <button
                onClick={() => onChange(q + 1)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: `1.5px solid ${AC}`,
                  background: AC_L,
                  fontSize: 20,
                  color: "#2E7D32",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "8px 24px",
                borderRadius: 10,
                background: AC,
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Alternatives Button ───
function AlternativesButton({ item, lang, profile, onReplace }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (data) return;
    setLoading(true);
    const r = await fetchAlternatives(item, profile);
    setData(r);
    setLoading(false);
  };

  const matchColor = (m) => {
    const ml = (m || "").toLowerCase();
    if (ml.includes("very close")) return { bg: "#E8F5E9", color: "#2E7D32" };
    if (ml.includes("similar")) return { bg: "#FFF8E1", color: "#F9A825" };
    return { bg: "#FBE9E7", color: "#E64A19" };
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Find alternatives"
        style={{
          padding: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#aaa",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Swap size={13} />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "24px 20px",
              maxWidth: 400,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}
                >
                  🔄 Alternatives
                </div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  Replacements for {dn(item.name_en, item.name_zh, lang)}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  border: "none",
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <X size={16} />
              </button>
            </div>
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  color: "#999",
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Loader size={20} />
                <span>Finding alternatives...</span>
              </div>
            ) : data ? (
              <div>
                {data.note && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#8D6E63",
                      fontStyle: "italic",
                      padding: "8px 12px",
                      background: "#FFF8E1",
                      borderRadius: 10,
                      marginBottom: 12,
                    }}
                  >
                    {data.note}
                  </div>
                )}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {(data.alts || []).map((alt, i) => {
                    const mc = matchColor(alt.match);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 12,
                          background: "#F9FAFB",
                          borderRadius: 12,
                          border: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#1a1a1a",
                            }}
                          >
                            {dn(alt.name_en, alt.name_zh, lang)}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: mc.bg,
                              color: mc.color,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {alt.match}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#555",
                            lineHeight: 1.5,
                            marginBottom: 6,
                          }}
                        >
                          {alt.desc}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#999" }}>
                            📍 {alt.where}
                          </span>
                          <button
                            onClick={() => {
                              onReplace(alt);
                              setOpen(false);
                            }}
                            style={{
                              padding: "4px 12px",
                              borderRadius: 8,
                              background: AC,
                              color: "#fff",
                              border: "none",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Use This
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#999",
                  fontSize: 13,
                }}
              >
                Could not load alternatives.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Item Info Popup ───
function ItemInfoButton({ item, lang, profile }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (data) return;
    setLoading(true);
    const r = await fetchItemInfo(item, profile);
    setData(r);
    setLoading(false);
  };

  const rows = [
    { icon: "👅", label: "Taste", key: "taste" },
    { icon: "🍳", label: "Usage", key: "usage" },
    { icon: "🛒", label: "How to Pick", key: "picking" },
    { icon: "❄️", label: "Storage", key: "storage" },
    { icon: "💡", label: "Fun Fact", key: "funFact" },
  ];

  return (
    <>
      <button
        onClick={handleOpen}
        title="Learn about this item"
        style={{
          padding: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#aaa",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Info size={13} />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "24px 20px",
              maxWidth: 380,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}
                >
                  {dn(item.name_en, item.name_zh, lang)}
                </div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  Product Guide
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  border: "none",
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <X size={16} />
              </button>
            </div>
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  color: "#999",
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Loader size={20} />
                <span>Learning about {item.name_en}...</span>
              </div>
            ) : data ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {rows.map((r) => (
                  <div
                    key={r.key}
                    style={{
                      padding: "10px 12px",
                      background: "#F9FAFB",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      {r.icon} {r.label}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}
                    >
                      {data[r.key] || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#999",
                  fontSize: 13,
                }}
              >
                Could not load info. Try again.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Item Row ───
function ItemRow({
  item,
  lang,
  onToggle,
  onDelete,
  onUpdate,
  allItems,
  profile,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name_en);
  const [showMeta, setShowMeta] = useState(false);
  const [time, setTime] = useState(item.time || "");
  const [loc, setLoc] = useState(item.location || "");
  const [inspire, setInspire] = useState(null);
  const [insLoading, setInsLoading] = useState(false);
  const [showInspire, setShowInspire] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const saveName = () => {
    setEditing(false);
    if (name.trim() && name !== item.name_en)
      onUpdate({ ...item, name_en: name.trim() });
  };
  const saveMeta = () => {
    setShowMeta(false);
    onUpdate({ ...item, time, location: loc });
  };

  const handleInspire = async () => {
    if (showInspire) {
      setShowInspire(false);
      return;
    }
    if (inspire) {
      setShowInspire(true);
      return;
    }
    setInsLoading(true);
    setShowInspire(true);
    const r = await fetchInspire(item, allItems, profile);
    setInspire(r);
    setInsLoading(false);
  };

  const addRecipe = (recipe) => {
    recipe.add.forEach((a) => {
      onUpdate(
        {
          id: uid(),
          name_en: a.name_en,
          name_zh: a.name_zh || "",
          checked: false,
          time: "",
          location: "",
          qty: 1,
        },
        true,
      );
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: "1px solid #f0f0f0",
          opacity: item.checked ? 0.5 : 1,
        }}
      >
        <button
          onClick={() => onToggle(item.id)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            border: `2px solid ${item.checked ? AC : "#ccc"}`,
            background: item.checked ? AC : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            color: "#fff",
          }}
        >
          {item.checked && <Check size={14} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={ref}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              style={{
                width: "100%",
                border: "none",
                borderBottom: `1.5px solid ${AC}`,
                outline: "none",
                fontSize: 14,
                padding: "2px 0",
                background: "transparent",
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                onClick={() => setEditing(true)}
                style={{
                  fontSize: 14,
                  color: "#1a1a1a",
                  cursor: "text",
                  textDecoration: item.checked ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline",
                }}
              >
                {dn(item.name_en, item.name_zh, lang)}
              </div>
              <ItemInfoButton item={item} lang={lang} profile={profile} />
              <AlternativesButton
                item={item}
                lang={lang}
                profile={profile}
                onReplace={(alt) =>
                  onUpdate({
                    ...item,
                    name_en: alt.name_en,
                    name_zh: alt.name_zh || "",
                  })
                }
              />
            </div>
          )}
          {(item.time || item.location) && !editing && (
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              {item.time && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Clock />
                  {item.time}
                </span>
              )}
              {item.location && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <MapPin />
                  {item.location}
                </span>
              )}
            </div>
          )}
        </div>
        {/* Qty badge */}
        <QtyBadge
          qty={item.qty}
          onChange={(v) => onUpdate({ ...item, qty: v })}
        />
        <button
          onClick={handleInspire}
          title="Recipe ideas"
          style={{
            padding: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: showInspire ? "#9C27B0" : "#ccc",
          }}
        >
          <Bulb size={15} />
        </button>
        <button
          onClick={() => setShowMeta(!showMeta)}
          style={{
            padding: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#bbb",
          }}
        >
          <EditIco size={14} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          style={{
            padding: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#dbb",
          }}
        >
          <Trash size={14} />
        </button>
      </div>
      {showMeta && (
        <div
          style={{
            padding: "8px 0 8px 34px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Time"
            style={{
              flex: 1,
              minWidth: 80,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 12,
            }}
          />
          <input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="Aisle"
            style={{
              flex: 1,
              minWidth: 80,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 12,
            }}
          />
          <button
            onClick={saveMeta}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: AC,
              color: "#fff",
              border: "none",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      )}
      {showInspire &&
        (insLoading ? (
          <div
            style={{
              padding: "12px 34px",
              color: "#999",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Loader size={14} />
            Finding ideas...
          </div>
        ) : inspire ? (
          <InspireCard data={inspire} lang={lang} onAddRecipe={addRecipe} />
        ) : (
          <div style={{ padding: "12px 34px", color: "#999", fontSize: 12 }}>
            No ideas found.
          </div>
        ))}
    </div>
  );
}

// ─── Smart View ───
function SmartView({
  smartData,
  lang,
  sectionItems,
  profile,
  onKeep,
  onKeepAll,
  onDismiss,
  onToggleCheck,
  onReplaceItem,
  ctxText,
  onCtxChange,
  onRegen,
  editCtx,
  setEditCtx,
}) {
  if (!smartData) return null;
  const { clusters = [], ungrouped = [] } = smartData;
  const findItem = (en) =>
    sectionItems.find((i) => i.name_en.toLowerCase() === en.toLowerCase());
  const allSuggested = clusters.flatMap((c) =>
    (c.items || []).filter((it) => !it.existing),
  );
  const hasSuggestions = allSuggested.length > 0;

  return (
    <div>
      {/* Keep All + Context */}
      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "8px 0",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: 10,
            background: SG_BG,
            borderRadius: 10,
            border: "1px dashed #E6C777",
          }}
        >
          {editCtx ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={ctxText}
                onChange={(e) => onCtxChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 12,
                }}
              />
              <button
                onClick={() => {
                  setEditCtx(false);
                  onRegen();
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#F9A825",
                  color: "#fff",
                  border: "none",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Regenerate
              </button>
              <button
                onClick={() => setEditCtx(false)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "#f5f5f5",
                  border: "none",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditCtx(true)}
              style={{
                fontSize: 12,
                color: "#8D6E63",
                fontStyle: "italic",
                cursor: "text",
              }}
            >
              💡 {ctxText || "Tap to edit context and regenerate"}
            </div>
          )}
        </div>
        {hasSuggestions && (
          <button
            onClick={() => onKeepAll(allSuggested)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: AC,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Check size={14} />
            Keep All ({allSuggested.length})
          </button>
        )}
      </div>
      {clusters.map((c, ci) => (
        <div
          key={ci}
          style={{
            margin: "10px 0",
            padding: 12,
            background: "#FFFDE7",
            borderRadius: 12,
            border: `1px solid ${SG_BD}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>{c.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#5D4037" }}>
                {c.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.desc}
              </div>
            </div>
          </div>
          {(c.items || []).map((it, ii) => {
            const real = findItem(it.name_en);
            const isEx = it.existing && real;
            return (
              <div
                key={ii}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 4px",
                  borderBottom: `1px ${it.existing ? "solid" : "dashed"} #F0E68C`,
                  background: it.existing ? "transparent" : "#FFF8E1",
                  borderRadius: it.existing ? 0 : 6,
                  marginBottom: 2,
                }}
              >
                {isEx ? (
                  <button
                    onClick={() => onToggleCheck(real.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      border: `2px solid ${real.checked ? AC : "#ccc"}`,
                      background: real.checked ? AC : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                      color: "#fff",
                    }}
                  >
                    {real.checked && <Check size={12} />}
                  </button>
                ) : (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      border: `2px dashed ${SG_BD}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={10} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: it.existing ? 400 : 500,
                      color: it.existing ? "#333" : "#5D4037",
                      textDecoration:
                        isEx && real.checked ? "line-through" : "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    {dn(it.name_en, it.name_zh, lang)}
                    <ItemInfoButton
                      item={{ name_en: it.name_en, name_zh: it.name_zh }}
                      lang={lang}
                      profile={profile}
                    />
                    {isEx && (
                      <AlternativesButton
                        item={{ name_en: it.name_en, name_zh: it.name_zh }}
                        lang={lang}
                        profile={profile}
                        onReplace={(alt) => onReplaceItem(real.id, alt)}
                      />
                    )}
                  </div>
                  {it.why && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#999",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.why}
                    </div>
                  )}
                </div>
                {isEx && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#999",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    ×{real.qty || 1}
                  </span>
                )}
                {!it.existing && (
                  <>
                    <button
                      onClick={() => onKeep(it)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: AC,
                        color: "#fff",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => onDismiss(it.name_en)}
                      style={{
                        padding: 2,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ccc",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {ungrouped.length > 0 && (
        <div
          style={{
            margin: "10px 0",
            padding: 12,
            background: "#F5F5F5",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#888",
              marginBottom: 6,
            }}
          >
            📦 Other Items
          </div>
          {ungrouped.map((it, i) => {
            const real = findItem(it.name_en);
            if (!real) return null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <button
                  onClick={() => onToggleCheck(real.id)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    border: `2px solid ${real.checked ? AC : "#ccc"}`,
                    background: real.checked ? AC : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                    color: "#fff",
                  }}
                >
                  {real.checked && <Check size={12} />}
                </button>
                <span
                  style={{
                    fontSize: 13,
                    textDecoration: real.checked ? "line-through" : "none",
                    color: "#555",
                  }}
                >
                  {dn(it.name_en, it.name_zh, lang)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Store Aisle View ───
function StoreListView({
  smartData,
  lang,
  sectionItems,
  profile,
  onToggleCheck,
  onReplaceItem,
}) {
  if (!smartData?.storeLayout) return null;
  const findItem = (en) =>
    sectionItems.find((i) => i.name_en.toLowerCase() === en.toLowerCase());
  const { storeLayout = [] } = smartData;
  const mapped = new Set();
  storeLayout.forEach((cat) =>
    (cat.items || []).forEach((it) => mapped.add(it.name_en.toLowerCase())),
  );
  const unmapped = sectionItems.filter(
    (i) => !mapped.has(i.name_en.toLowerCase()),
  );

  return (
    <div>
      {storeLayout.map((cat, ci) => (
        <div
          key={ci}
          style={{
            margin: "8px 0",
            padding: 12,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: AC,
              marginBottom: 6,
            }}
          >
            {cat.emoji} {cat.category}
          </div>
          {(cat.items || []).map((it, ii) => {
            const real = findItem(it.name_en);
            const chk = real?.checked || false;
            return (
              <div
                key={ii}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 4px",
                  borderBottom: "1px solid #f5f5f5",
                  opacity: chk ? 0.55 : 1,
                }}
              >
                <button
                  onClick={() => real && onToggleCheck(real.id)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    border: `2px solid ${chk ? AC : "#ccc"}`,
                    background: chk ? AC : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                    color: "#fff",
                  }}
                >
                  {chk && <Check size={12} />}
                </button>
                <span
                  style={{
                    fontSize: 13,
                    textDecoration: chk ? "line-through" : "none",
                    color: chk ? "#999" : "#333",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {dn(it.name_en, it.name_zh, lang)}
                  <ItemInfoButton
                    item={{ name_en: it.name_en, name_zh: it.name_zh }}
                    lang={lang}
                    profile={profile}
                  />
                  <AlternativesButton
                    item={{ name_en: it.name_en, name_zh: it.name_zh }}
                    lang={lang}
                    profile={profile}
                    onReplace={(alt) => {
                      const real2 = findItem(it.name_en);
                      if (real2) onReplaceItem(real2.id, alt);
                    }}
                  />
                </span>
                {real && (
                  <span
                    style={{ fontSize: 11, color: "#999", fontWeight: 600 }}
                  >
                    ×{real.qty || 1}
                  </span>
                )}
                {!it.existing && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: SG_BG,
                      color: "#F9A825",
                      fontWeight: 600,
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {unmapped.length > 0 && (
        <div
          style={{
            margin: "8px 0",
            padding: 12,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#999",
              marginBottom: 6,
            }}
          >
            📦 Recently Added
          </div>
          {unmapped.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 4px",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <button
                onClick={() => onToggleCheck(item.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  border: `2px solid ${item.checked ? AC : "#ccc"}`,
                  background: item.checked ? AC : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  color: "#fff",
                }}
              >
                {item.checked && <Check size={12} />}
              </button>
              <span
                style={{
                  fontSize: 13,
                  textDecoration: item.checked ? "line-through" : "none",
                }}
              >
                {dn(item.name_en, item.name_zh, lang)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section ───
function Section({ section, allSections, profile, onUpdate, onDelete }) {
  const lang = profile?.language || "en";
  const [collapsed, setCollapsed] = useState(section.collapsed);
  const [renaming, setRenaming] = useState(false);
  const [sName, setSName] = useState(section.name);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smartData, setSmartData] = useState(section.smartData);
  const [viewMode, setViewMode] = useState(section.viewMode);
  const [ctxText, setCtxText] = useState(smartData?.reason || "");
  const [editCtx, setEditCtx] = useState(false);
  const rnRef = useRef(null),
    addRef = useRef(null);

  useEffect(() => {
    if (renaming && rnRef.current) rnRef.current.focus();
  }, [renaming]);
  useEffect(() => {
    if (adding && addRef.current) addRef.current.focus();
  }, [adding]);

  const saveRename = () => {
    setRenaming(false);
    if (sName.trim() && sName !== section.name)
      onUpdate({ ...section, name: sName.trim() });
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    setTranslating(true);
    const tr = await translateItem(newName.trim(), lang);
    const item = {
      id: uid(),
      name_en: tr.name_en,
      name_zh: tr.name_zh || "",
      checked: false,
      time: "",
      location: "",
      qty: 1,
    };
    onUpdate({ ...section, items: [...section.items, item] });
    setNewName("");
    setTranslating(false);
    setAdding(false);
  };

  const toggleItem = (id) => {
    const items = section.items.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i,
    );
    onUpdate({ ...section, items });
  };
  const deleteItem = (id) =>
    onUpdate({ ...section, items: section.items.filter((i) => i.id !== id) });
  const updateItem = (updated, addNew) => {
    if (addNew) {
      onUpdate({ ...section, items: [...section.items, updated] });
      return;
    }
    onUpdate({
      ...section,
      items: section.items.map((i) => (i.id === updated.id ? updated : i)),
    });
  };

  const handleSuggest = async () => {
    setLoading(true);
    setSmartData(null);
    const r = await fetchSuggestions(allSections, section.id, profile);
    if (r) {
      setSmartData(r);
      setCtxText(r.reason || "");
      setViewMode("smart");
      onUpdate({ ...section, smartData: r, viewMode: "smart" });
    }
    setLoading(false);
  };

  const handleRegen = async () => {
    setLoading(true);
    const r = await fetchSuggestions(allSections, section.id, profile);
    if (r) {
      setSmartData(r);
      setCtxText(r.reason || "");
      onUpdate({ ...section, smartData: r });
    }
    setLoading(false);
  };

  const keepSugg = (it) => {
    const ni = {
      id: uid(),
      name_en: it.name_en,
      name_zh: it.name_zh || "",
      checked: false,
      time: "",
      location: "",
      qty: 1,
    };
    const newItems = [...section.items, ni];
    const nc = (smartData.clusters || []).map((c) => ({
      ...c,
      items: (c.items || []).map((ci) =>
        ci.name_en === it.name_en ? { ...ci, existing: true, why: "" } : ci,
      ),
    }));
    const nl = (smartData.storeLayout || []).map((cat) => ({
      ...cat,
      items: (cat.items || []).map((si) =>
        si.name_en === it.name_en ? { ...si, existing: true } : si,
      ),
    }));
    const nd = { ...smartData, clusters: nc, storeLayout: nl };
    setSmartData(nd);
    onUpdate({ ...section, items: newItems, smartData: nd });
  };

  const keepAllSugg = (items) => {
    let newItems = [...section.items];
    items.forEach((it) => {
      newItems.push({
        id: uid(),
        name_en: it.name_en,
        name_zh: it.name_zh || "",
        checked: false,
        time: "",
        location: "",
        qty: 1,
      });
    });
    const nc = (smartData.clusters || []).map((c) => ({
      ...c,
      items: (c.items || []).map((ci) =>
        ci.existing ? ci : { ...ci, existing: true, why: "" },
      ),
    }));
    const nl = (smartData.storeLayout || []).map((cat) => ({
      ...cat,
      items: (cat.items || []).map((si) =>
        si.existing ? si : { ...si, existing: true },
      ),
    }));
    const nd = { ...smartData, clusters: nc, storeLayout: nl };
    setSmartData(nd);
    onUpdate({ ...section, items: newItems, smartData: nd });
  };

  const replaceItem = (itemId, alt) => {
    const items = section.items.map((i) =>
      i.id === itemId
        ? { ...i, name_en: alt.name_en, name_zh: alt.name_zh || "" }
        : i,
    );
    onUpdate({ ...section, items });
  };

  const dismissSugg = (nameEn) => {
    const nc = (smartData.clusters || []).map((c) => ({
      ...c,
      items: (c.items || []).filter((ci) => ci.name_en !== nameEn),
    }));
    const nl = (smartData.storeLayout || []).map((cat) => ({
      ...cat,
      items: (cat.items || []).filter((si) => si.name_en !== nameEn),
    }));
    const nd = { ...smartData, clusters: nc, storeLayout: nl };
    setSmartData(nd);
    onUpdate({ ...section, smartData: nd });
  };

  const switchView = (m) => {
    setViewMode(m);
    onUpdate({ ...section, viewMode: m });
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        marginBottom: 12,
        boxShadow: "0 1px 8px rgba(0,0,0,.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          gap: 6,
          background: AC_L,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            onUpdate({ ...section, collapsed: !collapsed });
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            color: AC,
          }}
        >
          <ChevDown
            size={16}
            style={{
              transform: collapsed ? "rotate(-90deg)" : "none",
              transition: "transform .2s",
            }}
          />
        </button>
        {renaming ? (
          <input
            ref={rnRef}
            value={sName}
            onChange={(e) => setSName(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            style={{
              flex: 1,
              border: "none",
              borderBottom: `2px solid ${AC}`,
              background: "transparent",
              fontSize: 14,
              fontWeight: 600,
              outline: "none",
              minWidth: 80,
            }}
          />
        ) : (
          <span
            onClick={() => setRenaming(true)}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: "#2E7D32",
              cursor: "text",
              minWidth: 80,
            }}
          >
            {section.name}
          </span>
        )}
        <span style={{ fontSize: 11, color: "#999" }}>
          {section.items.length}
        </span>
        <button
          onClick={handleSuggest}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "4px 10px",
            borderRadius: 10,
            background: loading ? "#eee" : SG_BG,
            border: `1px solid ${SG_BD}`,
            fontSize: 11,
            fontWeight: 600,
            color: "#F9A825",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? <Loader size={12} /> : <Sparkles size={12} />}Suggest
        </button>
        <button
          onClick={() => onDelete(section.id)}
          style={{
            padding: 3,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#ccc",
          }}
        >
          <Trash size={14} />
        </button>
      </div>

      {!collapsed && smartData && (
        <div
          style={{
            display: "flex",
            margin: "8px 14px 0",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid #ddd",
          }}
        >
          {[
            { k: null, icon: "📝", label: "Flat" },
            { k: "smart", icon: "✨", label: "Smart View" },
            { k: "list", icon: "🏪", label: "Store Aisles" },
          ].map((v) => (
            <button
              key={v.k || "flat"}
              onClick={() => switchView(v.k)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                background:
                  viewMode === v.k
                    ? v.k === "smart"
                      ? SG_BG
                      : v.k === "list"
                        ? "#E3F2FD"
                        : "#F5F5F5"
                    : "#fff",
                color:
                  viewMode === v.k
                    ? v.k === "smart"
                      ? "#F9A825"
                      : v.k === "list"
                        ? "#1976D2"
                        : "#555"
                    : "#999",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      )}

      {!collapsed && (
        <div style={{ padding: "4px 12px 12px" }}>
          {viewMode === "smart" && smartData && (
            <SmartView
              smartData={smartData}
              lang={lang}
              sectionItems={section.items}
              profile={profile}
              onKeep={keepSugg}
              onKeepAll={keepAllSugg}
              onDismiss={dismissSugg}
              onToggleCheck={toggleItem}
              onReplaceItem={replaceItem}
              ctxText={ctxText}
              onCtxChange={setCtxText}
              onRegen={handleRegen}
              editCtx={editCtx}
              setEditCtx={setEditCtx}
            />
          )}
          {viewMode === "list" && smartData && (
            <StoreListView
              smartData={smartData}
              lang={lang}
              sectionItems={section.items}
              profile={profile}
              onToggleCheck={toggleItem}
              onReplaceItem={replaceItem}
            />
          )}
          {!viewMode && (
            <div>
              {section.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  lang={lang}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                  onUpdate={updateItem}
                  allItems={allSections.flatMap((s) => s.items)}
                  profile={profile}
                />
              ))}
            </div>
          )}

          {adding ? (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 0",
                alignItems: "center",
              }}
            >
              <input
                ref={addRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addItem();
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder={
                  lang === "en-zh" ? "Item / 输入商品名称..." : "Item name..."
                }
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #ddd",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={addItem}
                disabled={translating}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: AC,
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: translating ? "wait" : "pointer",
                }}
              >
                {translating ? <Loader size={12} /> : "Add"}
              </button>
              <button
                onClick={() => setAdding(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#f5f5f5",
                  color: "#999",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "10px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: AC,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Plus size={14} />
              Add Item
            </button>
          )}

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: "#F9A825",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Loader size={16} />
              Analyzing your list...
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Main App ───
export default function SmartGrocery() {
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [sections, setSections] = useState([]);
  const [showPrefs, setShowPrefs] = useState(false);
  const [addingSec, setAddingSec] = useState(false);
  const [newSecName, setNewSecName] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const secRef = useRef(null);

  useEffect(() => {
    (async () => {
      const ob = await load("onboarding-complete", false);
      const pr = await load("profile", null);
      const li = await load("grocery-list", null);
      setOnboarded(ob);
      setProfile(pr);
      setSections(li?.sections || []);
      if (ob && !pr) setShowNudge(true);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded && !activeScenario) save("grocery-list", { sections });
  }, [sections, loaded, activeScenario]);
  useEffect(() => {
    if (addingSec && secRef.current) secRef.current.focus();
  }, [addingSec]);

  const completeOnboarding = async (p) => {
    setProfile(p);
    setOnboarded(true);
    setShowNudge(false);
    await save("profile", p);
    await save("onboarding-complete", true);
  };
  const skipOnboarding = async () => {
    setOnboarded(true);
    setShowNudge(true);
    await save("onboarding-complete", true);
  };

  const updateSection = (u) =>
    setSections((p) => p.map((s) => (s.id === u.id ? u : s)));
  const deleteSection = (id) =>
    setSections((p) => p.filter((s) => s.id !== id));
  const addSection = () => {
    if (!newSecName.trim()) return;
    setSections((p) => [
      ...p,
      {
        id: uid(),
        name: newSecName.trim(),
        collapsed: false,
        items: [],
        smartData: null,
        viewMode: null,
      },
    ]);
    setNewSecName("");
    setAddingSec(false);
  };
  const savePrefs = async (p) => {
    setProfile(p);
    setShowPrefs(false);
    setShowNudge(false);
    await save("profile", p);
  };

  const loadScenario = (sc) => {
    setActiveScenario(sc.id);
    setProfile(sc.profile);
    setSections(JSON.parse(JSON.stringify(sc.sections)));
    setOnboarded(true);
  };

  if (!loaded)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAFA",
        }}
      >
        <div
          style={{
            color: "#999",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Loader />
          Loading...
        </div>
      </div>
    );

  if (!onboarded && !activeScenario)
    return (
      <Onboarding
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        initial={profile}
      />
    );

  if (showPrefs)
    return (
      <Onboarding
        onComplete={savePrefs}
        onSkip={() => setShowPrefs(false)}
        initial={profile}
      />
    );

  const lang = profile?.language || "en";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F5F5",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "14px 18px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              🛒 Smart Grocery
            </h1>
            <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>
              {sections.reduce((a, s) => a + s.items.length, 0)} items ·{" "}
              {sections.length} section{sections.length !== 1 ? "s" : ""}
              {lang === "en-zh" && " · 双语模式"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setAddingSec(true)}
              title="New Section"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1.5px solid #ddd",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: AC,
              }}
            >
              <Plus size={17} />
            </button>
            <button
              onClick={() => setShowPrefs(true)}
              title="Preferences"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: "1.5px solid #ddd",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#888",
              }}
            >
              <SettingsIco size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Quick-Switch */}
      <div
        style={{
          background: "#fff",
          padding: "6px 18px 10px",
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 6,
          overflowX: "auto",
        }}
      >
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => loadScenario(sc)}
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: `1.5px solid ${activeScenario === sc.id ? AC : "#ddd"}`,
              background: activeScenario === sc.id ? AC_L : "#fff",
              color: activeScenario === sc.id ? "#2E7D32" : "#666",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {sc.tab}
          </button>
        ))}
      </div>

      <div
        style={{ padding: "12px 14px 80px", maxWidth: 520, margin: "0 auto" }}
      >
        {/* Nudge */}
        {showNudge && !nudgeDismissed && !profile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#FFF3E0",
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #FFE0B2",
            }}
          >
            <span style={{ fontSize: 12, color: "#E65100" }}>
              ⚡ Set preferences for smarter suggestions
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setShowPrefs(true)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "#FF9800",
                  color: "#fff",
                  border: "none",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Set up
              </button>
              <button
                onClick={() => setNudgeDismissed(true)}
                style={{
                  padding: 3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#ccc",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* New section */}
        {addingSec && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input
              ref={secRef}
              value={newSecName}
              onChange={(e) => setNewSecName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSection();
                if (e.key === "Escape") setAddingSec(false);
              }}
              placeholder="Section name (e.g., Costco)"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #ddd",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={addSection}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: AC,
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add
            </button>
            <button
              onClick={() => setAddingSec(false)}
              style={{
                padding: "10px 10px",
                borderRadius: 12,
                background: "#f5f5f5",
                color: "#999",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {sections.map((s) => (
          <Section
            key={s.id}
            section={s}
            allSections={sections}
            profile={profile}
            onUpdate={updateSection}
            onDelete={deleteSection}
          />
        ))}

        {!sections.length && (
          <div
            style={{ textAlign: "center", padding: "60px 20px", color: "#ccc" }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 14 }}>
              No sections yet. Tap + or pick a scenario above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
