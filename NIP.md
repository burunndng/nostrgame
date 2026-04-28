# LUMINAE — Nostr Integration & Custom Kinds

## Overview

LUMINAE is a Nostr-native creature god game where each player's creature is deterministically generated from their npub. All game state, decrees, battles, dreams, and evolutions are published as Nostr events, making the game transparent, composable, and social by default.

## Custom Event Kinds

### Kind 30042 — Creature State (Addressable)

**Purpose**: Store and share the full state of a player's creature.

**Tags**:
| Tag | Value |
|---|---|
| `d` | Owner's npub (bech32) |
| `name` | Creature name |
| `archetype` | `lumis` / `umbra` / `vex` / `wraith` |
| `stage` | 1–5 (Wisp → Eternal) |
| `alignment` | -100 to +100 |
| `vitality` | 0–100 |
| `force` | 0–100 |
| `resonance` | 0–100 |
| `reflex` | 0–100 |
| `presence` | 0–100 |
| `bond` | 0–100 |
| `hunger` | 0–100 |
| `energy` | 0–100 |
| `happiness` | 0–100 |
| `health` | 0–100 |
| `stimulation` | 0–100 |
| `traits` | Comma-separated trait names |
| `wins` | Battle wins |
| `losses` | Battle losses |
| `hue` | Base hue (0–360) |
| `glow_intensity` | 0.0–1.0 |
| `alt` | Human-readable description (NIP-31) |

**Content**: JSON with name, archetype, stage, alignment, affinity, birthmark, wins, losses, lumens.

**Frequency**: Max 1 publish per 5 minutes to avoid relay spam.

---

### Kind 30043 — Battle Challenge & Result (Addressable)

**Purpose**: Challenge another player to a battle, or record a battle result.

**Tags**:
| Tag | Value |
|---|---|
| `d` | Challenger npub |
| `p` | Challengee npub |
| `battle_id` | Unique battle identifier |

**Content** (challenge): `{ from, to, battle_id, timestamp }`
**Content** (result): `{ winner, loser, battle_log, elo_change, rewards }`

**alt tag**: `LUMINAE battle challenge`

---

### Kind 30044 — God Decree History (Addressable)

**Purpose**: Record a player's divine decree choice, building alignment and personality history.

**Tags**:
| Tag | Value |
|---|---|
| `d` | Player npub |
| `scenario` | Decree scenario ID |
| `choice` | 0-indexed chosen option |
| `alignment_delta` | Alignment change from this choice |
| `alt` | Scenario summary (NIP-31) |

**Content**: `{ scenario, choice, alignment_delta, timestamp }`

---

### Kind 30045 — Evolution Announcement (Addressable)

**Purpose**: Broadcast when a creature evolves to a new stage. Published to followers as a social moment.

**Tags**:
| Tag | Value |
|---|---|
| `d` | Owner npub |
| `from` | Previous stage number |
| `to` | New stage number |
| `alt` | Celebration message (NIP-31) |

**Content**: `{ name, from, to, archetype, alignment, timestamp }`

---

### Kind 30046 — Dream Event (Regular)

**Purpose**: Procedurally generated dream text that appears while the creature sleeps. Creates passive social content.

**Tags**:
| Tag | Value |
|---|---|
| `d` | Owner npub |
| `dream` | `true` |
| `stage` | Current creature stage |
| `alt` | NIP-31 description |

**Content**: Free-form dream prose (string, not JSON).

---

## Standard Nostr Kinds Used

### Kind 0 (Profile Metadata)

Standard NIP-01 profile. Used for player identity.

### Kind 9735 (Zap Receipt)

Standard NIP-57 zaps. Used in LUMINAE for:
- **Feeding**: 1 sat = 10 Lumens
- **Battle Adrenaline**: Zaps during battle provide temporary stat boosts
- **Curing sickness**: 100 sats = full cure

---

## Tag Conventions

- All custom events include a NIP-31 `alt` tag with a human-readable description.
- All addressable events use the player's npub as the `d` tag.
- Alignment tags use numeric strings in the range -100 to 100.

---

## Relay Behavior

Creature state is published as a replaceable event (kind 30042), meaning only the latest version per npub is stored. Battle challenges, decrees, dreams, and evolution announcements create chronological records.

Players who follow many creatures get a living feed of creature life — a persistent social layer requiring no manual effort from owners.