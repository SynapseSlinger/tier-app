import { create } from 'zustand';
import { TIER_COLORS } from '../constants/colors';

export interface Item {
  id: string;
  uri: string;
  label: string;
}

export interface Tier {
  id: string;
  title: string;
  color: string;
  items: Item[];
}

export interface TierList {
  id: string;
  title: string;
  tiers: Tier[];
  unassignedPool: Item[];
}

interface TierStore {
  tierList: TierList;
  addItem: (item: Item) => void;
  moveItem: (itemId: string, targetTierId: string | null) => void;
  updateTier: (tierId: string, updates: Partial<Pick<Tier, 'title' | 'color'>>) => void;
  resetList: () => void;
}

const DEFAULT_TIERS: Tier[] = Object.entries(TIER_COLORS).map(([title, color]) => ({
  id: title.toLowerCase(),
  title,
  color,
  items: [],
}));

const createDefaultList = (): TierList => ({
  id: '1',
  title: 'Neue Tier-List',
  tiers: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
  unassignedPool: [],
});

export const useTierStore = create<TierStore>((set) => ({
  tierList: createDefaultList(),

  addItem: (item) =>
    set((state) => ({
      tierList: {
        ...state.tierList,
        unassignedPool: [...state.tierList.unassignedPool, item],
      },
    })),

  moveItem: (itemId, targetTierId) =>
    set((state) => {
      const list = state.tierList;
      let movedItem: Item | undefined;

      const poolIndex = list.unassignedPool.findIndex((i) => i.id === itemId);
      if (poolIndex !== -1) {
        movedItem = list.unassignedPool[poolIndex];
      }

      const newTiers = list.tiers.map((tier) => {
        const idx = tier.items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          movedItem = tier.items[idx];
          return { ...tier, items: tier.items.filter((i) => i.id !== itemId) };
        }
        return tier;
      });

      if (!movedItem) return state;

      const newPool = list.unassignedPool.filter((i) => i.id !== itemId);

      if (targetTierId === null) {
        return {
          tierList: { ...list, tiers: newTiers, unassignedPool: [...newPool, movedItem] },
        };
      }

      return {
        tierList: {
          ...list,
          tiers: newTiers.map((tier) =>
            tier.id === targetTierId ? { ...tier, items: [...tier.items, movedItem!] } : tier
          ),
          unassignedPool: newPool,
        },
      };
    }),

  updateTier: (tierId, updates) =>
    set((state) => ({
      tierList: {
        ...state.tierList,
        tiers: state.tierList.tiers.map((tier) =>
          tier.id === tierId ? { ...tier, ...updates } : tier
        ),
      },
    })),

  resetList: () => set({ tierList: createDefaultList() }),
}));
