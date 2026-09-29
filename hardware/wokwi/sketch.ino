/*
  PRISM kiosk I/O controller — Wokwi simulation (Level 1)
  SIH 2026 · SIH26088 · Team larperss

  In the real kiosk, a Raspberry Pi 5 runs the AI (speech, privacy redaction,
  retrieval, answers) and this ESP32 handles everything the user touches:
  language buttons, hold-to-talk, the mic power cut-off, the status ring,
  the status screen, presence sensing and the session wipe.

  The two talk over USB serial using one JSON object per line (see README).
  With SIMULATE_HOST = true, the ESP32 fakes the Pi's replies with timers so
  the simulation runs on its own.
*/

#include <initializer_list>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>

// ---------- Pins ----------
const uint8_t PIN_BTN_HI = 32, PIN_BTN_EN = 33, PIN_BTN_TE = 25;
const uint8_t PIN_BTN_TALK = 26, PIN_BTN_CLEAR = 27;
const uint8_t PIN_LED_HI = 4, PIN_LED_EN = 16, PIN_LED_TE = 17;
const uint8_t PIN_MIC_POWER = 5;  // relay: mic is only powered while TALK is held
const uint8_t PIN_RING = 19, PIN_BUZZER = 23;
const uint8_t PIN_TRIG = 18, PIN_ECHO = 34;

// ---------- Tuning (short values for the demo; a real kiosk would use ~30 s) ----------
const int WAKE_CM = 80;                       // closer than this = someone is at the kiosk
const int LEAVE_CM = 120;                     // further than this = they walked away
const unsigned long AWAY_GRACE_MS = 2000;     // ignore brief gaps before counting down
const unsigned long AWAY_COUNTDOWN_MS = 8000; // visible countdown before auto-clear
const unsigned long TOUCH_PRESENCE_MS = 5000; // a button press counts as "someone is here" this long
                                              // (covers wheelchair users / children below the sensor)
const unsigned long MIN_TALK_MS = 400;        // shorter presses are treated as accidental
const unsigned long MAX_TALK_MS = 15000;      // mic cuts off automatically after this
const unsigned long PROCESSING_MS = 3000;     // simulated Pi processing time
const unsigned long ANSWERING_MS = 4500;      // simulated answer playback time
const unsigned long CLEARING_MS = 2500;
const bool SIMULATE_HOST = true;

// ---------- Hardware objects ----------
const int RING_PIXELS = 16;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_NeoPixel ring(RING_PIXELS, PIN_RING, NEO_GRB + NEO_KHZ800);

// ---------- Languages (Hindi first) ----------
enum Lang { LANG_NONE = -1, LANG_HI = 0, LANG_EN = 1, LANG_TE = 2 };
const char *LANG_CODE[] = {"hi", "en", "te"};
const char *LANG_TAG[] = {"HI", "EN", "TE"};
const char *LANG_NAME[] = {"Hindi", "English", "Telugu"};
const char *GREETING[] = {"Namaste", "Hello", "Namaskaram"};
const uint8_t LANG_LED[] = {PIN_LED_HI, PIN_LED_EN, PIN_LED_TE};

// ---------- State machine ----------
enum State { SLEEP, WELCOME, READY, LISTENING, PROCESSING, ANSWERING, CLEARING };
const char *STATE_NAME[] = {"sleep", "welcome", "ready", "listening", "processing", "answering", "clearing"};

State state = SLEEP;
unsigned long stateAt = 0;
int lang = LANG_NONE;
int distanceCm = 400;
unsigned long nearSince = 0, awaySince = 0;
unsigned long lastTouch = 0;  // last time any button was pressed or held
unsigned long hintUntil = 0;  // "hold the button" hint after a too-short press
const char *hintText = "";
bool clearedByButton = false;

// A buzzer note. Declared up here (before any function) because the Arduino
// builder inserts auto-generated prototypes above the first function.
struct Note { uint16_t freq, ms; };

// ---------- Buttons (debounced, active LOW) ----------
struct Button {
  uint8_t pin;
  bool stable = false, raw = false;
  unsigned long changedAt = 0;
  bool pressed = false, released = false;  // one-loop events
};
Button btnHi{PIN_BTN_HI}, btnEn{PIN_BTN_EN}, btnTe{PIN_BTN_TE}, btnTalk{PIN_BTN_TALK}, btnClear{PIN_BTN_CLEAR};
Button *buttons[] = {&btnHi, &btnEn, &btnTe, &btnTalk, &btnClear};

void updateButton(Button &b, unsigned long now) {
  bool r = digitalRead(b.pin) == LOW;
  b.pressed = b.released = false;
  if (r != b.raw) {
    b.raw = r;
    b.changedAt = now;
  }
  if (now - b.changedAt > 25 && r != b.stable) {
    b.stable = r;
    (r ? b.pressed : b.released) = true;
  }
}

// ---------- Non-blocking sound ----------
Note melody[8];
uint8_t melodyLen = 0, melodyPos = 0;
unsigned long noteEndsAt = 0;

void play(std::initializer_list<Note> notes) {
  melodyLen = melodyPos = 0;
  for (const Note &n : notes)
    if (melodyLen < 8) melody[melodyLen++] = n;
  noteEndsAt = 0;
}

void updateSound(unsigned long now) {
  if (melodyPos >= melodyLen || now < noteEndsAt) return;
  const Note &n = melody[melodyPos++];
  if (n.freq) tone(PIN_BUZZER, n.freq, n.ms);
  noteEndsAt = now + n.ms + 15;
}

// ---------- Host (Raspberry Pi) link: JSON lines over serial ----------
void sendEvent(const char *evt, const char *value) {
  Serial.printf("{\"evt\":\"%s\",\"v\":\"%s\"}\n", evt, value);
}

// ---------- Helpers ----------
void setMicPower(bool on) { digitalWrite(PIN_MIC_POWER, on ? HIGH : LOW); }

void showLang() {
  for (int i = 0; i < 3; i++) digitalWrite(LANG_LED[i], i == lang ? HIGH : LOW);
}

void enter(State s, unsigned long now) {
  state = s;
  stateAt = now;
  if (s != LISTENING) setMicPower(false);  // mic is never left powered outside LISTENING
  sendEvent("state", STATE_NAME[s]);
}

int readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, 30000UL);
  return us ? us / 58 : 999;
}

void startSession(unsigned long now) {
  lang = LANG_NONE;
  showLang();
  awaySince = 0;
  sendEvent("presence", "arrived");
  play({{523, 90}, {659, 90}, {784, 160}});
  enter(WELCOME, now);
}

void clearSession(const char *reason, unsigned long now) {
  setMicPower(false);
  lang = LANG_NONE;
  showLang();
  awaySince = 0;
  clearedByButton = strcmp(reason, "button") == 0;
  sendEvent("clear", reason);
  play({{1568, 80}, {0, 40}, {1175, 80}, {0, 40}, {784, 160}});
  enter(CLEARING, now);
}

void selectLang(int l, unsigned long now) {
  if (state == SLEEP) startSession(now);
  lang = l;
  showLang();
  sendEvent("lang", LANG_CODE[l]);
  play({{1200, 60}});
  if (state == WELCOME) enter(READY, now);
}

// ---------- Presence (ultrasonic) ----------
void updatePresence(unsigned long now) {
  static unsigned long lastRead = 0;
  if (now - lastRead < 100) return;
  lastRead = now;
  distanceCm = readDistanceCm();

  if (state == SLEEP) {
    if (distanceCm < WAKE_CM) {
      if (!nearSince) nearSince = now;
      if (now - nearSince > 500) startSession(now);
    } else {
      nearSince = 0;
    }
    return;
  }
  if (state == CLEARING) return;

  bool touchedRecently = now - lastTouch < TOUCH_PRESENCE_MS;
  if (distanceCm > LEAVE_CM && !touchedRecently) {
    if (!awaySince) {
      awaySince = now;
      sendEvent("presence", "away");
    }
    if (now - awaySince >= AWAY_GRACE_MS + AWAY_COUNTDOWN_MS) clearSession("away", now);
  } else if (awaySince) {
    awaySince = 0;
    sendEvent("presence", "returned");
  }
}

// Seconds left before auto-clear, or -1 when no countdown is showing.
int countdownSecondsLeft(unsigned long now) {
  if (!awaySince || state == SLEEP || state == CLEARING) return -1;
  unsigned long gone = now - awaySince;
  if (gone < AWAY_GRACE_MS) return -1;
  if (gone >= AWAY_GRACE_MS + AWAY_COUNTDOWN_MS) return 0;  // clear fires on the next sensor read
  unsigned long left = AWAY_GRACE_MS + AWAY_COUNTDOWN_MS - gone;
  return (left + 999) / 1000;
}

// ---------- Main logic ----------
void updateLogic(unsigned long now) {
  // Clear works from any active state.
  if (btnClear.pressed && state != SLEEP && state != CLEARING) {
    clearSession("button", now);
    return;
  }

  // Language can be picked or changed whenever the mic is not live.
  if (state != LISTENING && state != CLEARING) {
    if (btnHi.pressed) selectLang(LANG_HI, now);
    if (btnEn.pressed) selectLang(LANG_EN, now);
    if (btnTe.pressed) selectLang(LANG_TE, now);
  }

  switch (state) {
    case WELCOME:
      if (btnTalk.pressed) {
        hintText = "Choose language first";
        hintUntil = now + 1800;
        play({{300, 150}});
      }
      break;

    case READY:
    case ANSWERING:  // pressing TALK interrupts the answer
      if (btnTalk.pressed) {
        setMicPower(true);
        sendEvent("talk", "start");
        play({{880, 50}});
        enter(LISTENING, now);
      } else if (state == ANSWERING && SIMULATE_HOST && now - stateAt > ANSWERING_MS) {
        enter(READY, now);
      }
      break;

    case LISTENING: {
      unsigned long held = now - stateAt;
      if (btnTalk.released || held > MAX_TALK_MS) {
        setMicPower(false);
        play({{660, 50}});
        if (held < MIN_TALK_MS) {
          sendEvent("talk", "cancel");
          hintText = "Hold TALK while speaking";
          hintUntil = now + 1800;
          enter(READY, now);
        } else {
          sendEvent("talk", "stop");
          enter(PROCESSING, now);
        }
      }
      break;
    }

    case PROCESSING:
      if (SIMULATE_HOST && now - stateAt > PROCESSING_MS) {
        play({{784, 90}, {1047, 140}});
        enter(ANSWERING, now);
      }
      break;

    case CLEARING:
      if (now - stateAt > CLEARING_MS) {
        // Someone still standing there after pressing Clear gets a fresh session.
        if (clearedByButton && distanceCm < LEAVE_CM) startSession(now);
        else enter(SLEEP, now);
      }
      break;

    default:
      break;
  }

  // Countdown ticks for the last 3 seconds before auto-clear.
  static int lastLeft = -1;
  int left = countdownSecondsLeft(now);
  if (left != lastLeft && left > 0 && left <= 3) play({{1000, 40}});
  lastLeft = left;
}

// Commands from the Pi (only needed when SIMULATE_HOST is false, but always accepted).
void updateSerial(unsigned long now) {
  static String line;
  while (Serial.available()) {
    char c = Serial.read();
    if (c != '\n') {
      if (line.length() < 64) line += c;
      continue;
    }
    line.trim();
    if (line == "answering" && state == PROCESSING) enter(ANSWERING, now);
    else if (line == "ready" && (state == PROCESSING || state == ANSWERING)) enter(READY, now);
    else if (line == "clear" && state != SLEEP && state != CLEARING) clearSession("host", now);
    line = "";
  }
}

// ---------- Status ring ----------
uint32_t scaled(uint8_t r, uint8_t g, uint8_t b, float k) {
  return ring.Color(r * k, g * k, b * k);
}

void updateRing(unsigned long now) {
  static unsigned long last = 0;
  if (now - last < 30) return;
  last = now;
  unsigned long t = now - stateAt;
  ring.clear();

  int left = countdownSecondsLeft(now);
  if (left > 0) {
    // Remaining time shown as a shrinking red-orange arc.
    unsigned long gone = now - awaySince - AWAY_GRACE_MS;
    int lit = RING_PIXELS - (int)(RING_PIXELS * gone / AWAY_COUNTDOWN_MS);
    for (int i = 0; i < lit; i++) ring.setPixelColor(i, ring.Color(255, 60, 0));
    ring.show();
    return;
  }

  switch (state) {
    case SLEEP:  // brief dim heartbeat every 3 s
      if (now % 3000 < 120) ring.setPixelColor(0, ring.Color(0, 0, 40));
      break;
    case WELCOME: {  // slowly rotating saffron / white / green
      int offset = (now / 120) % RING_PIXELS;
      for (int i = 0; i < RING_PIXELS; i++) {
        int band = ((i + offset) % RING_PIXELS) * 3 / RING_PIXELS;
        uint32_t c = band == 0 ? ring.Color(255, 110, 0) : band == 1 ? ring.Color(170, 170, 170) : ring.Color(0, 160, 20);
        ring.setPixelColor(i, c);
      }
      break;
    }
    case READY: {  // blue breathing
      float k = 0.15 + 0.6 * (0.5 + 0.5 * sin(now / 600.0));
      ring.fill(scaled(0, 70, 255, k));
      break;
    }
    case LISTENING: {  // fast red pulse
      float k = 0.35 + 0.65 * (0.5 + 0.5 * sin(now / 140.0));
      ring.fill(scaled(255, 0, 0, k));
      break;
    }
    case PROCESSING: {  // amber comet
      int head = (now / 60) % RING_PIXELS;
      for (int j = 0; j < 6; j++)
        ring.setPixelColor((head - j + RING_PIXELS) % RING_PIXELS, scaled(255, 140, 0, 1.0 - j / 6.0));
      break;
    }
    case ANSWERING: {  // green, gentle pulse
      float k = 0.55 + 0.45 * (0.5 + 0.5 * sin(now / 400.0));
      ring.fill(scaled(0, 220, 60, k));
      break;
    }
    case CLEARING: {  // white wipe fills, then fades out
      if (t < 1000) {
        int n = t * RING_PIXELS / 1000 + 1;
        for (int i = 0; i < n && i < RING_PIXELS; i++) ring.setPixelColor(i, ring.Color(220, 220, 220));
      } else {
        float k = t < CLEARING_MS ? 1.0 - (float)(t - 1000) / (CLEARING_MS - 1000) : 0;
        ring.fill(scaled(220, 220, 220, k));
      }
      break;
    }
  }
  ring.show();
}

// ---------- Status screen ----------
void centered(const char *s, int y, int size = 1) {
  int16_t x1, y1;
  uint16_t w, h;
  display.setTextSize(size);
  display.getTextBounds(s, 0, y, &x1, &y1, &w, &h);
  display.setCursor((128 - w) / 2, y);
  display.print(s);
}

void header(bool micOn) {
  display.fillRect(0, 0, 128, 11, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(2, 2);
  display.print("PRISM");
  if (micOn) {
    display.setCursor(50, 2);
    display.print("* MIC *");
  }
  if (lang != LANG_NONE) {
    display.setCursor(114, 2);
    display.print(LANG_TAG[lang]);
  }
  display.setTextColor(SSD1306_WHITE);
}

void updateScreen(unsigned long now) {
  static unsigned long last = 0;
  if (now - last < 100) return;
  last = now;
  unsigned long t = now - stateAt;
  const char TICK = (char)251;  // CP437 check mark
  char buf[32];

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  int left = countdownSecondsLeft(now);
  if (left > 0) {
    header(false);
    centered("Are you still there?", 15);
    snprintf(buf, sizeof buf, "%d", left);
    centered(buf, 27, 3);
    centered("Clearing session...", 55);
    display.display();
    return;
  }

  switch (state) {
    case SLEEP:
      centered("PRISM", 8, 2);
      centered("Walk up to begin", 32);
      snprintf(buf, sizeof buf, "sensor: %d cm", distanceCm > 400 ? 400 : distanceCm);
      centered(buf, 52);
      break;

    case WELCOME:
      header(false);
      centered("Namaste! Hello!", 15);
      if (now < hintUntil) centered(hintText, 28);
      else centered("Choose your language", 28);
      display.setCursor(4, 42);
      display.print("[1] Hindi [2] English");
      display.setCursor(4, 53);
      display.print("[3] Telugu");
      break;

    case READY:
      header(false);
      centered(GREETING[lang], 15, 2);
      centered(now < hintUntil ? hintText : "Hold TALK to ask", 38);
      centered("mic: OFF (power cut)", 53);
      break;

    case LISTENING: {
      header(true);
      centered("Listening", 15, 2);
      int w = min(124UL, t * 124 / MAX_TALK_MS);
      display.drawRect(2, 36, 124, 8, SSD1306_WHITE);
      display.fillRect(2, 36, w, 8, SSD1306_WHITE);
      centered("Release TALK to send", 53);
      break;
    }

    case PROCESSING: {
      header(false);
      const char *steps[] = {"Hiding personal info", "Searching sources", "Preparing answer"};
      for (int i = 0; i < 3; i++) {
        unsigned long stepEnd = (i + 1) * PROCESSING_MS / 3;
        display.setCursor(2, 16 + i * 12);
        display.print(t >= stepEnd ? TICK : (t >= stepEnd - PROCESSING_MS / 3 ? '>' : ' '));
        display.print(' ');
        display.print(steps[i]);
      }
      centered("mic: OFF (power cut)", 53);
      break;
    }

    case ANSWERING:
      header(false);
      centered("Answer ready", 15, 1);
      centered("Speaking in", 29);
      centered(LANG_NAME[lang], 40);
      snprintf(buf, sizeof buf, "%c Source cited", TICK);
      centered(buf, 53);
      break;

    case CLEARING: {
      centered("Session cleared", 2);
      display.drawFastHLine(0, 12, 128, SSD1306_WHITE);
      const char *items[] = {"Conversation", "Voice input", "Language choice"};
      for (int i = 0; i < 3; i++) {
        if (t < 300 + i * 400UL) break;
        display.setCursor(10, 17 + i * 11);
        display.print(TICK);
        display.print(' ');
        display.print(items[i]);
      }
      if (t > 1600) centered("Nothing stored.", 55);
      break;
    }
  }
  display.display();
}

// ---------- Setup / loop ----------
void setup() {
  Serial.begin(115200);
  for (Button *b : buttons) pinMode(b->pin, INPUT_PULLUP);
  for (uint8_t p : LANG_LED) pinMode(p, OUTPUT);
  pinMode(PIN_MIC_POWER, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  setMicPower(false);
  showLang();

  ring.begin();
  ring.show();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) Serial.println("{\"evt\":\"error\",\"v\":\"oled\"}");
  display.cp437(true);

  sendEvent("boot", "prism-io-controller");
  enter(SLEEP, millis());
}

void loop() {
  unsigned long now = millis();
  for (Button *b : buttons) {
    updateButton(*b, now);
    if (b->stable) lastTouch = now;
  }
  updatePresence(now);
  updateSerial(now);
  updateLogic(now);
  updateSound(now);
  updateRing(now);
  updateScreen(now);
}
