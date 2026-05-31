# ChantTracker Backend — Integration Report

## What existed before this session

| Repo | Stack | Status |
|---|---|---|
| `chanttracker-backend` | FastAPI + SQLAlchemy + Alembic · Phase 1 (auth only) | ✅ Archived |
| `chanttracker-app/backend` | FastAPI + PostgreSQL + Redis + Kafka + ClickHouse · Phase 6 | ✅ Source of truth |
| This session's backend | Supabase (Postgres + Auth + RLS + Triggers) | ✅ Live (Mumbai) |

---

## Feature gap matrix

| Feature | GitHub (`chanttracker-app`) | This session | Resolution |
|---|---|---|---|
| **Auth** | JWT (python-jose) + bcrypt + argon2 + refresh tokens | Supabase Auth | **Supabase wins** — managed, handles email/OAuth/magic link, no code |
| **User model** | email, phone, display_name, preferred_language (te/hi/en/sa), timezone, daily_goal, is_active, is_verified | email, full_name, theme, haptics, reminder_time | **Merged** — migration 11 adds phone, preferred_language, timezone, is_active, is_verified, daily_goal |
| **Mantra catalog** | 37 mantras: 9 graha + 9 adhidevata + 9 pratyadhidevata + 10 devata. Multilingual (en/te/sa). IAST. Category + type hierarchy. Weekday tags. Audio URL. | 6 mantras, devanagari + transliteration only | **GitHub wins** — migration 12+19 adds full taxonomy + 37 seeds |
| **Session lifecycle** | start → increment(N) → complete/abandon. Status enum. | Single insert on End Session | **Merged** — migration 15 adds session_status, start/complete/abandon pattern |
| **Sankalpa** | Per-mantra per-date. target_count + achieved_count + status (active/completed/missed). Intention text. | Purpose enum + is_active flag only | **GitHub wins** — migration 13 redesigns fully |
| **Anushthana** | Multi-day vow with daily target, strict mode (break detection), progress table | Not present | **GitHub wins** — migration 14 adds both tables + RPC |
| **Session → Sankalpa rollup** | Auto-increments sankalpa.achieved_count on complete | Not present | **Merged** — migration 16 adds trigger |
| **Anushthana break detection** | Strict mode: missed day → status=broken | Not present | **Merged** — migration 16 trigger |
| **Panchang** | Synodic approximation (Phase 3) + pyswisseph drik-siddha (Phase 5). Tithi, nakshatra, paksha, weekday lord, mantra recommendations | Not present | **GitHub wins** — migration 17 ports the Phase 3 synodic RPC exactly |
| **Dashboard** | today_count, sessions, week, all-time, streak, weekly_chart, top_mantras, active_anushthanas | today progress + streak | **Merged** — demo_progress RPC now includes all fields + panchang |
| **Anti-fraud** | 12 inc/sec, max delta 108 per call | Not present | **GitHub wins** — migration 18 adds rate-limit trigger + count constraint |
| **RLS** | Not present (FastAPI owns auth) | Every table | **This session wins** — preserved |
| **Achievements/badges** | Not present | 8 badges, auto-unlocked by trigger | **This session wins** — preserved |
| **Goals table** | daily_goal on user model only | daily/monthly/yearly per period | **This session wins** — preserved (more granular) |
| **Streak trigger** | Python service | DB trigger (auto-recomputes on session insert) | **This session wins** — preserved |
| **Profile settings** | Not present | theme, haptics, chant_sound, reminder_time | **This session wins** — preserved |
| **Cloudflare edge** | Not present | KV (catalog cache) + R2 (audio) + D1 (community counter) + Worker | **This session wins** — preserved |
| **Kafka events** | Fire-and-forget Kafka producer | Not present | **GitHub has it** — use Supabase Realtime as the equivalent (webhooks/broadcast) |
| **ClickHouse analytics** | Optional analytics DB | D1 community counter | **Partial** — D1 handles community aggregates; ClickHouse not ported (overkill at this scale) |
| **Redis caching** | Optional Redis layer | Cloudflare KV edge cache | **Equivalent** — KV replaces Redis for catalog caching at lower latency |
| **AI voice (Wav2Vec2)** | Client-side DSP + server-side Wav2Vec2 quality scoring | voice_accuracy column | **GitHub wins** — AI inference layer goes in a Supabase Edge Function or Cloudflare Worker |

---

## Integrated schema (post-migration)

```
profiles           — Supabase auth.users + phone, preferred_language, timezone,
                     daily_goal, is_active, is_verified, theme, haptics, reminder_time
mantras            — 41 rows: 10 graha + 9 adhidevata + 9 pratyadhidevata + 13 devata
                     slug, name_en/te/sa, iast, category, mantra_type, parent_graha_id,
                     weekday_tags[], audio_url, accent_color, default_target
grahas             — 9 navagraha reference (bija_mantra, color, orbit_order)
chant_sessions     — session_status (active/completed/abandoned), count, target,
                     duration_seconds, japas_per_min, voice_accuracy,
                     sankalpa_id (FK), anushthana_id (FK)
sankalpas          — for_date, target_count, achieved_count, sankalpa_status,
                     intention_text, purpose (enum), mantra_id (FK)
anushthanas        — title, intention, daily_target_count, total_days, start_date,
                     end_date, strict_mode, anushthana_status
anushthana_progress — one row per completed day (anushthana_id, for_date, achieved_count)
goals              — daily/weekly/monthly/yearly target_japas per user
streaks            — current_streak, longest_streak, last_chant_date (auto by trigger)
achievements       — 8 badge definitions (metric + threshold)
user_achievements  — auto-unlocked by trigger on session insert
```

## RPCs & views

| Name | Description | Auth |
|---|---|---|
| `get_today_progress()` | Dashboard ring: done/target/pct | authenticated |
| `panchang(date,lat,lon)` | Vedic almanac: tithi, nakshatra, paksha, recommendations | public |
| `mantras_for_weekday(dow)` | Today's recommended mantras | public |
| `mark_anushthana_day(uid,id,count)` | Mark day complete, detect break/completion | authenticated |
| `demo_progress()` | Full dashboard + panchang for demo profile | anon |
| `demo_log(count,mantra)` | Log chant for demo + return updated progress | anon |
| `demo_history(limit)` | Today's session list for demo | anon |
| `v_daily_totals` | Per-day rollup (history screen) | via RLS |
| `v_user_stats` | Lifetime: total, avg daily, best day, time | via RLS |
| `v_top_mantra` | Most-chanted mantra per user | via RLS |
| `v_weekly_chart` | Last 7 days daily totals (stats sparkline) | via RLS |

## What's left for Phase 5/6

- **pyswisseph drik-siddha Panchang** — Supabase Edge Function (Deno runtime supports npm)
- **Wav2Vec2 AI voice** — Cloudflare Worker receives audio from R2, scores quality, writes voice_accuracy back to session
- **Kafka → Supabase Realtime** — Replace Kafka publish with `supabase.channel().send()` for real-time yajna fan-out
- **Audio generation** — AI4Bharat Indic-TTS as a Cloudflare Worker job, storing to R2, updating mantras.audio_url
- **ClickHouse** — Skip (Cloudflare D1 covers community aggregates; personal analytics live in Supabase)
