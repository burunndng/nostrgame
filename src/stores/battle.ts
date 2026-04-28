import { create } from 'zustand';
import type { BattleState, BattleParticipant, PersonProfile } from '@/systems/types';

interface BattleStore {
  activeBattle: BattleState | null;
  isSearching: boolean;
  onlineProfiles: PersonProfile[];

  actions: {
    startBattle: (battle: BattleState) => void;
    submitMove: (moveIndex: number) => void;
    resolveAITurn: () => void;
    endBattle: () => void;
    addZapToBattle: (sats: number) => void;
    setSearching: (v: boolean) => void;
    setOnlineProfiles: (profiles: PersonProfile[]) => void;
  };
}

export const useBattleStore = create<BattleStore>()((set, get) => ({
  activeBattle: null,
  isSearching: false,
  onlineProfiles: [],

  actions: {
    startBattle: (battle: BattleState) => {
      set({ activeBattle: battle });
    },

    submitMove: (moveIndex: number) => {
      const battle = get().activeBattle;
      if (!battle) return;

      // Player is always index 0 in local mode
      const entry = battle.battleLog[battle.battleLog.length - 1];
      // In a real PvP this would be async, but for now we handle it
    },

    resolveAITurn: () => {
      // Handled in Arena view directly with BattleEngine
    },

    endBattle: () => {
      set({ activeBattle: null });
    },

    addZapToBattle: (sats: number) => {
      // Increase "adrenaline" of battling creature
    },

    setSearching: (v: boolean) => set({ isSearching: v }),
    setOnlineProfiles: (profiles: PersonProfile[]) => set({ onlineProfiles: profiles }),
  },
}));
