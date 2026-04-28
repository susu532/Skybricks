import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { getIntegrityToken } from './utils/security';

// Validate runtime integrity
const _it = getIntegrityToken();

const crazyGamesStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && (window as any).CrazyGames?.SDK) {
      try {
        const sdk = (window as any).CrazyGames.SDK;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) {}
        }
        if (sdk.data) {
          const item = await sdk.data.getItem(name);
          // Only return if truthy string, to let Zustand handle it, else fallback to localstorage logic
          if (item) return item;
        }
      } catch (e) {
        console.warn('CrazyGames SDK getItem failed', e);
      }
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && (window as any).CrazyGames?.SDK) {
      try {
        const sdk = (window as any).CrazyGames.SDK;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) {}
        }
        if (sdk.data) {
          await sdk.data.setItem(name, value);
        }
      } catch (e) {
        console.warn('CrazyGames SDK setItem failed', e);
      }
    }
    // Also save locally as a backup
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window !== 'undefined' && (window as any).CrazyGames?.SDK) {
      try {
        const sdk = (window as any).CrazyGames.SDK;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) {}
        }
        if (sdk.data) {
          await sdk.data.removeItem(name);
        }
      } catch (e) {
        console.warn('CrazyGames SDK removeItem failed', e);
      }
    }
    localStorage.removeItem(name);
  },
};

export type BlockDimensions = {
  w: number;
  d: number;
  isPlate?: boolean;
  shape?: 'brick' | 'cylinder' | 'chair' | 'table' | 'bed' | 'plant' | 'rug' | 'sofa' | 'desk' | 'monitor' | 'lamp' | 'cabinet' | 'bookshelf' | 'tv' | 'toilet' | 'bathtub' | 'fridge' | 'stove' | 'sink' | 'washer' | 'dining_table' | 'coffee_table' | 'armchair' | 'shower' | 'vanity' | 'mirror' | 'stool' | 'pouf' | 'heart_rug' | 'canopy_bed' | 'clothing_rack' | 'bow_chair' | 'record_player' | 'disco_ball';
};

export type BlockType = 
  | '1x1' | '1x2' | '1x3' | '1x4' | '1x6' | '1x8'
  | '2x2' | '2x3' | '2x4' | '2x6' | '2x8'
  | 'plate_1x1' | 'plate_1x2' | 'plate_1x3' | 'plate_1x4' | 'plate_1x6' | 'plate_1x8'
  | 'plate_2x2' | 'plate_2x3' | 'plate_2x4' | 'plate_2x6' | 'plate_2x8'
  | 'plate_4x4' | 'plate_4x8' | 'plate_6x6' | 'plate_8x8'
  | 'cylinder_1x1' | 'cylinder_2x2'
  | 'chair' | 'table' | 'bed' | 'plant' | 'rug_4x4' | 'rug_6x6'
  | 'sofa' | 'desk' | 'monitor' | 'lamp' | 'cabinet' | 'bookshelf'
  | 'tv' | 'toilet' | 'bathtub' | 'fridge' | 'stove'
  | 'sink' | 'washer' | 'dining_table' | 'coffee_table' | 'armchair' | 'shower'
  | 'vanity' | 'mirror' | 'stool' | 'pouf' | 'heart_rug' | 'canopy_bed' | 'clothing_rack'
  | 'bow_chair' | 'record_player' | 'disco_ball';

export const BLOCK_DIMENSIONS: Record<BlockType, BlockDimensions> = {
  '1x1': { w: 1, d: 1 },
  '1x2': { w: 1, d: 2 },
  '1x3': { w: 1, d: 3 },
  '1x4': { w: 1, d: 4 },
  '1x6': { w: 1, d: 6 },
  '1x8': { w: 1, d: 8 },
  '2x2': { w: 2, d: 2 },
  '2x3': { w: 2, d: 3 },
  '2x4': { w: 2, d: 4 },
  '2x6': { w: 2, d: 6 },
  '2x8': { w: 2, d: 8 },
  'plate_1x1': { w: 1, d: 1, isPlate: true },
  'plate_1x2': { w: 1, d: 2, isPlate: true },
  'plate_1x3': { w: 1, d: 3, isPlate: true },
  'plate_1x4': { w: 1, d: 4, isPlate: true },
  'plate_1x6': { w: 1, d: 6, isPlate: true },
  'plate_1x8': { w: 1, d: 8, isPlate: true },
  'plate_2x2': { w: 2, d: 2, isPlate: true },
  'plate_2x3': { w: 2, d: 3, isPlate: true },
  'plate_2x4': { w: 2, d: 4, isPlate: true },
  'plate_2x6': { w: 2, d: 6, isPlate: true },
  'plate_2x8': { w: 2, d: 8, isPlate: true },
  'plate_4x4': { w: 4, d: 4, isPlate: true },
  'plate_4x8': { w: 4, d: 8, isPlate: true },
  'plate_6x6': { w: 6, d: 6, isPlate: true },
  'plate_8x8': { w: 8, d: 8, isPlate: true },
  'cylinder_1x1': { w: 1, d: 1, shape: 'cylinder' },
  'cylinder_2x2': { w: 2, d: 2, shape: 'cylinder' },
  'chair': { w: 2, d: 2, shape: 'chair' },
  'table': { w: 4, d: 4, shape: 'table' },
  'bed': { w: 4, d: 6, shape: 'bed' },
  'plant': { w: 2, d: 2, shape: 'plant' },
  'rug_4x4': { w: 4, d: 4, shape: 'rug' },
  'rug_6x6': { w: 6, d: 6, shape: 'rug' },
  'sofa': { w: 6, d: 2, shape: 'sofa' },
  'desk': { w: 6, d: 3, shape: 'desk' },
  'monitor': { w: 2, d: 1, shape: 'monitor' },
  'lamp': { w: 1, d: 1, shape: 'lamp' },
  'cabinet': { w: 4, d: 2, shape: 'cabinet' },
  'bookshelf': { w: 6, d: 2, shape: 'bookshelf' },
  'tv': { w: 4, d: 1, shape: 'tv' },
  'toilet': { w: 2, d: 3, shape: 'toilet' },
  'bathtub': { w: 4, d: 8, shape: 'bathtub' },
  'fridge': { w: 3, d: 3, shape: 'fridge' },
  'stove': { w: 3, d: 3, shape: 'stove' },
  'sink': { w: 3, d: 2, shape: 'sink' },
  'washer': { w: 3, d: 3, shape: 'washer' },
  'dining_table': { w: 6, d: 8, shape: 'dining_table' },
  'coffee_table': { w: 4, d: 2, shape: 'coffee_table' },
  'armchair': { w: 3, d: 3, shape: 'armchair' },
  'shower': { w: 4, d: 4, shape: 'shower' },
  'vanity': { w: 4, d: 2, shape: 'vanity' },
  'mirror': { w: 4, d: 1, shape: 'mirror' },
  'stool': { w: 2, d: 2, shape: 'stool' },
  'pouf': { w: 2, d: 2, shape: 'pouf' },
  'heart_rug': { w: 4, d: 4, shape: 'heart_rug' },
  'canopy_bed': { w: 4, d: 6, shape: 'canopy_bed' },
  'clothing_rack': { w: 4, d: 2, shape: 'clothing_rack' },
  'bow_chair': { w: 2, d: 2, shape: 'bow_chair' },
  'record_player': { w: 2, d: 2, shape: 'record_player' },
  'disco_ball': { w: 2, d: 2, shape: 'disco_ball' },
};

export interface BlockData {
  id: string;
  type: BlockType;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

interface AppState {
  blocks: BlockData[];
  history: BlockData[][];
  redoStack: BlockData[][];
  selectedColor: string;
  selectedType: BlockType;
  performanceMode: boolean;
  isMobile: boolean;
  furnitureUnlocked: boolean;
  addBlock: (block: BlockData) => void;
  removeBlock: (id: string) => void;
  setColor: (color: string) => void;
  setType: (type: BlockType) => void;
  togglePerformanceMode: () => void;
  unlockFurniture: () => void;
  clearBlocks: () => void;
  setBlocks: (blocks: BlockData[]) => void;
  resetToHouse: () => void;
  undo: () => void;
  redo: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => {
      const generateHouse = (): BlockData[] => {
        const blocks: BlockData[] = [];
        let idCounter = 0;
    const add = (type: BlockType, x: number, y: number, z: number, rotY: number, color: string) => {
      blocks.push({
        id: `house_${idCounter++}`,
        type,
        position: [x, y, z],
        rotation: [0, rotY, 0],
        color,
      });
    };

    const cPink = '#FF69B4'; // Hot Pink
    const cMagenta = '#FF0090'; // Magenta
    const cLilac = '#C8A2C8'; // Lilac
    const cMint = '#98FF98'; // Mint Green
    const cWhite = '#FFFFFF';
    const cYellow = '#FFF44F'; // Zesty Yellow

    // Base Dimensions
    const width = 12; // in studs 
    const depth = 10;
    
    // Foundation (Plates)
    for (let x = -width/2; x < width/2; x+=2) {
      for (let z = -depth/2; z < depth/2; z+=4) {
        add('plate_2x4', x + 1, 0.2, z + 2, 0, cMint);
      }
    }

    // Walls
    const wallHeight = 5;
    for (let h = 0; h < wallHeight; h++) {
      const y = h * 1.2 + 0.6 + 0.4; // 0.4 is plate height
      const color = h % 2 === 0 ? cPink : cLilac;
      
      // Front and Back walls
      for (let x = -width/2; x < width/2; x += 4) {
        // Leave a gap for door on the front
        if (h < 3 && x >= -2 && x < 2) {
            // Doorway gap
        } else {
            add('2x4', x + 2, y, -depth/2 + 1, Math.PI / 2, color); // Front
        }
        add('2x4', x + 2, y, depth/2 - 1, Math.PI / 2, color); // Back
      }

      // Left and Right walls
      // Space to fill is Z from -3 to 3 (length 6)
      // We'll use one 2x4 (length 4) and one 2x2 (length 2)
      if (h === 2) {
         // Window gap -> just add the 2x2 on details if needed, but leaving a 4-long gap
         // Left side
         add('2x2', -width/2 + 1, y, 2, 0, color);  // covers Z [1, 3], leaves [-3, 1] open
         // Right side
         add('2x2', width/2 - 1, y, 2, 0, color);
      } else {
         // Left side
         add('2x4', -width/2 + 1, y, -1, 0, color); // covers Z [-3, 1]
         add('2x2', -width/2 + 1, y, 2, 0, color);  // covers Z [1, 3]
         // Right side
         add('2x4', width/2 - 1, y, -1, 0, color);
         add('2x2', width/2 - 1, y, 2, 0, color);
      }

      // Corners filler
      add('2x2', -width/2 + 1, y, -depth/2 + 1, 0, color);
      add('2x2', width/2 - 1, y, -depth/2 + 1, 0, color);
      add('2x2', -width/2 + 1, y, depth/2 - 1, 0, color);
      add('2x2', width/2 - 1, y, depth/2 - 1, 0, color);
    }

    // Arch over door
    add('2x4', 0, 3 * 1.2 + 1.0, -depth/2 + 1, Math.PI / 2, cMagenta);

    // Roof (Pyramid style)
    const roofColor = cMagenta;
    let roofY = wallHeight * 1.2 + 1.0;
    for (let level = 0; level < 4; level++) {
       const cw = width / 2 - level * 2;
       const cd = depth / 2 - level * 2;
       
       if (cw <= 0 || cd <= 0) break;
       
       for (let x = -cw; x < cw; x += 2) {
         add('2x2', x + 1, roofY, -cd + 1, 0, roofColor);
         add('2x2', x + 1, roofY, cd - 1, 0, roofColor);
       }
       for (let z = -cd + 2; z < cd - 2; z += 2) {
         add('2x2', -cw + 1, roofY, z + 1, 0, roofColor);
         add('2x2', cw - 1, roofY, z + 1, 0, roofColor);
       }
       roofY += 1.2;
    }
    
    // Top ornament
    add('1x2', 0, roofY, 0, 0, cYellow);
    
    // Some decorations (plants/fences)
    add('1x1', -4, 0.6 + 0.4, -depth/2 - 1, 0, cMint);
    add('1x1', 4, 0.6 + 0.4, -depth/2 - 1, 0, cMint);
    add('1x1', -4, 1.8 + 0.4, -depth/2 - 1, 0, cYellow); // flower
    add('1x1', 4, 1.8 + 0.4, -depth/2 - 1, 0, cYellow); // flower

    return blocks;
  };

  return {
  blocks: generateHouse(),
  history: [],
  redoStack: [],
  selectedColor: '#FFD1DC',
  selectedType: '2x4',
  isMobile: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768 : false,
  performanceMode: typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768 : false,
  furnitureUnlocked: false,
  addBlock: (block) => set((state) => ({ 
    history: [...state.history, state.blocks], 
    redoStack: [],
    blocks: [...state.blocks, block] 
  })),
  removeBlock: (id) => set((state) => ({ 
    history: [...state.history, state.blocks], 
    redoStack: [],
    blocks: state.blocks.filter(b => b.id !== id) 
  })),
  setColor: (color) => set({ selectedColor: color }),
  setType: (type) => set({ selectedType: type }),
  togglePerformanceMode: () => set((state) => ({ performanceMode: !state.performanceMode })),
  unlockFurniture: () => set({ furnitureUnlocked: true }),
  clearBlocks: () => set((state) => ({ 
    history: [...state.history, state.blocks], 
    redoStack: [],
    blocks: [] 
  })),
  resetToHouse: () => set({ blocks: generateHouse(), history: [], redoStack: [] }),
  setBlocks: (blocks) => set({ blocks }),
  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const newHistory = [...state.history];
    const previousBlocks = newHistory.pop();
    if (!previousBlocks) return state;
    return { 
      blocks: previousBlocks, 
      history: newHistory,
      redoStack: [state.blocks, ...state.redoStack]
    };
  }),
  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    const newRedoStack = [...state.redoStack];
    const nextBlocks = newRedoStack.shift();
    if (!nextBlocks) return state;
    return {
      blocks: nextBlocks,
      history: [...state.history, state.blocks],
      redoStack: newRedoStack
    };
  }),
};},
    {
      name: 'block-builder-storage-' + _it,
      storage: createJSONStorage(() => crazyGamesStorage),
      partialize: (state) => ({ blocks: state.blocks, furnitureUnlocked: state.furnitureUnlocked }),
    }
  )
);
