# BahAlert: Pitch guide

Ideas for the pitch itself, plus the non-technical questions judges ask: impact, users, cost, competition and
sustainability. For technical questions (architecture, flood logic, security, tests), use
[pitch-qa.md](pitch-qa.md).

⚠ marks a weak spot. Admit it plainly and say what you will do about it.

---

## 1. Pitch structure (about 5 minutes)

| Time | Section | Who | What to say or show |
|---|---|---|---|
| 0:00–0:40 | Hook | Aifa | One of the openings in section 2. |
| 0:40–1:20 | Problem | Aifa | Official gauges are far apart, so people find out when the water is already at the door. 15–30 minutes of warning is enough to move belongings and leave. |
| 1:20–2:00 | Solution | Christian | One sentence: *a sensor over the creek, an alarm on the street, and a text on your phone.* Then the three layers: siren and LED board on site, SMS and Telegram, and the live map with a safe route. |
| 2:00–3:30 | Live demo | Isaac (drives), Aifa (talks) | See section 3. |
| 3:30–4:15 | Cost and rollout | Christian | ~₱60,590 for one complete system, ₱35,000–45,000 in batches. Paid for from the barangay or city DRRM fund. Barangay pilot first. |
| 4:15–4:45 | Team and next steps | Edzel | Who built what. Next: radar firmware, Filipino language, a field pilot. |
| 4:45–5:00 | Close | Aifa | Repeat the tagline: **"Minutes matter. We give communities those minutes."** |

Rules of thumb:

- Speak about families, not features. Say "your lola gets a text", not "the service sends an SMS".
- One number per slide. Judges remember ₱60,590, 300 m and 15 minutes, not a whole table.
- Keep the 4G, LoRa and Firebase details for the Q&A unless a judge is technical.

## 2. Opening hooks (pick one)

1. **Real event.** "On 3 October 2026 in Rosario, Batangas, a jeepney with 14 people was swept away crossing a
   flooded spillway. Two people died. The water rose upstream before it reached that road. What if someone
   upstream had been watching?"
2. **Audience question.** "Raise your hand if you've ever found out about a flood because the water was already
   inside your house." Pause. "Our system is built so that never has to happen again."
3. **Countdown.** Start a 15-minute timer on the screen. "This is how much warning BahAlert aims to give a family.
   Fifteen minutes to save documents, lift appliances and walk to an evacuation center."

Hook 1 is the strongest because it is local, recent and true. Keep the source ready: Daily Tribune, 4 October 2026.

## 3. Demo script (90 seconds)

Before you go on stage: start the simulator (`npm run simulate`, or the GitHub Action), and keep the resident
alert service running if you show a text. In Chrome DevTools → Sensors, preset a location inside a sensor's danger
circle. Have a phone ready to receive the SMS.

1. **Map** (15 s): "Every dot is a sensor at a Batangas City evacuation-center area. Green is safe."
2. **A sensor turns red** (20 s): "The water at this sensor just crossed the danger line. A 300-metre danger zone
   appears around it." Open the sensor page: "Here's the rise rate and how many minutes until it overflows."
3. **Am I in danger?** (20 s): Turn on the spoofed location. "I'm a resident inside the zone. The site warns me."
4. **Safe route** (20 s): "It finds the nearest open evacuation center and a route that goes *around* the flood,
   never through it."
5. **The text** (15 s): Hold up the phone with the SMS. "And if I'm not looking at the website at all, this text
   arrives anyway."

If anything fails, don't debug on stage. Say "here's what you would see", and show a screenshot you saved earlier.
Keep screenshots of every step in a folder.

If you bring the prototype board: pour water into a container under the ultrasonic sensor so the alarm board beeps
and the LCD changes level. Make clear it is the **test prototype**, and that the production unit uses radar.

## 4. Numbers to memorize

| What | Number |
|---|---|
| One complete system (sensor + announcer) | ~₱60,590 (₱20,990 + ₱39,600) |
| In batches of 50–100 | sensor ₱13,000–16,000, announcer ₱22,000–29,000 |
| Exchange rate used | ₱63.85 per $1 (BSP, 23 Nov 2026) |
| Danger zone radius | 300 m (adjustable per sensor) |
| "Approaching" warning | a further 200 m |
| Sensor counts as offline after | 60 seconds without a reading |
| Status change needs | 5 of the last 7 measurements to agree (about 3 seconds) |
| Same alert repeated at most | once every 15 minutes per level, per sensor |
| SMS length | always one 160-character message |
| Siren | 110 dB |
| Batteries | 12 Ah (sensor), 50 Ah (announcer), LiFePO4, solar-charged |
| Software running cost | free tiers (Firebase, Mapbox, GitHub Pages); you pay SIM load |

---

## 5. Judge Q&A

### Problem and impact

1. **Why does this matter? Don't people already get typhoon warnings?**
   Typhoon warnings cover a whole province and come hours or days early. They don't say *when your creek* will
   overflow. Flash floods and river overflows rise in minutes, and official gauges are far apart. BahAlert
   watches the specific creek near your street.

2. **How many lives or how much property can this save?**
   Don't invent a figure. Say: "Even 15 to 30 minutes of warning lets a family move valuables and leave before the
   road floods. Rosario showed what happens with zero minutes." If you have local flood data, such as how many
   households were affected in the last typhoon, quote it here.

3. **Who exactly are your users?**
   Two groups. Residents near creeks get the alarm, texts and the map, with no login and no app to install.
   Barangay and city DRRM officers use the admin page to manage sensors, evacuation centers, hotlines and alerts.

4. **What about people with no smartphone or no load?**
   That's why there are three layers. The **siren and LED board** work for everyone on the street, with no phone at
   all. **SMS** works on any basic phone and costs the resident nothing. The **website** is the extra layer for
   people who want the map and route.

### Competition

5. **How is this different from PAGASA, Project NOAH or Waze?**
   They are national or regional and forecast from rainfall and big rivers. We measure the actual water in a small
   creek and warn the people living right beside it: siren on the street, text to their phone, and a route to the
   nearest evacuation center that avoids the flood. We complement them; we don't replace them.

6. **Doesn't DOST or the LGU already have water level sensors?**
   Some rivers have official stations, but they are expensive and few, so most small creeks have none. Our unit is
   cheap enough to put on many creeks, and it adds what a measuring station alone lacks: the local siren and the
   texts to residents. ⚠ Before the pitch, look up whether Batangas City has official stations and where they are.

7. **What's your unfair advantage?**
   We're local: we chose the evacuation centers, verified the hotlines and plan to place sensors on Batangas City
   streets ourselves. It's also low-cost, open and works end to end: sensor → siren → text → map → safe route.

### Cost and business model

8. **Who pays for it?**
   The barangay or city, from its disaster risk reduction fund. Under RA 10121, LGUs set aside at least 5% of
   their regular revenue for disaster risk reduction, and most of it is for preparedness, which includes early
   warning systems. ⚠ Double-check the exact rules before quoting them.

9. **₱60,590 sounds expensive for a barangay.**
   It's one complete system, sensor plus announcer, at single-unit online prices. In batches of 50–100 it falls to
   roughly ₱35,000–45,000. One announcer can serve a whole street or sitio, and one sensor can drive several
   announcers. Compare it with the cost of one flooded house, or one rescue operation.
   Tip: work out the cost per household. Divide ₱60,590 by the number of households near one creek. Do it for a
   real barangay before the pitch.

10. **What are the running costs?**
    Software runs on free tiers. Recurring costs are SIM load for the texts and 4G data, plus replacing a battery
    every few years. Solar panels charge the units, so there's no electric bill.

11. **Could this become a business?**
    Possible models: sell or lease units to LGUs with a yearly maintenance contract, or partner with a local
    electronics assembler to produce units in Batangas. For a bootcamp, say the first goal is a free barangay pilot
    to prove it works.

### Feasibility and rollout

12. **Is this real or just a mockup?**
    Both parts are real. The website is live and works now (https://j-isaac007.github.io/BahAlert). The prototype
    board measures water with an ultrasonic sensor, sounds an alarm and feeds the live site. ⚠ The production radar
    unit, LoRa link and announcer firmware are designed and costed but not built yet. Say that plainly.

13. **Why is the prototype ultrasonic but the pitch says radar?**
    Ultrasonic is cheap for testing the software. Outdoors, sound is affected by heat, wind and rain, so the
    production unit uses a 24 GHz radar sensor. It sends the same data, so the website doesn't change.

14. **How would you roll this out?**
    Step 1: one barangay pilot, with one sensor and one announcer on the creek that floods most. Step 2: compare the
    readings with a ruler and with residents' reports for one rainy season. Step 3: expand to more creeks in
    Batangas City, then offer it to other LGUs. Adding a sensor needs no code change.

15. **Where would you put the first sensor?**
    On a creek or river crossing that floods often and has homes nearby. Ask the barangay DRRM officer. Panels like
    hearing that you'll ask the people who know.

16. **What if the sensor is stolen or vandalized?**
    Mount it high, under a bridge or on a tall post, in a locked IP65 box. If it stops sending, the site shows it
    as offline within 60 seconds with "Do not assume it is safe", so admins know straight away.

17. **What happens during a power outage or when the cell network is down?**
    Each unit has its own solar panel and battery. The sensor talks to the siren over LoRa radio, which needs no
    cell signal or internet, so the local siren still works.

### Trust and safety

18. **What if it gives a false alarm? People will stop trusting it.**
    The status only changes when 5 of the last 7 measurements agree, so a splash or a leaf doesn't trigger it.
    Residents get at most one message per level every 15 minutes, and a "safe again" message when it clears.
    Admins can pause alerts instantly.

19. **What if it misses a real flood?**
    A silent sensor is shown as offline, never as safe. Our texts tell people to watch for official LGU
    announcements too. ⚠ Field testing over a rainy season is how we'd prove reliability.

20. **Could someone send fake alerts?**
    No. Only the sensor's own account can write readings, and only admins can change settings. There's no public
    admin sign-up. (Details in pitch-qa.md, question 19.)

21. **What about privacy?**
    Your location never leaves your phone. Phone numbers are confirmed with a code, visible only to the resident
    and admins (masked), and residents can delete their account at any time.

### Team and process

22. **Why did you choose this problem?**
    Answer personally. Has a team member's family been flooded? A short true story beats any statistic.

23. **What was the hardest part?**
    Pick one and tell it as a story. For example: routing around a flood when the only bridge is inside the danger
    zone, or keeping the sensor's "last seen" time correct when the board's clock drifts.

24. **What would you do with funding or another 3 months?**
    Build and field-test the radar and announcer units, add Filipino and Batangueño text, draw danger zones from
    barangay hazard maps instead of circles, and run a pilot with one barangay.

25. **What did you learn?**
    Hardware and software have to agree on one written data format. And it's the people near the creek who decide
    whether a warning system works, not the technology.

---

## 6. Curveballs

| Question | How to handle it |
|---|---|
| "This already exists." | "Which one? We'd love to compare." Then explain what's different: local, low-cost, siren plus text plus safe route. |
| "Why not just use a group chat?" | Someone has to be awake and watching the creek. The sensor watches 24/7, and the siren reaches people who aren't in the chat. |
| "Your cost estimate is from US websites." | "Yes, converted at the BSP rate. Next step is quotes from local suppliers." Bring one local quote if you can. |
| "What if the barangay doesn't maintain it?" | The admin page is built for non-programmers, and a dead unit shows offline immediately. Propose a maintenance agreement in the pilot. |
| A question nobody knows | "We haven't tested that yet. Here's how we would." Never guess numbers. |

## 7. Before pitch day

- [ ] Fix the slide numbers so they match section 4.
- [ ] Rehearse the demo three times with the simulator running. Save screenshots of every step as a backup.
- [ ] Charge the phone that receives the demo SMS and load its SIM.
- [ ] Verify the barangay hall number on the Hotlines page.
- [ ] Get one local supplier quote and one real household count for a barangay.
- [ ] Look up official water level stations in Batangas City (question 6).
- [ ] Each person knows which questions they answer: Isaac on software, Luan on hardware, Aifa and Christian on
      impact and cost, Edzel on team and plans.
- [ ] Update [pitch-qa.md](pitch-qa.md) where it's out of date: question 5 describes only the production design (the
      demo prototype goes through the team's backend on Render), question 35 says there's no server to maintain
      (the alert service and backend must keep running), and question 28 doesn't list the routing, phone number and
      alert service tests.
