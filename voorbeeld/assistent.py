"""Spraakmemo via Telegram -> transcriptie (Whisper) -> samenvatting (Claude) -> e-mail.

Starten:  pip install -r requirements.txt  &&  python assistent.py
Configuratie via .env (zie .env.example).
"""
import os
import smtplib
import tempfile
from email.message import EmailMessage

import anthropic
from dotenv import load_dotenv
from faster_whisper import WhisperModel
from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

load_dotenv()

TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
TOEGESTANE_ID = int(os.environ["TELEGRAM_USER_ID"])
MAIL_AAN = os.environ["MAIL_AAN"]
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_USER = os.environ["SMTP_USER"]
SMTP_WACHTWOORD = os.environ["SMTP_WACHTWOORD"]  # Gmail: app-wachtwoord
MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5")

PROMPT = """Je krijgt de transcriptie van een ingesproken memo (Nederlands).
Geef als antwoord:
- Eerste regel: een onderwerpregel van max. 8 woorden (zonder opmaak).
- Daarna een lege regel en:
  ## Samenvatting (3-5 bullets)
  ## Actiepunten (met eigenaar/deadline indien genoemd)
  ## Open vragen
Verzin niets wat niet in de tekst staat.

Transcriptie:
{tekst}"""

# "large-v3-turbo" is snel en goed in Nederlands; kies "small" op een trage machine.
whisper = WhisperModel(os.getenv("WHISPER_MODEL", "large-v3-turbo"), device="auto", compute_type="auto")
claude = anthropic.Anthropic()  # leest ANTHROPIC_API_KEY uit de omgeving


def transcribeer(pad: str) -> str:
    segmenten, _ = whisper.transcribe(pad, language="nl", vad_filter=True)
    return " ".join(s.text.strip() for s in segmenten)


def vat_samen(tekst: str) -> tuple[str, str]:
    antwoord = claude.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": PROMPT.format(tekst=tekst)}],
    )
    uitvoer = antwoord.content[0].text.strip()
    onderwerp, _, rest = uitvoer.partition("\n")
    return onderwerp.strip() or "Samenvatting spraakmemo", rest.strip()


def mail(onderwerp: str, samenvatting: str, transcriptie: str) -> None:
    bericht = EmailMessage()
    bericht["Subject"] = f"[Memo] {onderwerp}"
    bericht["From"] = SMTP_USER
    bericht["To"] = MAIL_AAN
    bericht.set_content(f"{samenvatting}\n\n---\nVolledige transcriptie:\n{transcriptie}")
    with smtplib.SMTP_SSL(SMTP_HOST, 465) as smtp:
        smtp.login(SMTP_USER, SMTP_WACHTWOORD)
        smtp.send_message(bericht)


async def verwerk_spraak(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.effective_user.id != TOEGESTANE_ID:
        return  # negeer onbekende afzenders
    audio = update.message.voice or update.message.audio
    await update.message.reply_text("🎙️ Ontvangen, bezig met verwerken...")

    bestand = await context.bot.get_file(audio.file_id)
    with tempfile.TemporaryDirectory() as map_:
        pad = os.path.join(map_, "memo.ogg")
        await bestand.download_to_drive(pad)
        transcriptie = transcribeer(pad)

    onderwerp, samenvatting = vat_samen(transcriptie)
    mail(onderwerp, samenvatting, transcriptie)
    await update.message.reply_text(f"✅ Gemaild: {onderwerp}\n\n{samenvatting[:3500]}")


def main() -> None:
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, verwerk_spraak))
    app.run_polling()  # polling: geen open poorten nodig


if __name__ == "__main__":
    main()
