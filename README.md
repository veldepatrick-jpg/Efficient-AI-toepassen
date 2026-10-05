# Persoonlijke AI-assistent op je thuiscomputer, bediend via je mobiel

Advies voor een eigen AI-assistent die thuis draait en die je vanaf je telefoon aanstuurt.
Het leidende voorbeeld: **je spreekt een memo in → de assistent zet het om naar tekst → maakt er een samenvatting van → mailt die naar jou.**
Onderaan staat een top 10 van praktijktoepassingen, zakelijk en privé.

---

## 1. Hoe het in elkaar zit

```
 📱 Telefoon                    🏠 Thuiscomputer                          ☁️ / lokaal
 ──────────                    ────────────────                          ──────────
 Spraakmemo in   ──Telegram──▶  Bot / workflow  ──▶ Spraak→tekst (Whisper)
 Telegram/Signal                     │
                                     ├──▶ Taalmodel (lokaal of via API) ──▶ samenvatting, acties
                                     │
                                     └──▶ Mail (SMTP) / agenda / notities ──▶ 📧 jouw inbox
```

Vier bouwstenen, voor elk een keuze:

| Bouwsteen | Aanrader | Alternatieven |
|---|---|---|
| **Ingang vanaf mobiel** | **Telegram-bot** (gratis, spraakberichten werken direct, geen poorten openzetten) | Signal (via signal-cli), WhatsApp (Business API, omslachtiger), eigen web-app via Tailscale |
| **Spraak → tekst** | **Whisper lokaal** (`faster-whisper`, model `large-v3-turbo`), uitstekend Nederlands | OpenAI/Groq Whisper-API, Deepgram |
| **Denkwerk (LLM)** | **API van Claude/GPT** voor topkwaliteit, of **Ollama** lokaal voor maximale privacy | LM Studio, Qwen/Llama/Mistral lokaal |
| **Orkestratie** | **n8n** (zelf gehost, visueel, veel koppelingen) of een **klein Python-script** | Home Assistant, Node-RED, kant-en-klare agents (zoals OpenClaw) |

### Drie routes, van makkelijk naar maximaal controle

1. **Low-code (aanbevolen voor de meeste mensen): n8n in Docker**
   Workflow: *Telegram Trigger → Download bestand → Whisper → LLM-node → Gmail/SMTP-node*.
   In een middag werkend, later eenvoudig uit te breiden met agenda, Notion, Google Drive, enz.
2. **Zelf programmeren: Python-script** (zie [`voorbeeld/`](voorbeeld/))
   ±120 regels, volledig onder eigen beheer, makkelijk aan te passen.
3. **Kant-en-klare open-source agent** (bijv. OpenClaw, Home Assistant Assist)
   Veel functies direct, maar geeft het systeem veel rechten. Alleen doen als je de beveiliging (hoofdstuk 4) serieus neemt.

---

## 2. Hardware

| Scenario | Wat je nodig hebt |
|---|---|
| **Whisper lokaal + LLM via API** | Elke moderne pc/mini-pc of Mac (16 GB RAM). Whisper draait prima op CPU; met een GPU is het een paar keer sneller. |
| **Alles lokaal (privacy)** | Mac met Apple Silicon en 32 GB+ geheugen, **of** pc met NVIDIA-kaart met 12–24 GB VRAM. Modellen van 8–32B parameters zijn dan goed bruikbaar. |
| **Zuinig 24/7** | Mac mini of mini-pc (N100/Ryzen) verbruikt 5–15 W idle. Een gamepc die dag en nacht aanstaat kost al snel €100–250 per jaar aan stroom. |

Tip: zet de computer op een vaste plek met een kabel, schakel slaapstand uit (of gebruik Wake-on-LAN) en laat de diensten automatisch starten (Docker `restart: unless-stopped` of een systemd-service).

---

## 3. Kosten (indicatie)

- **Software**: gratis (n8n self-hosted, Whisper, Ollama, Telegram).
- **LLM-API**: een samenvatting van een memo van 5 minuten kost een fractie van een cent tot enkele centen. Bij intensief dagelijks gebruik reken op €2–€15 per maand.
- **Volledig lokaal**: €0 aan API-kosten, wel stroom en (eventueel) een zwaardere machine.

---

## 4. Beveiliging en privacy: niet overslaan

- **Zet geen poorten open op je router.** Telegram werkt via *polling* (de thuiscomputer haalt zelf berichten op). Wil je een webinterface vanaf je mobiel? Gebruik **Tailscale** of WireGuard.
- **Whitelist jouw eigen Telegram-gebruikers-ID**; negeer alle andere afzenders. Anders kan iedereen die je bot vindt hem gebruiken.
- **Geheimen in een `.env`-bestand**, nooit in code of Git. Gebruik voor Gmail een **app-wachtwoord**, niet je echte wachtwoord.
- **Beperk wat de assistent mag.** Begin met "alleen naar mezelf mailen". Mail naar anderen, bestanden verwijderen of betalingen: altijd met een bevestigingsknop.
- **Prompt-injectie**: als de assistent mails of webpagina's leest, kan daar een verborgen opdracht in staan. Geef zo'n assistent geen schrijfrechten zonder bevestiging.
- **Gevoelige gesprekken** (cliënten, patiënten, HR): kies de volledig lokale route of een API met een zakelijke verwerkersovereenkomst (AVG), en vraag toestemming voordat je gesprekken opneemt.
- **Updates en back-ups**: houd Docker-images en het OS bij, maak een back-up van je n8n-workflows/config.

---

## 5. Stappenplan (route n8n, ±2 uur)

1. Installeer **Docker** en start n8n: `docker run -d --name n8n --restart unless-stopped -p 127.0.0.1:5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n`
2. Maak in Telegram via **@BotFather** een bot aan en kopieer de token. Vraag je eigen ID op via **@userinfobot**.
3. Spraak→tekst: draai een Whisper-server lokaal (bijv. `faster-whisper-server` / *speaches* in Docker) of gebruik een Whisper-API.
4. Bouw de workflow: **Telegram Trigger** → *IF: afzender = mijn ID* → **Telegram: Get File** → **HTTP Request naar Whisper** → **LLM-node** (prompt hieronder) → **Gmail/Send Email**.
5. Laat de bot in Telegram antwoorden met "✅ Samenvatting gemaild" plus de korte versie.
6. Test met een memo, verfijn de prompt, klaar.

Voorbeeldprompt:

> Je krijgt de transcriptie van een ingesproken memo (Nederlands). Maak:
> 1. een onderwerpregel van max. 8 woorden;
> 2. een samenvatting in 3–5 bullets;
> 3. een lijst actiepunten met eigenaar en deadline (indien genoemd);
> 4. open vragen.
> Verzin niets wat niet in de tekst staat.

Liever code? Zie [`voorbeeld/assistent.py`](voorbeeld/assistent.py) voor dezelfde flow in Python.

---

## 6. Top 10: waar mensen dit in de praktijk voor gebruiken

| # | Toepassing | Zakelijk / privé | Hoe het werkt |
|---|---|---|---|
| 1 | **Gespreks- en vergaderverslagen** | Zakelijk | Neem een overleg, klantgesprek of keukentafelgesprek op met je telefoon, stuur het naar de bot → binnen minuten een verslag met besluiten en actiepunten in je mail. |
| 2 | **Gedachten dumpen onderweg** | Beide | In de auto of tijdens het wandelen ideeën inspreken; de assistent ordent ze per thema en mailt of zet ze in Notion/Obsidian. |
| 3 | **Dagelijkse briefing** | Beide | Elke ochtend om 07:00 een bericht/mail met agenda, weer, belangrijkste mails, deadlines en nieuws over jouw onderwerpen. |
| 4 | **Mails en berichten opstellen** | Zakelijk | "Antwoord Jan dat de offerte vrijdag komt, vriendelijk maar kort" inspreken → conceptmail klaar in je concepten-map, jij drukt op verzenden. |
| 5 | **Taken en herinneringen** | Beide | "Herinner me donderdag om 9 uur aan de btw-aangifte" → komt in je takenlijst/agenda en de bot pingt je op tijd. |
| 6 | **Documenten doorzoeken (eigen kennisbank)** | Zakelijk | Vraag vanaf je mobiel "wat staat er in het contract met X over opzegtermijn?" → de assistent doorzoekt je lokale PDF's en mappen (privé, niet in de cloud). |
| 7 | **Bonnetjes en administratie** | Beide | Foto van een bon of factuur sturen → bedrag, datum, btw en leverancier worden uitgelezen, in een spreadsheet gezet en het bestand netjes gearchiveerd. |
| 8 | **Boodschappen, maaltijden en huishouden** | Privé | "Wat kan ik koken met prei, eieren en feta?" of "zet melk en koffie op de lijst" → gedeelde boodschappenlijst met partner, weekmenu per mail. |
| 9 | **Slim huis en thuisserver beheren** | Privé | Via Home Assistant: "zet de verwarming op 19 graden", "is de achterdeur dicht?", of "hoe vol is de schijf van mijn NAS?" vanaf elke plek. |
| 10 | **Leren, coachen en dagboek** | Privé | Dagelijks een spraakdagboek inspreken → wekelijkse reflectie per mail; of talen oefenen met gesproken correctie; of een studie-/leesnotitie omzetten in samenvatting en flashcards. |

**Bonus-ideeën**: monitor websites op prijsdalingen of nieuwe vacatures, transcribeer en vat podcasts/YouTube-video's samen, laat lange WhatsApp-spraakberichten van anderen samenvatten, of laat je assistent contentideeën voor LinkedIn uitwerken uit een ingesproken notitie.

---

## 7. Advies in het kort

1. **Begin klein**: één flow (spraakmemo → samenvatting per mail) die écht werkt, en breid daarna uit.
2. **Telegram + n8n + Whisper lokaal + een LLM-API** is de beste balans tussen gemak, kwaliteit en kosten.
3. **Privacy belangrijk?** Vervang de API door Ollama op een Mac met veel geheugen of een pc met een goede GPU.
4. **Beveilig vanaf dag één**: whitelist op afzender-ID, geen open poorten, geheimen in `.env`, bevestiging voor elke actie naar buiten.
5. **Zuinige, altijd-aan hardware** (mini-pc of Mac mini) betaalt zich terug ten opzichte van een gamepc die 24/7 draait.
