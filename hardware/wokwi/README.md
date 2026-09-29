# PRISM kiosk I/O controller — Wokwi simulation (Level 1)

In the real PRISM kiosk, work is split between two boards:

```
[ Raspberry Pi 5 ]  ⇄ USB serial (JSON lines) ⇄  [ ESP32: kiosk I/O controller ]
  AI: speech-to-text, privacy redaction,           language buttons, hold-to-talk,
  retrieval, LLM answers, touchscreen UI           mic power cut-off, status ring,
                                                   status screen, presence sensor, buzzer
```

This folder simulates the **ESP32 side** in [Wokwi](https://wokwi.com). The Pi 5 side
(the AI) can't be simulated in Wokwi; it is demonstrated by the web prototype in `frontend/`.
With `SIMULATE_HOST = true` (the default), the ESP32 fakes the Pi's replies with timers,
so the simulation runs on its own and needs no internet.

## Run it

1. Open <https://wokwi.com/projects/new/esp32>.
2. Replace the contents of **sketch.ino** and **diagram.json** with the files in this folder.
3. In **Library Manager**, add `Adafruit SSD1306`, `Adafruit GFX Library` and `Adafruit NeoPixel`
   (or create a `libraries.txt` file with the contents of the one here).
4. Press ▶. The first build on the free plan can wait in a queue for a minute or two.
5. Sign in and **Save** to get a shareable link for the deck / QR code.

## What each part does

| Part (Wokwi) | Kiosk feature | Why it matters |
|---|---|---|
| 3 buttons + 3 LEDs | हिन्दी / English / తెలుగు language choice | Press a labelled button instead of navigating menus |
| Blue button (hold) | Hold-to-talk | The kiosk never listens by accident |
| Relay + red LED | **Mic power cut-off** | The mic is electrically off unless TALK is held — a hardware privacy guarantee |
| 16-LED ring | Status light | Readable without reading (colours below) |
| OLED 128×64 | Status screen | Current step, language, auto-clear countdown |
| HC-SR04 ultrasonic | **Presence sensor** | Walk up → wakes; walk away → countdown → session wiped. Any button press also counts as presence for 5 s, so a wheelchair user or child below the sensor's beam is never wiped mid-question |
| Red button + buzzer | Clear session | Manual wipe with sound + light confirmation |

**Ring colours:** tricolour rotating = welcome · blue breathing = ready · red pulse = listening
(mic powered) · amber comet = processing · green = answering · white sweep = session wiped ·
shrinking orange arc = "walked away" countdown.

**Keyboard shortcuts** (click the simulation canvas first): `1` हिन्दी · `2` English · `3` తెలుగు ·
hold `T` to talk · `C` clear.

## 40-second demo script

1. Start: ring off, OLED says *Walk up to begin*.
2. Click the ultrasonic sensor and drag the distance **below 80 cm** → wake chime, tricolour ring,
   *Namaste! Hello! Choose your language*.
3. Press **हिन्दी** → orange LED on, OLED *Namaste*, ring breathes blue.
4. **Hold TALK** → relay clicks, red MIC POWER LED on, ring pulses red, *Listening* bar fills.
5. **Release** → mic power cut instantly, amber ring, OLED ticks *Hiding personal info →
   Searching sources → Preparing answer*, then green ring *Answer ready · Source cited*.
6. Drag the distance **above 120 cm** (the user walks away) → once no button has been touched
   for 5 s, and after a 2 s grace period, a countdown appears,
   the ring shrinks, last 3 s beep → white sweep, *Session cleared · Nothing stored*, back to sleep.

Also worth showing: press **CLEAR** mid-session (manual wipe), and tap TALK briefly (under 0.4 s)
to see the accidental-press guard.

## States

```
SLEEP ──person < 80 cm (0.5 s)──▶ WELCOME ──language button──▶ READY
READY / ANSWERING ──hold TALK──▶ LISTENING (mic powered)
LISTENING ──release (≥ 0.4 s)──▶ PROCESSING ──▶ ANSWERING ──▶ READY
LISTENING ──release (< 0.4 s)──▶ READY ("Hold TALK while speaking")
ANY ──CLEAR, or (person > 120 cm and no button touched for 5 s) for 2 s + 8 s countdown──▶ CLEARING ──▶ SLEEP
```

Timings are shortened for the demo; tune them at the top of `sketch.ino`
(a real kiosk would use ~30 s before auto-clear).

## Pin map (ESP32 DevKitC V4)

Boot-strapping pins are avoided on inputs, so the same wiring works on a real board.

| Function | GPIO | Function | GPIO |
|---|---|---|---|
| OLED SDA / SCL | 21 / 22 | हिन्दी / English / తెలుగు buttons | 32 / 33 / 25 |
| LED ring data | 19 | हिन्दी / English / తెలుగు LEDs | 4 / 16 / 17 |
| Buzzer | 23 | TALK / CLEAR buttons | 26 / 27 |
| Ultrasonic TRIG / ECHO | 18 / 34 | Mic power relay | 5 |

## ESP32 ⇄ Pi protocol (JSON lines, 115200 baud)

Events the ESP32 sends (visible in Wokwi's serial monitor):

```json
{"evt":"boot","v":"prism-io-controller"}
{"evt":"presence","v":"arrived" | "away" | "returned"}
{"evt":"lang","v":"hi" | "en" | "te"}
{"evt":"talk","v":"start" | "stop" | "cancel"}
{"evt":"clear","v":"button" | "away" | "host"}
{"evt":"state","v":"sleep" | "welcome" | "ready" | "listening" | "processing" | "answering" | "clearing"}
```

Commands the Pi sends back (one per line): `answering`, `ready`, `clear`.
You can type these into the serial monitor to act as the Pi.

## Notes for the real build

- **HC-SR04 ECHO is 5 V** — use a voltage divider (e.g. 1 kΩ / 2 kΩ) into GPIO34.
- **Mic cut-off:** in hardware, replace the relay with a MOSFET / load switch on the
  I2S microphone's power line (e.g. INMP441), so the mic physically has no power unless TALK is held.
- Many relay modules are **active-low**; flip `setMicPower()` if yours is.
- The OLED shows romanised text (its built-in font is Latin-only). Hindi/Telugu script on the
  OLED is planned for Level 2 using small pre-drawn bitmaps.
