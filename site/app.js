"use strict";

/* ------------------------------------------------------------------
 * Beslisboom
 * Elke vraag heeft opties; een optie zet waarden in `state` en bepaalt
 * de volgende vraag (`next` is een id of een functie van de state).
 * ------------------------------------------------------------------ */

const naHardware = (s) => (s.privacy === "lokaal" && s.hw === "licht" && !s.kleinModel ? "zwak" : "kanaal");

const VRAGEN = {
  ervaring: {
    titel: "Hoeveel technische ervaring heb je?",
    hint: "Dit bepaalt of je beter visueel kunt bouwen of met code.",
    opties: [
      { label: "Geen: ik wil klikken, niet programmeren", uitleg: "Je hebt nog nooit een terminal of Docker gebruikt.", zet: { skill: "laag" }, next: "privacy" },
      { label: "Een beetje: terminal en Docker lukken me", uitleg: "Je kunt een commando plakken en een config aanpassen.", zet: { skill: "midden" }, next: "privacy" },
      { label: "Ik programmeer (bijv. Python)", uitleg: "Je wilt alles zelf in de hand hebben.", zet: { skill: "hoog" }, next: "privacy" },
    ],
  },
  privacy: {
    titel: "Mag de inhoud van je memo's naar een cloud-AI?",
    hint: "Denk aan Claude of ChatGPT via een API. De beste kwaliteit, maar je tekst verlaat je huis.",
    opties: [
      { label: "Ja, kwaliteit en gemak gaan voor", uitleg: "Geen gevoelige informatie, of je vertrouwt de zakelijke API-voorwaarden.", zet: { privacy: "api" }, next: "hardware" },
      { label: "Gedeeltelijk: alleen niet-gevoelige dingen", uitleg: "Gevoelige memo's moeten thuis blijven.", zet: { privacy: "hybride" }, next: "hardware" },
      { label: "Nee, alles moet thuis blijven", uitleg: "Bijv. cliënt-, patiënt- of HR-gesprekken.", zet: { privacy: "lokaal" }, next: "hardware" },
    ],
  },
  hardware: {
    titel: "Welke computer kan dag en nacht aanstaan?",
    hint: "Spraakherkenning en vooral lokale taalmodellen vragen rekenkracht.",
    opties: [
      { label: "Mini-pc, oude laptop of Raspberry Pi", uitleg: "Geen losse videokaart.", zet: { hw: "licht" }, next: naHardware, ovNext: "kanaal*" },
      { label: "Mac met Apple Silicon, 16 GB", uitleg: "Bijv. Mac mini of MacBook met M-chip.", zet: { hw: "mac16" }, next: naHardware, ovNext: "kanaal" },
      { label: "Mac met Apple Silicon, 32 GB of meer", uitleg: "Ruim genoeg voor grotere lokale modellen.", zet: { hw: "mac32" }, next: naHardware, ovNext: "kanaal" },
      { label: "Pc met NVIDIA-videokaart (12 GB+ VRAM)", uitleg: "Bijv. RTX 3060 12GB, 4060 Ti 16GB, 3090/4090.", zet: { hw: "gpu" }, next: naHardware, ovNext: "kanaal" },
      { label: "Nog niets geschikt, ik wil iets kopen", uitleg: "Je krijgt een koopadvies.", zet: { hw: null, koop: true }, next: "budget" },
    ],
  },
  budget: {
    titel: "Wat is je budget voor hardware?",
    hint: "Indicatieve prijzen, oktober 2026.",
    opties: [
      { label: "Tot ca. €300", uitleg: "Zuinige mini-pc (bijv. Intel N100/N150).", zet: { hw: "licht", koop: true }, next: naHardware, ovNext: "kanaal*" },
      { label: "Ca. €600–1.000", uitleg: "Mac mini met M-chip, 16–24 GB.", zet: { hw: "mac16", koop: true }, next: naHardware, ovNext: "kanaal" },
      { label: "€1.500 of meer", uitleg: "Mac met 32 GB+ of pc met krachtige videokaart.", zet: { hw: "mac32", koop: true }, next: naHardware, ovNext: "kanaal" },
    ],
  },
  zwak: {
    titel: "Je hardware is te licht voor goede lokale taalmodellen. Wat wil je?",
    hint: "Spraak naar tekst lukt prima, maar een goed samenvattingsmodel lokaal draaien wordt traag en matig.",
    opties: [
      { label: "Hybride: gevoelige memo's alleen uitschrijven", uitleg: "Normale memo's via de API, gevoelige memo's krijg je zonder AI-samenvatting.", zet: { privacy: "hybride" }, next: "kanaal" },
      { label: "Klein lokaal model accepteren", uitleg: "Volledig privé, maar langzamer en minder nauwkeurig.", zet: { kleinModel: true }, next: "kanaal" },
      { label: "Toch andere hardware kopen", uitleg: "Terug naar het koopadvies.", zet: { koop: true }, next: "budget" },
    ],
  },
  kanaal: {
    titel: "Hoe wil je de assistent vanaf je mobiel bedienen?",
    hint: "Telegram is het makkelijkst: spraakberichten werken direct en je hoeft niets open te zetten op je router.",
    opties: [
      { label: "Telegram (aanbevolen)", uitleg: "Gratis bot, werkt via polling, geen open poorten.", zet: { kanaal: "telegram" }, next: "gebruik" },
      { label: "WhatsApp", uitleg: "Vertrouwd, maar de officiële API is omslachtig.", zet: { kanaal: "whatsapp" }, next: "gebruik" },
      { label: "Signal", uitleg: "Meest privé, wel een tweede telefoonnummer nodig.", zet: { kanaal: "signal" }, next: "gebruik" },
      { label: "Eigen web-app op mijn telefoon", uitleg: "Opnameknop in de browser, via een privé-VPN (Tailscale).", zet: { kanaal: "web" }, next: "gebruik" },
      { label: "Spraakassistent thuis + app", uitleg: "Home Assistant met wekwoord in huis, de app onderweg.", zet: { kanaal: "spraak" }, next: "gebruik" },
    ],
  },
  gebruik: {
    titel: "Waarvoor ga je het vooral gebruiken?",
    hint: "Daarmee bepalen we de uitbreidingen die het meest opleveren.",
    opties: [
      { label: "Verslagen van gesprekken en vergaderingen", uitleg: "Zakelijk: besluiten en actiepunten in je mail.", zet: { gebruik: "verslagen" }, next: null },
      { label: "Ideeën, notities en taken onderweg", uitleg: "Je hoofd leegmaken in de auto of tijdens een wandeling.", zet: { gebruik: "notities" }, next: null },
      { label: "Documenten en kennis doorzoeken", uitleg: "Vragen stellen over je eigen PDF's en contracten.", zet: { gebruik: "kennis" }, next: null },
      { label: "Huishouden en gezin", uitleg: "Boodschappen, weekmenu, herinneringen, administratie.", zet: { gebruik: "huishouden" }, next: null },
      { label: "Slim huis bedienen", uitleg: "Verwarming, lampen, sloten, NAS-status.", zet: { gebruik: "slimhuis" }, next: null },
    ],
  },
};
const START = "ervaring";
const MAX_STAPPEN = 6;

/* ------------------------------------------------------------------
 * Top 10 toepassingen
 * ------------------------------------------------------------------ */
const TOP10 = [
  { t: "Gespreks- en vergaderverslagen", d: "Overleg of klantgesprek opnemen → verslag met besluiten en actiepunten in je mail.", soort: "zakelijk", g: ["verslagen"] },
  { t: "Gedachten dumpen onderweg", d: "Ideeën inspreken in de auto; de assistent ordent ze per thema in je mail of notitie-app.", soort: "beide", g: ["notities"] },
  { t: "Dagelijkse briefing", d: "Elke ochtend agenda, weer, belangrijke mails en deadlines in één bericht.", soort: "beide", g: ["notities", "huishouden", "verslagen"] },
  { t: "Mails laten opstellen", d: "\"Antwoord Jan dat de offerte vrijdag komt\" → conceptmail klaar, jij drukt op verzenden.", soort: "zakelijk", g: ["verslagen", "notities"] },
  { t: "Taken en herinneringen", d: "\"Herinner me donderdag aan de btw-aangifte\" → in je agenda, met een ping op tijd.", soort: "beide", g: ["notities", "huishouden"] },
  { t: "Eigen kennisbank doorzoeken", d: "\"Wat staat er in het contract met X over opzegtermijn?\" → antwoord uit je lokale documenten.", soort: "zakelijk", g: ["kennis"] },
  { t: "Bonnetjes en administratie", d: "Foto van een bon → bedrag, btw en leverancier in een spreadsheet, bestand gearchiveerd.", soort: "beide", g: ["huishouden", "kennis"] },
  { t: "Boodschappen en maaltijden", d: "Gedeelde boodschappenlijst en een weekmenu op basis van wat je in huis hebt.", soort: "prive", g: ["huishouden"] },
  { t: "Slim huis en thuisserver", d: "\"Zet de verwarming op 19 graden\" of \"hoe vol is mijn NAS?\" vanaf elke plek.", soort: "prive", g: ["slimhuis"] },
  { t: "Leren, coachen en dagboek", d: "Spraakdagboek met wekelijkse reflectie, of talen oefenen met gesproken correctie.", soort: "prive", g: ["notities"] },
];

/* ------------------------------------------------------------------
 * Advies opbouwen
 * ------------------------------------------------------------------ */
function advies(s) {
  const homeAssistant = s.kanaal === "spraak" || s.gebruik === "slimhuis";

  // Profiel
  const profielen = {
    api: ["De snelle start", "Topkwaliteit met minimale hardware: spraak en samenvatting zo eenvoudig mogelijk."],
    hybride: ["Het beste van twee werelden", "Dagelijkse memo's via een sterke cloud-AI, gevoelige memo's blijven thuis."],
    lokaal: ["De privacykluis", "Alles draait op je eigen computer: er gaat geen woord naar een AI-bedrijf."],
  };
  const [profiel, profielUitleg] = profielen[s.privacy];

  // Orkestratie
  let orkestratie;
  if (s.skill === "hoog") {
    orkestratie = { v: "Python-script", w: "Het kant-en-klare voorbeeld uit de repository (±100 regels), volledig zelf aan te passen." };
  } else {
    orkestratie = { v: "n8n (zelf gehost)", w: s.skill === "laag" ? "Visueel workflows bouwen door blokjes te verbinden; installeren via Docker Desktop." : "Draait in Docker, honderden koppelingen (Gmail, agenda, Notion, Drive)." };
  }
  if (homeAssistant) {
    orkestratie.v = "Home Assistant + " + orkestratie.v;
    orkestratie.w = "Home Assistant voor spraak in huis en apparaten, " + orkestratie.w.charAt(0).toLowerCase() + orkestratie.w.slice(1);
  }

  // Spraak naar tekst
  let stt;
  if (s.hw === "licht" && s.privacy === "api") {
    stt = { v: "Whisper-API (OpenAI of Groq)", w: "Snel en goedkoop (ca. €0,005 per minuut); je lichte computer hoeft niets te rekenen." };
  } else if (s.hw === "licht") {
    stt = { v: "faster-whisper, model small/medium (CPU)", w: "Werkt zonder videokaart; een memo van 5 minuten duurt ongeveer 2 tot 5 minuten." };
  } else if (s.hw === "gpu") {
    stt = { v: "faster-whisper large-v3-turbo (CUDA)", w: "Uitstekend Nederlands; 5 minuten audio in een paar seconden." };
  } else {
    stt = { v: "whisper.cpp / mlx-whisper large-v3-turbo", w: "Gebruikt de Apple-chip, dus snel en zuinig. Draai dit buiten Docker om de GPU te benutten." };
  }

  // Taalmodel
  const lokaalModel = {
    licht: "Ollama met een klein model (3–4B, bijv. Qwen3 4B of Llama 3.2 3B)",
    mac16: "Ollama met een 8B-model (bijv. Qwen3 8B of Llama 3.1 8B)",
    mac32: "Ollama met een 27–32B-model (bijv. Qwen3 32B of Gemma 3 27B)",
    gpu: "Ollama met een 14–32B-model, afhankelijk van je VRAM",
  }[s.hw];
  let llm;
  if (s.privacy === "api") {
    llm = { v: "Claude-API (Sonnet)", w: "Uitstekende Nederlandse samenvattingen; een memo kost een fractie van een cent." };
  } else if (s.privacy === "hybride" && s.hw === "licht") {
    llm = { v: "Claude-API + 'privé'-schakelaar", w: "Begint je memo met \"privé\", dan krijg je alleen de lokale transcriptie, zonder AI-samenvatting." };
  } else if (s.privacy === "hybride") {
    llm = { v: "Claude-API + " + lokaalModel.replace("Ollama met ", "lokaal "), w: "Standaard de API; memo's die beginnen met \"privé\" gaan naar het lokale model." };
  } else {
    llm = { v: lokaalModel, w: s.hw === "licht" ? "Volledig privé, maar reken op een minuut of langer per samenvatting en eenvoudigere samenvattingen." : "Volledig privé. Kies gerust een nieuwer model in dezelfde grootteklasse." };
  }

  // Kanaal
  const kanalen = {
    telegram: { v: "Telegram-bot", w: "Aanmaken via @BotFather; de bot haalt zelf berichten op, dus geen open poorten." },
    whatsapp: { v: "WhatsApp Business Cloud API", w: "Vereist een Meta-ontwikkelaarsaccount en een publiek bereikbare webhook (Cloudflare Tunnel). Tip: start met Telegram en schakel later over." },
    signal: { v: "Signal via signal-cli-rest-api", w: "Draait in Docker; registreer een apart (prepaid of vast) nummer voor de assistent." },
    web: { v: "Eigen web-app via Tailscale", w: "Een opnamepagina (n8n-formulier of eenvoudige PWA), alleen bereikbaar via je privé-VPN." },
    spraak: { v: "Home Assistant Assist + app", w: "Wekwoord thuis via een Voice-speaker, onderweg via de Home Assistant-app (op afstand via Tailscale of Nabu Casa)." },
  };
  const kanaal = kanalen[s.kanaal];

  // Uitvoer
  const uitvoer = s.privacy === "lokaal"
    ? { v: "Mail (SMTP) of je eigen notitiemap", w: "Let op: een mail via Gmail staat bij Google. Voor maximale privacy kun je naar Nextcloud of Obsidian op je eigen schijf schrijven." }
    : { v: "Mail via SMTP (Gmail-app-wachtwoord)", w: "Samenvatting en volledige transcriptie in je inbox; makkelijk terug te zoeken." };

  // Hardware-advies
  const hwTekst = {
    licht: s.koop ? "Koop een zuinige mini-pc met Intel N100/N150 en 16 GB RAM (ca. €180–300). Verbruik 6–10 W." : "Je mini-pc of oude laptop volstaat. Zet slaapstand uit en sluit hem met een kabel aan op je router.",
    mac16: s.koop ? "Koop een Mac mini met M-chip en 16–24 GB (ca. €700–1.000). Stil en zuinig (5–7 W idle)." : "Je Mac volstaat. Zet 'Voorkom automatische sluimerstand' aan in de energie-instellingen.",
    mac32: s.koop ? "Koop een Mac mini/Studio met 32 GB+ (vanaf ca. €1.500), of een pc met een RTX-kaart met 16–24 GB VRAM." : "Je Mac kan grotere lokale modellen draaien. Zet de sluimerstand uit.",
    gpu: "Je pc is krachtig. Let op het stroomverbruik bij 24/7: zet Wake-on-LAN of een sluimerschema aan, of laat alleen een zuinige mini-pc altijd aanstaan.",
  }[s.hw];

  // Kosten
  const apiKosten = s.privacy === "lokaal" ? "€0" : s.privacy === "hybride" ? "€1–10 per maand" : "€2–15 per maand";
  const stroom = s.hw === "gpu" ? "€100–250 per jaar" : "€10–30 per jaar";
  const tijd = { laag: "een middag (3–4 uur)", midden: "ca. 2 uur", hoog: "1–2 uur" }[s.skill];

  // Stappenplan
  const stappen = [];
  stappen.push(s.koop ? "Koop de hardware (zie hardware-advies) en installeer de updates." : "Zet je computer klaar voor 24/7: sluimerstand uit, netwerkkabel aan, automatisch inloggen of diensten automatisch laten starten.");
  if (s.skill === "hoog") stappen.push("Installeer Python 3.11+ en clone de repository.");
  else stappen.push(s.skill === "laag" ? "Installeer Docker Desktop en start n8n met één commando (zie hieronder)." : "Installeer Docker en start n8n met docker compose (alleen luisterend op localhost).");
  if (homeAssistant) stappen.push("Installeer Home Assistant (Docker of een aparte Home Assistant Green) en koppel je apparaten.");
  stappen.push({
    telegram: "Maak in Telegram via @BotFather een bot aan en vraag je eigen gebruikers-ID op via @userinfobot.",
    whatsapp: "Maak een Meta-ontwikkelaarsaccount en een WhatsApp Business-app aan, en zet een Cloudflare Tunnel op voor de webhook.",
    signal: "Start signal-cli-rest-api in Docker en registreer het nummer van de assistent.",
    web: "Installeer Tailscale op je computer en telefoon en maak een opnamepagina (n8n Form Trigger of PWA).",
    spraak: "Stel Home Assistant Assist in met Whisper (spraak) en Piper (stem) en installeer de app op je telefoon.",
  }[s.kanaal]);
  if (stt.v.startsWith("Whisper-API")) stappen.push("Maak een API-sleutel aan voor de Whisper-API.");
  else stappen.push("Installeer " + stt.v.split(",")[0] + " en test het met een spraakmemo.");
  if (s.privacy !== "lokaal") stappen.push("Maak een API-sleutel aan op console.anthropic.com en stel een maandlimiet in.");
  if (s.privacy !== "api" && !(s.privacy === "hybride" && s.hw === "licht")) stappen.push("Installeer Ollama en haal het model op, bijv. ollama pull qwen3:8b (pas de grootte aan je hardware aan).");
  stappen.push("Maak in je Google-account een app-wachtwoord voor het verzenden van mail (2FA vereist).");
  if (s.skill === "hoog") stappen.push("Vul .env in op basis van voorbeeld/.env.example en start python voorbeeld/assistent.py." + (s.privacy === "lokaal" ? " Vervang de Claude-aanroep door Ollama (OpenAI-compatibel endpoint op localhost:11434)." : ""));
  else stappen.push("Bouw de workflow: Trigger → controleer afzender-ID → download audio → Whisper → AI-samenvatting → Send Email → bevestiging terug naar je telefoon.");
  stappen.push("Test met een paar memo's en verfijn de samenvattingsprompt.");
  stappen.push(s.skill === "hoog" ? "Laat het script automatisch starten met een systemd-service of launchd." : "Zet in Docker 'restart: unless-stopped' zodat alles na een herstart vanzelf weer draait.");

  // Code
  let code = "";
  if (s.skill === "hoog") {
    code = "git clone https://github.com/veldepatrick-jpg/Efficient-AI-toepassen\ncd Efficient-AI-toepassen/voorbeeld\npip install -r requirements.txt\ncp .env.example .env   # invullen\npython assistent.py";
  } else {
    code = "docker run -d --name n8n --restart unless-stopped \\\n  -p 127.0.0.1:5678:5678 -v n8n_data:/home/node/.n8n \\\n  docker.n8n.io/n8nio/n8n\n# open daarna http://localhost:5678";
  }

  // Beveiliging
  const veilig = [
    "Laat de assistent alleen reageren op jouw eigen gebruikers-ID of nummer.",
    "Zet geen poorten open op je router; gebruik Tailscale voor toegang van buitenaf.",
    "Bewaar sleutels en wachtwoorden in een .env-bestand, nooit in je code of in Git.",
    "Laat de assistent eerst alleen naar jezelf mailen; acties naar anderen alleen met een bevestigingsknop.",
    "Houd Docker-images en je besturingssysteem up-to-date en maak een back-up van je workflows.",
  ];
  if (s.kanaal === "whatsapp") veilig.push("Controleer de handtekening van elke binnenkomende WhatsApp-webhook en zet alleen dat ene pad open via de tunnel.");
  if (s.kanaal === "web") veilig.push("Zet de opnamepagina alleen open binnen je Tailscale-netwerk, niet via Funnel.");
  if (s.gebruik === "verslagen") veilig.push("Vraag toestemming voordat je een gesprek opneemt en leg vast hoe lang opnames bewaard worden (AVG).");
  if (s.gebruik === "verslagen" && s.privacy !== "lokaal") veilig.push("Gebruik voor klantgegevens een API met zakelijke voorwaarden en een verwerkersovereenkomst.");
  if (s.gebruik === "kennis") veilig.push("Geef de assistent alleen leesrechten op de documentmap; leest hij mail of web, wees dan alert op prompt-injectie.");

  // Uitbreidingen
  const uitbreiding = {
    verslagen: ["Sprekerherkenning toevoegen (bijv. pyannote) zodat het verslag laat zien wie wat zei.", "Actiepunten automatisch in je takenlijst of agenda zetten.", "Conceptmail met het verslag klaarzetten voor de deelnemers."],
    notities: ["Notities per thema opslaan in Notion of Obsidian.", "Een dagelijkse ochtendbriefing met agenda en open taken.", "\"Herinner me ...\" laten omzetten naar agenda-afspraken."],
    kennis: ["Je documentenmap indexeren (bijv. met Open WebUI of AnythingLLM) zodat je er vragen over kunt stellen.", "Foto's van documenten laten uitlezen en archiveren.", "Bronvermelding in elk antwoord zodat je het kunt controleren."],
    huishouden: ["Een gedeelde boodschappenlijst met je partner.", "Foto van een bonnetje → regel in je huishoudspreadsheet.", "Een weekmenu op basis van wat er in de koelkast ligt."],
    slimhuis: ["Spraakopdrachten koppelen aan scènes (\"ik ga slapen\").", "Een melding als de voordeur te lang openstaat.", "Een wekelijkse samenvatting van energieverbruik per mail."],
  }[s.gebruik];

  const titel = `${orkestratie.v} · ${kanaal.v.split(" ")[0]} · ${s.privacy === "lokaal" ? "100% lokaal" : s.privacy === "hybride" ? "hybride" : "Claude-API"}`;

  return { profiel, profielUitleg, titel, onderdelen: [
    { label: "Ingang vanaf mobiel", ...kanaal },
    { label: "Spraak → tekst", ...stt },
    { label: "Samenvatten (AI)", ...llm },
    { label: "Regie / workflow", ...orkestratie },
    { label: "Uitvoer", ...uitvoer },
  ], hwTekst, apiKosten, stroom, tijd, stappen, code, veilig, uitbreiding,
  waarschuwing: s.kanaal === "whatsapp" ? "WhatsApp is de lastigste ingang: Meta vraagt om een zakelijk account en een webhook die van buitenaf bereikbaar is. Wil je snel resultaat, begin dan met Telegram." : (s.kleinModel ? "Met een klein lokaal model zijn samenvattingen bruikbaar maar minder nauwkeurig. Controleer belangrijke actiepunten altijd zelf." : "") };
}

/* ------------------------------------------------------------------
 * Weergave
 * ------------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let pad = []; // [{ vraag, keuze }]

function staatUitPad() {
  const s = {};
  for (const { vraag, keuze } of pad) Object.assign(s, VRAGEN[vraag].opties[keuze].zet);
  return s;
}

function huidigeVraag() {
  let id = START;
  const s = {};
  for (const { vraag, keuze } of pad) {
    const opt = VRAGEN[vraag].opties[keuze];
    Object.assign(s, opt.zet);
    id = typeof opt.next === "function" ? opt.next(s) : opt.next;
  }
  return id;
}

function schrijfHash() {
  const h = pad.map((p) => `${p.vraag}.${p.keuze}`).join("-");
  history.replaceState(null, "", h ? `#a=${h}` : location.pathname);
}

function leesHash() {
  const m = location.hash.match(/^#a=([\w.\-]+)$/);
  if (!m) return [];
  const res = [];
  for (const deel of m[1].split("-")) {
    const [vraag, k] = deel.split(".");
    const keuze = Number(k);
    if (!VRAGEN[vraag] || !VRAGEN[vraag].opties[keuze]) return [];
    res.push({ vraag, keuze });
  }
  return res;
}

function render() {
  const id = huidigeVraag();
  schrijfHash();

  // Pad (klik = terug naar die vraag)
  $("#pad").innerHTML = pad.map((p, i) =>
    `<li><button data-terug="${i}" title="Wijzig dit antwoord">${esc(VRAGEN[p.vraag].opties[p.keuze].label.split(":")[0])}</button></li>`).join("");

  const klaar = id === null;
  $("#progress-bar").style.width = klaar ? "100%" : `${Math.min(95, (pad.length / MAX_STAPPEN) * 100)}%`;
  $("#vraag").hidden = klaar;
  $("#resultaat").hidden = !klaar;

  if (klaar) return renderResultaat(advies(staatUitPad()));

  $("#resultaat").innerHTML = "";
  const v = VRAGEN[id];
  $("#vraag").innerHTML = `
    <div class="question">
      <p class="step">Vraag ${pad.length + 1}</p>
      <h2 id="vraagtitel" tabindex="-1">${esc(v.titel)}</h2>
      <p class="hint">${esc(v.hint)}</p>
      <div class="options">
        ${v.opties.map((o, i) => `<button class="option" data-keuze="${i}"><strong>${esc(o.label)}</strong><span>${esc(o.uitleg)}</span></button>`).join("")}
      </div>
      ${pad.length ? `<div class="nav"><button class="btn" data-actie="terug">← Vorige vraag</button></div>` : ""}
    </div>`;
  $("#vraag").dataset.id = id;
  markeerTop10(null);
}

function renderResultaat(a) {
  $("#resultaat").innerHTML = `
    <div class="result">
      <span class="badge">${esc(a.profiel)}</span>
      <h2 id="resultaattitel" tabindex="-1">Jouw advies: ${esc(a.titel)}</h2>
      <p class="muted">${esc(a.profielUitleg)}</p>
      ${a.waarschuwing ? `<div class="note">${esc(a.waarschuwing)}</div>` : ""}

      <div class="stack">
        ${a.onderdelen.map((o) => `<div class="item"><div class="label">${esc(o.label)}</div><div class="value">${esc(o.v)}</div><div class="why">${esc(o.w)}</div></div>`).join("")}
      </div>

      <h3>Hardware</h3>
      <p>${esc(a.hwTekst)}</p>

      <h3>Kosten en tijd (indicatie)</h3>
      <ul>
        <li>AI-gebruik: <strong>${esc(a.apiKosten)}</strong></li>
        <li>Stroom bij 24/7: <strong>${esc(a.stroom)}</strong></li>
        <li>Software: <strong>gratis</strong> (open source)</li>
        <li>Opzetten: <strong>${esc(a.tijd)}</strong></li>
      </ul>

      <h3>Stappenplan</h3>
      <ol>${a.stappen.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <pre><code>${esc(a.code)}</code></pre>

      <h3>Beveiliging: vanaf dag één</h3>
      <ul class="checks">${a.veilig.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>

      <h3>Daarna uitbreiden met</h3>
      <ul>${a.uitbreiding.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>

      <div class="nav">
        <button class="btn" data-actie="terug">← Vorige vraag</button>
        <button class="btn" data-actie="opnieuw">Opnieuw beginnen</button>
        <button class="btn" data-actie="kopieer">Link naar dit advies kopiëren</button>
        <button class="btn" data-actie="print">Printen / PDF</button>
      </div>
    </div>`;
  markeerTop10(staatUitPad().gebruik);
}

function focusTitel() {
  const el = $("#resultaattitel") || $("#vraagtitel");
  if (el) el.focus({ preventScroll: true });
  $("#boom").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#boom").addEventListener("click", async (e) => {
  const knop = e.target.closest("button");
  if (!knop) return;
  if (knop.dataset.keuze !== undefined) {
    pad.push({ vraag: $("#vraag").dataset.id, keuze: Number(knop.dataset.keuze) });
  } else if (knop.dataset.terug !== undefined) {
    pad = pad.slice(0, Number(knop.dataset.terug));
  } else if (knop.dataset.actie === "terug") {
    pad.pop();
  } else if (knop.dataset.actie === "opnieuw") {
    pad = [];
  } else if (knop.dataset.actie === "kopieer") {
    try {
      await navigator.clipboard.writeText(location.href);
      knop.textContent = "✓ Link gekopieerd";
    } catch {
      prompt("Kopieer deze link:", location.href);
    }
    return;
  } else if (knop.dataset.actie === "print") {
    return window.print();
  } else return;
  render();
  focusTitel();
});

/* Top 10 */
function renderTop10(filter = "alle") {
  $("#top10").innerHTML = TOP10.map((x, i) => ({ ...x, n: i + 1 }))
    .filter((x) => filter === "alle" || x.soort === filter || x.soort === "beide")
    .map((x) => `<li data-g="${x.g.join(" ")}"><div class="num">#${x.n}</div><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p><div class="tags">${x.soort === "beide" ? "Zakelijk & privé" : x.soort === "zakelijk" ? "Zakelijk" : "Privé"}</div></li>`)
    .join("");
  markeerTop10(staatUitPad().gebruik);
}
function markeerTop10(gebruik) {
  document.querySelectorAll("#top10 li").forEach((li) => {
    li.classList.toggle("hl", !!gebruik && huidigeVraag() === null && li.dataset.g.split(" ").includes(gebruik));
  });
}
document.querySelector(".filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderTop10(chip.dataset.filter);
});

/* Overzicht van de hele boom */
function renderOverzicht() {
  const naam = (id) => (id === null ? "Advies" : id === "kanaal*" ? "Kanaal (bij 'alles lokaal': eerst een extra vraag over je hardware)" : VRAGEN[id].titel);
  $("#overzicht").innerHTML = `<ul>${Object.entries(VRAGEN).map(([id, v]) => `
    <li><span class="ov-q">${esc(v.titel)}</span>
      <ul>${v.opties.map((o) => `<li>${esc(o.label)} <span class="ov-a">→ ${esc(naam(o.ovNext ?? (typeof o.next === "function" ? "kanaal" : o.next)))}</span></li>`).join("")}</ul>
    </li>`).join("")}</ul>`;
}

pad = leesHash();
// Pad uit de URL afkappen tot waar het een geldige route door de boom is.
(function valideerPad() {
  const geldig = [];
  let id = START;
  const s = {};
  for (const stap of pad) {
    if (stap.vraag !== id) break;
    geldig.push(stap);
    const opt = VRAGEN[stap.vraag].opties[stap.keuze];
    Object.assign(s, opt.zet);
    id = typeof opt.next === "function" ? opt.next(s) : opt.next;
    if (id === null) break;
  }
  pad = geldig;
})();

renderTop10();
renderOverzicht();
render();
