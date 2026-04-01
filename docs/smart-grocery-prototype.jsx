import { useState, useEffect, useRef } from "react";

// ─── Icons ───
const Plus = ({ size = 20, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const Check = ({ size = 18, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
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
    style={{ animation: "sg-spin 1s linear infinite" }}
  >
    <path d="M12 2a10 10 0 010 20 10 10 0 010-20" strokeDasharray="30 60" />
  </svg>
);

// ─── Design Tokens ───
const T = {
  bg: "#F7F6F3", // warm linen
  card: "#FFFFFF",
  green: "#2E7D32", // primary action
  greenLight: "#E8F5E9",
  coral: "#FF6B35", // AI accent
  coralLight: "#FEF3EC",
  coralBg: "#FEF7ED", // suggestion cards
  text: "#222222",
  textSec: "#717171",
  textTer: "#A0A0A0",
  border: "rgba(0,0,0,.06)",
  shadow: "0 2px 12px rgba(0,0,0,.06)",
  shadowLg: "0 8px 30px rgba(0,0,0,.12)",
  radius: 14,
  radiusSm: 10,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── Helpers ───
const uid = () => Math.random().toString(36).slice(2, 10);
function dn(en, zh, lang) {
  return lang === "en-zh" && zh ? en : en;
}
function dnSub(zh, lang) {
  return lang === "en-zh" && zh ? zh : null;
}
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

// ─── Scenarios ───
const SCENARIOS = [
  {
    id: "mei",
    tab: "🥢 Mei & Jing",
    desc: "BBQ party with Mark — fusion style",
    profile: {
      dietary: [],
      household: "2",
      taste: "Chinese cuisine, Korean BBQ, also enjoy Western BBQ with friends",
      language: "en-zh",
    },
    sections: [
      {
        id: "s_m1",
        name: "BBQ with Mark",
        collapsed: false,
        smartData: null,
        viewMode: null,
        items: [
          {
            id: "m1",
            name_en: "Tofu",
            name_zh: "豆腐",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m2",
            name_en: "Pork Belly",
            name_zh: "五花肉",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m3",
            name_en: "Kimchi",
            name_zh: "泡菜",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m4",
            name_en: "Seaweed",
            name_zh: "海苔",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m5",
            name_en: "Burger Patties",
            name_zh: "汉堡肉饼",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m6",
            name_en: "Hot Dog Buns",
            name_zh: "热狗面包",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m7",
            name_en: "Hot Dogs",
            name_zh: "热狗",
            checked: false,
            time: "",
            location: "",
            qty: 1,
          },
          {
            id: "m8",
            name_en: "Mustard",
            name_zh: "芥末酱",
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
      taste: "Healthy, open to new cuisines, easy meal prep",
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

// ─── API Calls ───
async function callClaude(prompt, maxTk = 1000) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTk,
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

async function translateItem(input, lang) {
  if (lang !== "en-zh") return { name_en: input, name_zh: "" };
  return (
    (await callClaude(
      `Translate this grocery item. If Chinese give English. If English give Chinese Simplified.\nInput: "${input}"\nONLY JSON: {"name_en":"...","name_zh":"..."}`,
      200,
    )) || { name_en: input, name_zh: "" }
  );
}

// ─── API: Pre-Suggest Questions ───
async function fetchQuestions(allSections, targetId, profile) {
  const tgt = allSections.find((s) => s.id === targetId);
  if (!tgt) return null;
  const all = allSections.flatMap((s) =>
    s.items.map((i) => ({ en: i.name_en, zh: i.name_zh, sec: s.name })),
  );
  const bi = profile?.language === "en-zh";
  const pStr = profile
    ? `Dietary: ${(profile.dietary || []).join(", ") || "none"}. Household: ${profile.household || "?"}. Preferences: ${profile.taste || "none"}.`
    : "No profile.";

  return await callClaude(
    `You are a smart grocery assistant. Before making suggestions, you need to understand the user's intent.

Profile: ${pStr}
Section: "${tgt.name}"
Items in section: ${tgt.items.map((i) => `${i.name_en}${i.name_zh ? " / " + i.name_zh : ""}`).join(", ") || "(empty)"}
Items in other sections: ${
      all
        .filter((i) => i.sec !== tgt.name)
        .map((i) => `${i.en} (${i.sec})`)
        .join(", ") || "none"
    }

Analyze the list and generate 1-3 quick clarifying questions that would help you make much better suggestions. Consider:
- Is the purpose obvious or ambiguous? (party vs weekly restock vs specific recipe)
- Are there mixed cuisine patterns that need clarification?
- Is the quantity/scale unclear?
- Would knowing a theme, occasion, or cooking method change recommendations?

If the list is straightforward (e.g. simple weekly restock with clear patterns), generate just 1 question. If ambiguous or complex (mixed cuisines, party items, unusual combinations), generate 2-3.

Each question should have 3-4 tappable chip options plus optionally a free-text "Other" option.

ONLY JSON no markdown:
{"questions":[{"q":"Question text${bi ? " (English + Chinese)" : ""}","options":["Option 1","Option 2","Option 3"],"allowOther":true}]}

Rules:
- 1-3 questions maximum
- Options should be short (2-5 words each)
- Questions should feel conversational, like a friend asking "what are we cooking?"
- 3-4 options per question
${bi ? "- Questions and options in both English and Chinese" : ""}`,
    600,
  );
}

async function fetchSuggestions(allSections, targetId, profile, userContext) {
  const tgt = allSections.find((s) => s.id === targetId);
  if (!tgt) return null;
  const all = allSections.flatMap((s) =>
    s.items.map((i) => ({ en: i.name_en, zh: i.name_zh, sec: s.name })),
  );
  const bi = profile?.language === "en-zh";
  const pStr = profile
    ? `Dietary: ${(profile.dietary || []).join(", ") || "none"}. Household: ${profile.household || "?"}. Preferences: ${profile.taste || "none"}.`
    : "No profile.";
  return await callClaude(
    `Smart grocery assistant. Analyze list, suggest items.

Profile: ${pStr}
All items: ${all.map((i) => `"${i.en}${i.zh ? " / " + i.zh : ""}" (${i.sec})`).join(", ")}
Target: "${tgt.name}" — ${tgt.items.map((i) => i.name_en).join(", ") || "empty"}
${userContext ? `\nUser context (from their answers): ${userContext}\nIMPORTANT: Use this context to guide your clustering and suggestions. The clusters should reflect the user's actual intent, not just ingredient categories.` : ""}

Steps: 1)Gap analysis 2)Cultural match 3)Recipe bridge

ONLY JSON:
{"reason":"1-2 sentences","clusters":[{"name":"Dish","emoji":"🍜","desc":"Max 10 words","items":[{"name_en":"Item","name_zh":"${bi ? "中文" : ""}","existing":true,"why":""},{"name_en":"New","name_zh":"${bi ? "中文" : ""}","existing":false,"why":"Max 15 words"}]}],"ungrouped":[{"name_en":"Item","name_zh":"${bi ? "中文" : ""}","existing":true}],"storeLayout":[{"category":"Aisle","emoji":"🥩","items":[{"name_en":"Item","name_zh":"${bi ? "中文" : ""}","existing":true}]}]}

Rules: 2-4 clusters, 3-6 NEW items total, every existing item in one cluster or ungrouped, storeLayout has ALL items.${bi ? " Provide name_zh for ALL." : ""}`,
    2000,
  );
}

async function fetchInspire(item, allItems, profile) {
  const bi = profile?.language === "en-zh";
  return await callClaude(
    `Cooking assistant. User has "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}".
Prefs: ${profile?.taste || "none"}. Other items: ${allItems.map((i) => i.name_en).join(", ")}
3 recipe ideas, each with 2-3 extra ingredients NOT in list.
ONLY JSON: {"recipes":[{"name":"Name","name_zh":"${bi ? "中文" : ""}","emoji":"🍳","desc":"Max 8 words","add":[{"name_en":"Item","name_zh":"${bi ? "中文" : ""}"}]}]}`,
    800,
  );
}

async function fetchItemInfo(item, profile) {
  const bi = profile?.language === "en-zh";
  return await callClaude(
    `Grocery expert helping someone understand "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}".
ONLY JSON: {"taste":"1 sentence${bi ? ". English+Chinese" : ""}","usage":"1-2 sentences${bi ? ". English+Chinese" : ""}","picking":"1 sentence${bi ? ". English+Chinese" : ""}","storage":"1 sentence${bi ? ". English+Chinese" : ""}","funFact":"1 sentence${bi ? ". English+Chinese" : ""}"}`,
    600,
  );
}

async function fetchAlternatives(item, profile) {
  const bi = profile?.language === "en-zh";
  return await callClaude(
    `Find 3-4 alternatives for "${item.name_en}${item.name_zh ? " / " + item.name_zh : ""}" available in North American stores. User: ${profile?.taste || "not specified"}.
ONLY JSON: {"note":"1 sentence why needed${bi ? ". English+Chinese" : ""}","alts":[{"name_en":"Name","name_zh":"${bi ? "中文" : ""}","match":"Very close|Similar|Different but works","desc":"1 sentence${bi ? ". English+Chinese" : ""}","where":"Where in store"}]}`,
    800,
  );
}

// ─── Overlay (shared popup backdrop) ───
function Overlay({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.35)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "sg-fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 20,
          padding: "24px 20px",
          maxWidth: 400,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: T.shadowLg,
          animation: "sg-slideUp .25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Bilingual Name Display ───
function ItemName({ en, zh, lang, checked, style }) {
  const sub = dnSub(zh, lang);
  return (
    <div
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: checked ? T.textTer : T.text,
          textDecoration: checked ? "line-through" : "none",
        }}
      >
        {en}
      </span>
      {sub && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: T.textTer,
            marginLeft: 6,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Checkbox ───
function Checkbox({ checked, onChange, size = 22 }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: `2px solid ${checked ? T.green : "#D0D0D0"}`,
        background: checked ? T.green : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: "all .15s ease",
      }}
    >
      {checked && <Check size={size - 8} color="#fff" />}
    </button>
  );
}

// ─── Qty Badge ───
function QtyBadge({ qty, onChange }) {
  const [open, setOpen] = useState(false);
  const q = qty || 1;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          minWidth: 22,
          height: 22,
          borderRadius: 11,
          background: T.bg,
          border: "none",
          fontSize: 12,
          fontWeight: 700,
          color: T.textSec,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6px",
          flexShrink: 0,
        }}
      >
        {q}
      </button>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            padding: "8px 0",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
            Quantity
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => onChange(Math.max(1, q - 1))}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: `1.5px solid ${T.border}`,
                background: T.bg,
                fontSize: 22,
                color: T.textSec,
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
                fontSize: 28,
                fontWeight: 700,
                color: T.text,
                minWidth: 36,
                textAlign: "center",
              }}
            >
              {q}
            </span>
            <button
              onClick={() => onChange(q + 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: `1.5px solid ${T.green}`,
                background: T.greenLight,
                fontSize: 22,
                color: T.green,
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
              padding: "10px 32px",
              borderRadius: T.radius,
              background: T.green,
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </Overlay>
    </>
  );
}

// ─── Tiny icon button for per-item actions ───
function TinyBtn({ onClick, children, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 3,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: active ? T.coral : T.textTer,
        transition: "color .15s",
        display: "flex",
        alignItems: "center",
        opacity: 0.7,
      }}
    >
      {children}
    </button>
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
    setData(await fetchItemInfo(item, profile));
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
      <TinyBtn onClick={handleOpen} title="Learn about this">
        <Info size={12} />
      </TinyBtn>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
              {dn(item.name_en, item.name_zh, lang)}
            </div>
            {dnSub(item.name_zh, lang) && (
              <div style={{ fontSize: 13, color: T.textTer }}>
                {item.name_zh}
              </div>
            )}
            <div style={{ fontSize: 11, color: T.textTer, marginTop: 2 }}>
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
              background: T.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: T.textSec,
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
              color: T.textTer,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => (
              <div
                key={r.key}
                style={{
                  padding: "10px 12px",
                  background: T.bg,
                  borderRadius: T.radiusSm,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textSec,
                    marginBottom: 3,
                  }}
                >
                  {r.icon} {r.label}
                </div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
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
              color: T.textTer,
              fontSize: 13,
            }}
          >
            Could not load info.
          </div>
        )}
      </Overlay>
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
    setData(await fetchAlternatives(item, profile));
    setLoading(false);
  };
  const mc = (m) => {
    const l = (m || "").toLowerCase();
    if (l.includes("very close")) return { bg: T.greenLight, color: T.green };
    if (l.includes("similar")) return { bg: "#FFF8E1", color: "#F9A825" };
    return { bg: "#FBE9E7", color: "#E64A19" };
  };
  return (
    <>
      <TinyBtn onClick={handleOpen} title="Find alternatives">
        <Swap size={12} />
      </TinyBtn>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
              🔄 Alternatives
            </div>
            <div style={{ fontSize: 12, color: T.textTer, marginTop: 2 }}>
              for {dn(item.name_en, item.name_zh, lang)}
              {dnSub(item.name_zh, lang) ? " / " + item.name_zh : ""}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              border: "none",
              background: T.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: T.textSec,
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
              color: T.textTer,
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
                  color: T.textSec,
                  fontStyle: "italic",
                  padding: "8px 12px",
                  background: T.coralBg,
                  borderRadius: T.radiusSm,
                  marginBottom: 12,
                }}
              >
                {data.note}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(data.alts || []).map((alt, i) => {
                const c = mc(alt.match);
                return (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      background: T.bg,
                      borderRadius: T.radius,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: T.text }}
                      >
                        {dn(alt.name_en, alt.name_zh, lang)}
                        {dnSub(alt.name_zh, lang) && (
                          <span
                            style={{
                              fontSize: 11,
                              color: T.textTer,
                              marginLeft: 6,
                            }}
                          >
                            {alt.name_zh}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: c.bg,
                          color: c.color,
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
                        color: T.textSec,
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
                      <span style={{ fontSize: 11, color: T.textTer }}>
                        📍 {alt.where}
                      </span>
                      <button
                        onClick={() => {
                          onReplace(alt);
                          setOpen(false);
                        }}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: T.green,
                          color: "#fff",
                          border: "none",
                          fontSize: 12,
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
              color: T.textTer,
              fontSize: 13,
            }}
          >
            Could not load alternatives.
          </div>
        )}
      </Overlay>
    </>
  );
}

// ─── Inspire Card ───
function InspireCard({ data, lang, onAddRecipe }) {
  return (
    <div
      style={{
        margin: "4px 0 8px 34px",
        padding: 14,
        background: T.coralBg,
        borderRadius: T.radius,
        borderLeft: `3px solid ${T.coral}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.coral,
          marginBottom: 10,
        }}
      >
        💡 Recipe Ideas
      </div>
      {data.recipes.map((r, i) => (
        <div
          key={i}
          style={{
            padding: "10px 0",
            borderBottom:
              i < data.recipes.length - 1 ? `1px solid ${T.border}` : "none",
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
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                {r.emoji} {r.name}
              </span>
              {dnSub(r.name_zh, lang) && (
                <span style={{ fontSize: 11, color: T.textTer, marginLeft: 6 }}>
                  {r.name_zh}
                </span>
              )}
              <div style={{ fontSize: 11, color: T.textTer, marginTop: 2 }}>
                {r.desc}
              </div>
            </div>
            <button
              onClick={() => onAddRecipe(r)}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                background: T.coral,
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
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}
          >
            {r.add.map((a, j) => (
              <span
                key={j}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: T.coralLight,
                  color: T.coral,
                  fontWeight: 500,
                }}
              >
                + {a.name_en}
                {dnSub(a.name_zh, lang) ? " / " + a.name_zh : ""}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
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
    setInspire(await fetchInspire(item, allItems, profile));
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
          padding: "11px 0",
          borderBottom: `1px solid ${T.border}`,
          opacity: item.checked ? 0.5 : 1,
          transition: "opacity .15s",
        }}
      >
        <Checkbox checked={item.checked} onChange={() => onToggle(item.id)} />
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
                borderBottom: `2px solid ${T.green}`,
                outline: "none",
                fontSize: 14,
                fontWeight: 500,
                padding: "2px 0",
                background: "transparent",
                fontFamily: T.font,
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                onClick={() => setEditing(true)}
                style={{ cursor: "text", flex: 1, minWidth: 0 }}
              >
                <ItemName
                  en={item.name_en}
                  zh={item.name_zh}
                  lang={lang}
                  checked={item.checked}
                />
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
        </div>
        <QtyBadge
          qty={item.qty}
          onChange={(v) => onUpdate({ ...item, qty: v })}
        />
        <TinyBtn
          onClick={handleInspire}
          active={showInspire}
          title="Recipe ideas"
        >
          <Bulb size={14} />
        </TinyBtn>
        <TinyBtn onClick={() => setShowMeta(!showMeta)} title="Edit details">
          <EditIco size={13} />
        </TinyBtn>
        <TinyBtn onClick={() => onDelete(item.id)} title="Delete">
          <Trash size={13} />
        </TinyBtn>
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
              padding: "7px 10px",
              borderRadius: T.radiusSm,
              border: `1px solid ${T.border}`,
              fontSize: 12,
              fontFamily: T.font,
              outline: "none",
            }}
          />
          <input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="Aisle"
            style={{
              flex: 1,
              minWidth: 80,
              padding: "7px 10px",
              borderRadius: T.radiusSm,
              border: `1px solid ${T.border}`,
              fontSize: 12,
              fontFamily: T.font,
              outline: "none",
            }}
          />
          <button
            onClick={saveMeta}
            style={{
              padding: "7px 14px",
              borderRadius: T.radiusSm,
              background: T.green,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
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
              padding: "14px 34px",
              color: T.textTer,
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
          <div style={{ padding: "14px 34px", color: T.textTer, fontSize: 12 }}>
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
  onReask,
  editCtx,
  setEditCtx,
}) {
  if (!smartData) return null;
  const { clusters = [], ungrouped = [] } = smartData;
  const findItem = (en) =>
    sectionItems.find((i) => i.name_en.toLowerCase() === en.toLowerCase());
  const allSugg = clusters.flatMap((c) =>
    (c.items || []).filter((it) => !it.existing),
  );

  return (
    <div>
      {/* Context + Keep All */}
      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "10px 0",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "10px 12px",
            background: T.coralBg,
            borderRadius: T.radiusSm,
            borderLeft: `3px solid ${T.coral}`,
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
                  border: `1px solid ${T.border}`,
                  fontSize: 12,
                  fontFamily: T.font,
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  setEditCtx(false);
                  onRegen();
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: T.coral,
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
                onClick={onReask}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: T.bg,
                  color: T.textSec,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Re-ask
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditCtx(true)}
              style={{
                fontSize: 12,
                color: T.textSec,
                cursor: "text",
                lineHeight: 1.5,
              }}
            >
              {ctxText || "Tap to edit context and regenerate"}
            </div>
          )}
        </div>
        {allSugg.length > 0 && (
          <button
            onClick={() => onKeepAll(allSugg)}
            style={{
              padding: "8px 14px",
              borderRadius: T.radiusSm,
              background: T.green,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <Check size={14} color="#fff" />
            Keep All
          </button>
        )}
      </div>

      {/* Clusters */}
      {clusters.map((c, ci) => (
        <div
          key={ci}
          style={{
            margin: "10px 0",
            padding: 16,
            background: T.card,
            borderRadius: T.radius,
            boxShadow: T.shadow,
            borderLeft: `4px solid ${T.coral}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>{c.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                {c.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: T.textTer,
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
                  padding: "8px 4px",
                  borderBottom: `1px solid ${T.border}`,
                  background: it.existing ? "transparent" : T.coralBg,
                  borderRadius: it.existing ? 0 : T.radiusSm,
                  marginBottom: it.existing ? 0 : 4,
                  transition: "background .15s",
                }}
              >
                {isEx ? (
                  <Checkbox
                    checked={real.checked}
                    onChange={() => onToggleCheck(real.id)}
                    size={20}
                  />
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: T.coralLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={10} />
                  </div>
                )}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ItemName
                    en={it.name_en}
                    zh={it.name_zh}
                    lang={lang}
                    checked={isEx && real.checked}
                    style={{
                      fontWeight: it.existing ? 400 : 500,
                      color: it.existing ? T.text : "#C4500A",
                    }}
                  />
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
                {isEx && (
                  <span
                    style={{
                      fontSize: 11,
                      color: T.textTer,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    ×{real.qty || 1}
                  </span>
                )}
                {!it.existing && (
                  <>
                    {it.why && (
                      <span
                        style={{
                          fontSize: 11,
                          color: T.textTer,
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flexShrink: 1,
                        }}
                        title={it.why}
                      >
                        {it.why}
                      </span>
                    )}
                    <button
                      onClick={() => onKeep(it)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: T.green,
                        color: "#fff",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Keep
                    </button>
                    <TinyBtn onClick={() => onDismiss(it.name_en)}>
                      <X size={13} />
                    </TinyBtn>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Ungrouped */}
      {ungrouped.length > 0 && (
        <div
          style={{
            margin: "10px 0",
            padding: 14,
            background: T.bg,
            borderRadius: T.radius,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textTer,
              marginBottom: 8,
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
                  padding: "7px 0",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <Checkbox
                  checked={real.checked}
                  onChange={() => onToggleCheck(real.id)}
                  size={20}
                />
                <ItemName
                  en={it.name_en}
                  zh={it.name_zh}
                  lang={lang}
                  checked={real.checked}
                  style={{ flex: 1 }}
                />
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

  const AisleItem = ({ it }) => {
    const real = findItem(it.name_en);
    const chk = real?.checked || false;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 4px",
          borderBottom: `1px solid ${T.border}`,
          opacity: chk ? 0.55 : 1,
          transition: "opacity .15s",
        }}
      >
        <Checkbox
          checked={chk}
          onChange={() => real && onToggleCheck(real.id)}
          size={20}
        />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
          <ItemName
            en={it.name_en}
            zh={it.name_zh}
            lang={lang}
            checked={chk}
            style={{ flex: 1 }}
          />
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
              if (real) onReplaceItem(real.id, alt);
            }}
          />
        </div>
        {real && (
          <span style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>
            ×{real.qty || 1}
          </span>
        )}
        {!it.existing && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 6,
              background: T.coralBg,
              color: T.coral,
              fontWeight: 600,
            }}
          >
            NEW
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      {storeLayout.map((cat, ci) => (
        <div
          key={ci}
          style={{
            margin: "8px 0",
            padding: 14,
            background: T.card,
            borderRadius: T.radius,
            boxShadow: T.shadow,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.green,
              marginBottom: 6,
            }}
          >
            {cat.emoji} {cat.category}
          </div>
          {(cat.items || []).map((it, ii) => (
            <AisleItem key={ii} it={it} />
          ))}
        </div>
      ))}
      {unmapped.length > 0 && (
        <div
          style={{
            margin: "8px 0",
            padding: 14,
            background: T.card,
            borderRadius: T.radius,
            boxShadow: T.shadow,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.textTer,
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
                padding: "8px 4px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <Checkbox
                checked={item.checked}
                onChange={() => onToggleCheck(item.id)}
                size={20}
              />
              <ItemName
                en={item.name_en}
                zh={item.name_zh}
                lang={lang}
                checked={item.checked}
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
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
        background: T.bg,
        padding: 20,
        fontFamily: T.font,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: T.card,
          borderRadius: 20,
          padding: "36px 28px",
          boxShadow: T.shadowLg,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🛒</div>
          <h1
            style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}
          >
            Welcome to Smart Grocery
          </h1>
          <p style={{ fontSize: 14, color: T.textSec, marginTop: 6 }}>
            Personalize your shopping experience
          </p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textSec,
              display: "block",
              marginBottom: 8,
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
                  padding: "11px 0",
                  borderRadius: T.radius,
                  border: "none",
                  background: lang === l.id ? T.greenLight : T.bg,
                  color: lang === l.id ? T.green : T.textSec,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow:
                    lang === l.id ? `inset 0 0 0 2px ${T.green}` : "none",
                  transition: "all .15s",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textSec,
              display: "block",
              marginBottom: 8,
            }}
          >
            Dietary Restrictions
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DIETS.map((d) => (
              <button
                key={d}
                onClick={() => toggle(d)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: "none",
                  background: diet.includes(d) ? T.greenLight : T.bg,
                  color: diet.includes(d) ? T.green : T.textSec,
                  fontSize: 13,
                  fontWeight: diet.includes(d) ? 600 : 400,
                  cursor: "pointer",
                  boxShadow: diet.includes(d)
                    ? `inset 0 0 0 1.5px ${T.green}`
                    : "none",
                  transition: "all .15s",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textSec,
              display: "block",
              marginBottom: 8,
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
                  padding: "11px 0",
                  borderRadius: T.radius,
                  border: "none",
                  background: hh === h ? T.greenLight : T.bg,
                  color: hh === h ? T.green : T.textSec,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: hh === h ? `inset 0 0 0 2px ${T.green}` : "none",
                  transition: "all .15s",
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textSec,
              display: "block",
              marginBottom: 8,
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
              padding: "12px 14px",
              borderRadius: T.radius,
              border: "none",
              background: T.bg,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: T.font,
            }}
          />
        </div>
        <button
          onClick={() =>
            onComplete({ dietary: diet, household: hh, taste, language: lang })
          }
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: T.radius,
            border: "none",
            background: T.green,
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          Create Profile
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: T.radius,
            border: "none",
            background: T.bg,
            color: T.textSec,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Quick Questions (Pre-Suggest) ───
function QuickQuestions({ questions, onSubmit, onSkip }) {
  const [answers, setAnswers] = useState({});
  const [otherText, setOtherText] = useState({});

  const selectOption = (qi, opt) => {
    setAnswers((p) => {
      const cur = p[qi];
      if (cur === opt) return { ...p, [qi]: undefined };
      return { ...p, [qi]: opt };
    });
  };

  const selectOther = (qi) => {
    setAnswers((p) => ({ ...p, [qi]: "__other__" }));
  };

  const buildContext = () => {
    return questions
      .map((q, i) => {
        const a = answers[i];
        if (!a) return null;
        const val = a === "__other__" ? otherText[i] || "other" : a;
        return `${q.q} → ${val}`;
      })
      .filter(Boolean)
      .join(". ");
  };

  const hasAnswers = Object.values(answers).some((a) => a !== undefined);

  return (
    <div
      style={{
        padding: 16,
        background: T.coralBg,
        borderRadius: T.radius,
        margin: "8px 0",
        borderLeft: `4px solid ${T.coral}`,
        animation: "sg-slideUp .25s ease",
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
        <div style={{ fontSize: 13, fontWeight: 600, color: T.coral }}>
          ✨ Quick questions for better suggestions
        </div>
        <button
          onClick={onSkip}
          style={{
            fontSize: 11,
            color: T.textTer,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Skip →
        </button>
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          style={{ marginBottom: qi < questions.length - 1 ? 14 : 0 }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: T.text,
              marginBottom: 8,
            }}
          >
            {q.q}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === opt;
              return (
                <button
                  key={oi}
                  onClick={() => selectOption(qi, opt)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "none",
                    background: selected ? T.coral : "#fff",
                    color: selected ? "#fff" : T.textSec,
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    boxShadow: selected ? "none" : "0 1px 3px rgba(0,0,0,.06)",
                    transition: "all .15s",
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {q.allowOther &&
              (answers[qi] === "__other__" ? (
                <input
                  value={otherText[qi] || ""}
                  onChange={(e) =>
                    setOtherText((p) => ({ ...p, [qi]: e.target.value }))
                  }
                  placeholder="Type here..."
                  autoFocus
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "none",
                    background: "#fff",
                    fontSize: 12,
                    outline: "none",
                    fontFamily: T.font,
                    minWidth: 100,
                    boxShadow: `inset 0 0 0 2px ${T.coral}`,
                  }}
                />
              ) : (
                <button
                  onClick={() => selectOther(qi)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "none",
                    background: "#fff",
                    color: T.textTer,
                    fontSize: 12,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                  }}
                >
                  Other...
                </button>
              ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => onSubmit(buildContext())}
        disabled={!hasAnswers}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "11px 0",
          borderRadius: T.radiusSm,
          border: "none",
          background: hasAnswers ? T.green : "#ddd",
          color: hasAnswers ? "#fff" : "#aaa",
          fontSize: 13,
          fontWeight: 600,
          cursor: hasAnswers ? "pointer" : "default",
          transition: "all .15s",
        }}
      >
        Get Suggestions →
      </button>
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
  const [questions, setQuestions] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [userContext, setUserContext] = useState(section.userContext || null);
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
    onUpdate({
      ...section,
      items: [
        ...section.items,
        {
          id: uid(),
          name_en: tr.name_en,
          name_zh: tr.name_zh || "",
          checked: false,
          time: "",
          location: "",
          qty: 1,
        },
      ],
    });
    setNewName("");
    setTranslating(false);
    setAdding(false);
  };
  const toggleItem = (id) =>
    onUpdate({
      ...section,
      items: section.items.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i,
      ),
    });
  const deleteItem = (id) =>
    onUpdate({ ...section, items: section.items.filter((i) => i.id !== id) });
  const updateItem = (u, addNew) => {
    if (addNew) {
      onUpdate({ ...section, items: [...section.items, u] });
      return;
    }
    onUpdate({
      ...section,
      items: section.items.map((i) => (i.id === u.id ? u : i)),
    });
  };
  const replaceItem = (itemId, alt) =>
    onUpdate({
      ...section,
      items: section.items.map((i) =>
        i.id === itemId
          ? { ...i, name_en: alt.name_en, name_zh: alt.name_zh || "" }
          : i,
      ),
    });

  const handleSuggest = async () => {
    // If we already have context from previous answers, go straight to suggestions
    if (userContext) {
      runSuggest(userContext);
      return;
    }
    // Otherwise, fetch contextual questions first
    setLoadingQ(true);
    setQuestions(null);
    const qs = await fetchQuestions(allSections, section.id, profile);
    setLoadingQ(false);
    if (qs?.questions?.length) {
      setQuestions(qs.questions);
    } else {
      // If no questions returned, go straight to suggestions
      runSuggest("");
    }
  };

  const runSuggest = async (ctx) => {
    setQuestions(null);
    setLoading(true);
    setSmartData(null);
    if (ctx) setUserContext(ctx);
    const r = await fetchSuggestions(allSections, section.id, profile, ctx);
    if (r) {
      setSmartData(r);
      setCtxText(r.reason || "");
      setViewMode("smart");
      onUpdate({
        ...section,
        smartData: r,
        viewMode: "smart",
        userContext: ctx || userContext,
      });
    }
    setLoading(false);
  };

  const handleQuestionsSubmit = (ctx) => runSuggest(ctx);
  const handleQuestionsSkip = () => runSuggest("");

  const handleRegen = async () => {
    setLoading(true);
    const r = await fetchSuggestions(
      allSections,
      section.id,
      profile,
      userContext || "",
    );
    if (r) {
      setSmartData(r);
      setCtxText(r.reason || "");
      onUpdate({ ...section, smartData: r });
    }
    setLoading(false);
  };

  // Reset context when user edits context block and regenerates — re-ask questions
  const handleRegenWithNewQuestions = () => {
    setUserContext(null);
    setEditCtx(false);
    handleSuggest();
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
    onUpdate({ ...section, items: [...section.items, ni], smartData: nd });
  };
  const keepAllSugg = (items) => {
    let newItems = [...section.items];
    items.forEach((it) =>
      newItems.push({
        id: uid(),
        name_en: it.name_en,
        name_zh: it.name_zh || "",
        checked: false,
        time: "",
        location: "",
        qty: 1,
      }),
    );
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

  const views = [
    { k: null, label: "📝 Flat" },
    { k: "smart", label: "✨ Smart" },
    { k: "list", label: "🏪 Aisles" },
  ];

  return (
    <div
      style={{
        background: T.card,
        borderRadius: T.radius + 2,
        marginBottom: 14,
        boxShadow: T.shadow,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 16px",
          gap: 8,
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
            color: T.green,
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
              borderBottom: `2px solid ${T.green}`,
              background: "transparent",
              fontSize: 15,
              fontWeight: 700,
              outline: "none",
              fontFamily: T.font,
              minWidth: 80,
            }}
          />
        ) : (
          <span
            onClick={() => setRenaming(true)}
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 700,
              color: T.text,
              cursor: "text",
              minWidth: 80,
            }}
          >
            {section.name}
          </span>
        )}
        <span style={{ fontSize: 12, color: T.textTer, fontWeight: 500 }}>
          {section.items.length}
        </span>
        <button
          onClick={handleSuggest}
          disabled={loading || loadingQ}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 14px",
            borderRadius: 20,
            background: loading || loadingQ ? T.bg : T.coralBg,
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            color: T.coral,
            cursor: loading || loadingQ ? "wait" : "pointer",
            transition: "all .15s",
          }}
        >
          {loading || loadingQ ? <Loader size={13} /> : <Sparkles size={13} />}
          Suggest
        </button>
        <TinyBtn onClick={() => onDelete(section.id)} title="Delete section">
          <Trash size={14} />
        </TinyBtn>
      </div>

      {/* View Toggle (pill) */}
      {!collapsed && smartData && (
        <div
          style={{
            margin: "0 16px 8px",
            display: "flex",
            background: T.bg,
            borderRadius: T.radiusSm,
            padding: 3,
          }}
        >
          {views.map((v) => (
            <button
              key={v.k || "flat"}
              onClick={() => switchView(v.k)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                background: viewMode === v.k ? T.card : "transparent",
                color: viewMode === v.k ? T.text : T.textTer,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow:
                  viewMode === v.k ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                transition: "all .2s ease",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {!collapsed && (
        <div style={{ padding: "0 16px 14px" }}>
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
              onReask={handleRegenWithNewQuestions}
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

          {/* Add item */}
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
                  lang === "en-zh" ? "Item / 输入商品名..." : "Item name..."
                }
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: T.bg,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: T.font,
                }}
              />
              <button
                onClick={addItem}
                disabled={translating}
                style={{
                  padding: "10px 16px",
                  borderRadius: T.radiusSm,
                  background: T.green,
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: translating ? "wait" : "pointer",
                }}
              >
                {translating ? <Loader size={13} /> : "Add"}
              </button>
              <button
                onClick={() => setAdding(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: T.radiusSm,
                  background: T.bg,
                  color: T.textSec,
                  border: "none",
                  fontSize: 13,
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
                gap: 5,
                padding: "10px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.green,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Plus size={15} color={T.green} />
              Add Item
            </button>
          )}

          {/* Pre-Suggest Questions */}
          {questions && !loading && (
            <QuickQuestions
              questions={questions}
              onSubmit={handleQuestionsSubmit}
              onSkip={handleQuestionsSkip}
            />
          )}

          {loadingQ && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: T.coral,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Loader size={16} />
              Understanding your list...
            </div>
          )}

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: T.coral,
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
          background: T.bg,
          fontFamily: T.font,
        }}
      >
        <div
          style={{
            color: T.textTer,
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
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          background: T.card,
          padding: "16px 20px",
          boxShadow: "0 1px 6px rgba(0,0,0,.04)",
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
                fontSize: 22,
                fontWeight: 700,
                color: T.text,
                margin: 0,
                letterSpacing: "-.3px",
              }}
            >
              Smart Grocery
            </h1>
            <p
              style={{
                fontSize: 12,
                color: T.textTer,
                margin: "3px 0 0",
                fontWeight: 500,
              }}
            >
              {sections.reduce((a, s) => a + s.items.length, 0)} items ·{" "}
              {sections.length} section{sections.length !== 1 ? "s" : ""}
              {lang === "en-zh" && " · 双语"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setAddingSec(true)}
              title="New Section"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: T.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: T.green,
              }}
            >
              <Plus size={18} color={T.green} />
            </button>
            <button
              onClick={() => setShowPrefs(true)}
              title="Preferences"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: T.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: T.textSec,
              }}
            >
              <SettingsIco size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div
        style={{
          background: T.card,
          padding: "8px 20px 10px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => loadScenario(sc)}
            style={{
              padding: "7px 14px",
              borderRadius: 20,
              border: "none",
              background: activeScenario === sc.id ? T.greenLight : T.bg,
              color: activeScenario === sc.id ? T.green : T.textSec,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow:
                activeScenario === sc.id
                  ? `inset 0 0 0 1.5px ${T.green}`
                  : "none",
              transition: "all .15s",
            }}
          >
            {sc.tab}
          </button>
        ))}
      </div>

      <div
        style={{ padding: "14px 16px 80px", maxWidth: 520, margin: "0 auto" }}
      >
        {/* Nudge */}
        {showNudge && !nudgeDismissed && !profile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: T.coralBg,
              borderRadius: T.radius,
              marginBottom: 12,
              boxShadow: T.shadow,
            }}
          >
            <span style={{ fontSize: 13, color: T.coral, fontWeight: 500 }}>
              Set your preferences for smarter suggestions
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setShowPrefs(true)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: T.coral,
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Set up
              </button>
              <TinyBtn onClick={() => setNudgeDismissed(true)}>
                <X size={14} />
              </TinyBtn>
            </div>
          </div>
        )}

        {/* New section */}
        {addingSec && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
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
                padding: "11px 14px",
                borderRadius: T.radius,
                border: "none",
                background: T.card,
                fontSize: 14,
                outline: "none",
                fontFamily: T.font,
                boxShadow: T.shadow,
              }}
            />
            <button
              onClick={addSection}
              style={{
                padding: "11px 18px",
                borderRadius: T.radius,
                background: T.green,
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add
            </button>
            <button
              onClick={() => setAddingSec(false)}
              style={{
                padding: "11px 14px",
                borderRadius: T.radius,
                background: T.bg,
                color: T.textSec,
                border: "none",
                fontSize: 14,
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
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: T.textTer,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>
              Pick a scenario above or tap + to start.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sg-spin{to{transform:rotate(360deg)}}
        @keyframes sg-fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes sg-slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
