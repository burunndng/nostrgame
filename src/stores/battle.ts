import { create } from 'zustand';
import type { BattleState, PersonProfile } from '@/systems/types';

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

    submitMove: (_moveIndex: number) => {
      if (!get().activeBattle) return;
    },

    resolveAITurn: () => {
      // Handled in Arena view directly with BattleEngine
    },

    endBattle: () => {
      set({ activeBattle: null });
    },

    addZapToBattle: (_sats: number) => {},

    setSearching: (v: boolean) => set({ isSearching: v }),
    setOnlineProfiles: (profiles: PersonProfile[]) => set({ onlineProfiles: profiles }),
  },
}));
