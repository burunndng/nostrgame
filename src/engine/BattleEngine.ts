import type { BattleState, BattleParticipant, BattleLogEntry, BattleMove } from '@/systems/types';
import type { CreatureState } from '@/systems/types';
import { BASE_MOVES } from '@/systems/constants';

// ──────────────────────────── Battle Logic ───────────────────────────────

function calculateDamage(
  attacker: BattleParticipant,
  defender: BattleParticipant,
  move: BattleMove
): { damage: number; crit: boolean; dodged: boolean } {
  const basePower = move.power;
  const attackerStats = attacker.creature.stats;
  const defenderStats = defender.creature.stats;

  // Crit chance based on bond
  const critChance = (attackerStats.bond / 100) * 0.35;
  const isCrit = Math.random() < critChance;

  // Dodge based on reflex difference
  const dodgeChance = Math.max(0, (defenderStats.reflex - attackerStats.reflex) / 200);
  const isDodged = Math.random() < dodgeChance;

  if (isDodged) return { damage: 0, crit: false, dodged: true };

  // Scaling based on move category
  let atkStat = attackerStats.force;
  let defStat = defenderStats.vitality;

  if (move.category === 'Resonant') {
    atkStat = attackerStats.resonance;
    defStat = defenderStats.resonance * 0.8; // weaker defense against resonance
  } else if (move.category === 'Void') {
    atkStat = attackerStats.resonance * 0.6 + attackerStats.force * 0.4;
  } else if (move.category === 'Luminant') {
    atkStat = attackerStats.resonance;
  }

  // Adrenaline boost
  const adrenalineBonus = 1 + attacker.adrenaline * 0.2;

  let damage = Math.floor(
    ((basePower * (atkStat / 50)) / (defStat / 50 + 1)) *
    (0.85 + Math.random() * 0.3) *
    adrenalineBonus
  );

  if (isCrit) damage = Math.floor(damage * 1.5);

  return { damage: Math.max(1, damage), crit: isCrit, dodged: false };
}

// ──────────────────────────── Battle Engine ──────────────────────────────

export class BattleEngine {
  state: BattleState;
  onStateChange?: (state: BattleState) => void;

  constructor(participants: [BattleParticipant, BattleParticipant], options?: { public?: boolean }) {
    this.state = {
      id: `battle-${Date.now()}`,
      participants,
      round: 1,
      turn: 0,
      isComplete: false,
      winner: null,
      spectators: [],
      totalZaps: 0,
      battleLog: [],
      public: options?.public ?? true,
      phase: 'active',
    };
  }

  resolveMove(moveIndex: number, participantIndex: number): BattleLogEntry | null {
    if (this.state.isComplete || this.state.phase !== 'active') return null;

    const attacker = this.state.participants[participantIndex];
    const defender = this.state.participants[1 - participantIndex];

    if (moveIndex < 0 || moveIndex >= attacker.moves.length) return null;

    const move = attacker.moves[moveIndex];

    // Determine turn order by speed
    const attackerSpeed = attacker.creature.stats.reflex * 0.8 + attacker.creature.stats.bond * 0.2;
    const defenderSpeed = defender.creature.stats.reflex * 0.8 + defender.creature.stats.bond * 0.2;
    const _attackerFirst = attackerSpeed >= defenderSpeed;

    const result = calculateDamage(attacker, defender, move);

    const entry: BattleLogEntry = {
      turn: this.state.turn + 1,
      actor: attacker.npub,
      move: move.name,
      damage: result.damage,
      crit: result.crit,
      dodged: result.dodged,
      newHp: Math.max(0, defender.currentHp - result.damage),
      timestamp: Date.now(),
    };

    defender.currentHp = entry.newHp;

    // Apply healing from Luminant moves
    if (move.category === 'Luminant' && attacker.currentHp < attacker.creature.stats.vitality * 4.5) {
      const heal = Math.floor(move.power * 0.4);
      attacker.currentHp = Math.min(
        Math.floor(attacker.creature.stats.vitality * 4.5),
        attacker.currentHp + heal
      );
    }

    this.state.battleLog.push(entry);
    this.state.turn++;

    // Check for winner
    if (defender.currentHp <= 0) {
      this.state.isComplete = true;
      this.state.winner = attacker.npub;
      this.state.phase = 'done';
    }

    this.onStateChange?.(this.state);
    return entry;
  }

  simulateAIBattle(): BattleState {
    // Quick sim — AI vs player, both pick random moves
    while (!this.state.isComplete) {
      const pi = this.state.turn % 2;
      const moveIdx = Math.floor(Math.random() * this.state.participants[pi].moves.length);
      this.resolveMove(moveIdx, pi);

      // Force break if too long (draw)
      if (this.state.turn > 30) {
        this.state.isComplete = true;
        this.state.phase = 'done';
        break;
      }
    }
    return this.state;
  }

  addSpectator(npub: string) {
    if (!this.state.spectators.includes(npub)) {
      this.state.spectators.push(npub);
    }
  }

  addZap(amount: number) {
    this.state.totalZaps += amount;
    // Add adrenaline to the creature receiving the zap (simplified: both for now)
    for (const p of this.state.participants) {
      p.adrenaline = Math.min(3, p.adrenaline + amount / 1000);
    }
    this.onStateChange?.(this.state);
  }
}

export function createBattleParticipant(
  npub: string,
  creature: CreatureState,
  isAi?: boolean
): BattleParticipant {
  // Assign moves based on archetype + stage
  const moves = [...BASE_MOVES];

  if (creature.stage >= 3) {
    // Add a "God Power" move for Familiar+
    moves.push({
      id: 'god-power',
      name: 'Divine Surge',
      category: 'Luminant',
      power: 90,
      accuracy: 85,
      cooldown: 99,
      description: 'Unleash your divine will directly. One use per battle.',
    });
  }

  return {
    npub,
    creature,
    moves: moves.slice(0, Math.min(4 + creature.stage >= 3 ? 1 : 0, 5)),
    currentHp: Math.floor(creature.stats.vitality * 4.5),
    adrenaline: 0,
    moveSequence: [],
    ready: !!isAi,
  };
}

export function getEloChange(winnerElo: number, loserElo: number, k = 32): number {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(k * (1 - expectedWinner));
}
