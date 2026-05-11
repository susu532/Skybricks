import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

const crazyGamesStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && (window as any).CrazyGames?.SDK) {
      try {
        const sdk = (window as any).CrazyGames.SDK;
        let isInitialized = true;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) { isInitialized = false; }
        }
        if (isInitialized && sdk.data) {
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
        let isInitialized = true;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) { isInitialized = false; }
        }
        if (isInitialized && sdk.data) {
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
        let isInitialized = true;
        if (typeof sdk.init === 'function') {
            try { await sdk.init(); } catch (e) { isInitialized = false; }
        }
        if (isInitialized && sdk.data) {
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
  uiHidden: boolean;
  setUiHidden: (hidden: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
  furnitureUnlocked: boolean;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (val: boolean) => void;
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
  setIsMobile: (isMobile: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => {
      const generateHouse = (): BlockData[] => {
        const blocks: BlockData[] = [];
        let idCounter = 0;
        const add = (type: BlockType, x: number, y: number, z: number, rotY: number, color: string) => {
          blocks.push({ id: `mansion_${idCounter++}`, type, position: [x, y, z], rotation: [0, rotY, 0], color });
        };

        const cWallCore = '#f8f4e6'; // Off-white interior
        const cWallExt = '#e6d8cd'; // Warm beige stone exterior
        const cRoof = '#363636'; // Slate grey roof
        const cFloorLiving = '#8b5a2b'; // Wood floor
        const cFloorKitchen = '#cdd0d8'; // Tile floor
        const cFloorBed = '#dcd5c9'; // Carpet
        const cFloorBath = '#b0c4de'; // Light blue tile
        const cGrass = '#5c9a41';

        const width = 48;
        const depth = 40;

        // --- Yard ---
        for (let x = -32; x < 32; x += 8) {
          for (let z = -32; z < 32; z += 8) {
            const px = x + 4;
            const pz = z + 4;
            // Skip yard plates that are directly under the house foundation
            if (Math.abs(px) < 24 && Math.abs(pz) < 20) continue;
            add('plate_8x8', px, 0.2, pz, 0, cGrass);
          }
        }

        // --- Foundation & Floors ---
        const floorY = 0.6; // 0.2 (grass) + 0.4 (plate)
        for (let x = -24; x < 24; x += 4) {
          for (let z = -20; z < 20; z += 4) {
            let color = cFloorLiving; // Default living area
            
            // Kitchen/Dining (Front Right)
            if (x >= 0 && z >= 0) color = cFloorKitchen;
            // Master Bedroom (Back Left)
            if (x < -8 && z < 0) color = cFloorBed;
            // Guest Room (Front Left)
            if (x < -8 && z >= 0) color = cFloorBed;
            // Bathrooms (Right side back)
            if (x >= 8 && z < 0) color = cFloorBath;
            // Library/Office (Middle Left)
            if (x >= -8 && x < 0 && z < 0) color = '#5d4037'; // Dark wood
            
            add('plate_4x4', x + 2, floorY, z + 2, 0, color);
          }
        }

        // --- Exterior & Interior Walls ---
        const wallH = 8; // Taller walls for a mansion
        for (let h = 0; h < wallH; h++) {
          const y = floorY + 0.2 + h * 1.2 + 0.6;
          
          // Outer Perimeter - Back & Front Walls (Horizontal orientation wins at corners)
          for (let x = -24; x < 24; x += 4) {
            const xOff = x + 2;
            // Back Wall (Z = -19)
            if (!(h >= 2 && h <= 5 && (x === -16 || x === 16))) {
              add('2x4', xOff, y, -19, Math.PI / 2, cWallExt);
            }
            // Front Wall (Z = 19)
            if (!(h < 5 && x >= -4 && x < 4) && !(h >= 2 && h <= 5 && (x === -16 || x === 16))) {
              add('2x4', xOff, y, 19, Math.PI / 2, cWallExt);
            }
          }

          // Outer Perimeter - Side Walls (Vertical orientation, adjusted to fit between corners)
          for (let z = -16; z < 16; z += 4) {
            const zOff = z + 2;
            if (h >= 2 && h <= 5 && (z === -8 || z === 8)) continue;
            add('2x4', -23, y, zOff, 0, cWallExt);
            add('2x4', 23, y, zOff, 0, cWallExt);
          }
          // Close the corner gaps precisely
          add('2x2', -23, y, -17, 0, cWallExt);
          add('2x2', 23, y, -17, 0, cWallExt);
          add('2x2', -23, y, 17, 0, cWallExt);
          add('2x2', 23, y, 17, 0, cWallExt);

          // Interior Dividers
          // Vertical Hallway Walls
          for (let z = -20; z < 20; z += 4) {
             const zOff = z + 2;
             if (h < 5 && (z === 0 || z === -8 || z === 8)) continue;
             add('2x4', -8, y, zOff, 0, cWallCore);
             add('2x4', 8, y, zOff, 0, cWallCore);
          }

          // Horizontal Room Dividers (Avoiding hallway vertical wall intersection)
          for (let x = -24; x < 24; x += 4) {
             const xOff = x + 2;
             if (x === -8 || x === 8) continue; // Step aside at hallway junctions
             if (h < 5 && (x === -16 || x === 16)) continue; 
             add('2x4', xOff, y, 0, Math.PI / 2, cWallCore);
          }
        }

        // --- Roof details ---
        let roofY = floorY + 0.2 + wallH * 1.2 + 0.2; 
        for (let x = -28; x < 28; x += 8) {
          for (let z = -24; z < 24; z += 8) {
            add('plate_8x8', x + 4, roofY, z + 4, 0, cRoof);
          }
        }
        
        // --- Furniture ---
        const fy = floorY + 0.2;

        // Grand Entrance Hall (Middle Front: x -8..8, z 0..20)
        
        add('pouf', -5, fy + 0.6, 14, 0, '#FAF9F6');

        // Living Room (West Front: x -24..-8, z 0..20)
        add('sofa', -16, fy + 1.0, 14, Math.PI, '#222222'); // Facing South
        add('coffee_table', -16, fy + 0.7, 9, 0, '#ffffff');
        
        add('cabinet', -20, fy + 1.8, 0.8, 0, '#111111');
        add('tv', -20, fy + 4.1, 0.8, 0, '#000000'); // Moved right to clear doorway
        add('armchair', -21, fy + 1.0, 9, Math.PI/4, '#d4af37'); 

        // Professional Kitchen (East Front: x 8..24, z 0..20)
        // Main units along the East wall
        add('fridge', 20.5, fy + 3.0, 3, -Math.PI / 2, '#444444');
        add('stove', 20.5, fy + 1.2, 7, -Math.PI / 2, '#222222');
        add('sink', 20.5, fy + 1.2, 11, -Math.PI / 2, '#ffffff');
        
        // Kitchen Island
        add('cabinet', 18, fy + 1.6, 6, -Math.PI / 2, '#222222');
        add('cabinet', 18, fy + 1.6, 10, -Math.PI / 2, '#222222');

        // Formal Dining Area (Within East Front Room)
        add('dining_table', 13, fy + 1.2, 8, Math.PI / 2, '#4d3227');
        add('chair', 13, fy + 1.0, 4, 0, '#333333');
        add('chair', 13, fy + 1.0, 12, -Math.PI, '#333333');

        // Executive Office (Middle Back: x -8..8, z -20..0)
        add('bookshelf', 0, fy + 3.0, -17, 0, '#3b2f2f');
        add('desk', 0, fy + 1.2, -12, 0, '#1a1a1a');
        add('monitor', 0, fy + 3.2, -12, 0, '#000000');
        add('chair', 0, fy + 1.0, -14, 0, '#333333');
        add('armchair', 5, fy + 1.0, -8, -Math.PI/2, '#483c32');

        // Master Retreat (West Back: x -24..-8, z -20..0)
        add('canopy_bed', -16, fy + 2.5, -12, 0, '#222222');
        add('tv', -20, fy + 3.0, -1.5, Math.PI, '#000000');
        add('lamp', -12, fy + 2.4, -15, 0, '#ffffff');

        // Spa Bathroom (East Back: x 8..24, z -20..0)
        add('bathtub', 18, fy + 0.8, -14, 0, '#ffffff');
        add('shower', 20, fy + 3.0, -8, 0, '#8ed1e0');
        add('vanity', 14, fy + 1.2, -4, Math.PI, '#111111');
        add('toilet', 20, fy + 0.8, -16.5, 0, '#ffffff');

        // --- Outdoor Oasis ---
        
        // Sun Deck
        add('sofa', 12, fy + 0.5, 31, Math.PI, '#ffffff');
        add('sofa', 28, fy + 0.5, 31, Math.PI, '#ffffff');
        
        // Vegetation
        for (let i = 0; i < 3; i++) {
            add('plant', -28, floorY + 1.0, -20 + i * 20, 0, '#006400');
            add('plant', 28, floorY + 1.0, -20 + i * 20, 0, '#006400');
        }

        add('disco_ball', 0, 8, 10, 0, '#ffffff'); 

        // --- Barbie Castle Extension ---
        const cBPink = '#FA31A7'; // Barbie Pink
        const cBLightPink = '#FFB6C1'; // Light Pink
        const cBWhite = '#FFFFFF'; // White
        const cBGold = '#FFD700'; // Gold accents

        const cx = 0;
        const cz = 55; // Positioned in front of the mansion (mansion ends at z=20)
        const castleFloorY = floorY;

        // Expanded Grass for Castle
        for (let x = -24; x < 24; x += 8) {
          for (let z = 32; z < 80; z += 8) {
            add('plate_8x8', x + 4, 0.2, z + 4, 0, cGrass);
          }
        }

        // Castle Foundation
        for (let x = -12; x < 12; x += 4) {
          for (let z = cz - 10; z < cz + 10; z += 4) {
             add('plate_4x4', x + 2, castleFloorY, z + 2, 0, cBWhite);
          }
        }

        // Corner Towers (4 main ones)
        const towerPositions = [
          {x: -11, z: cz - 9}, {x: 11, z: cz - 9},
          {x: -11, z: cz + 9}, {x: 11, z: cz + 9}
        ];

        towerPositions.forEach(pos => {
          // Base
          for(let h = 0; h < 12; h++) {
            add('cylinder_2x2', pos.x, castleFloorY + 0.6 + h * 1.2, pos.z, 0, cBLightPink);
          }
          // Trim/Balcony at top of tower
          add('plate_4x4', pos.x, castleFloorY + 0.6 + 12 * 1.2 + 0.2, pos.z, 0, cBPink);
          // Pointy Roof
          for(let rh = 0; rh < 3; rh++) {
            add('cylinder_1x1', pos.x, castleFloorY + 0.6 + 12 * 1.2 + 0.6 + rh * 1.2, pos.z, 0, cBPink);
          }
        });

        // Main Walls
        const castleWallH = 10;
        for (let h = 0; h < castleWallH; h++) {
          const y = castleFloorY + 0.6 + h * 1.2 + 0.6;
          
          // Front & Back Walls
          for (let x = -8; x <= 8; x += 4) {
            // Front wall with entrance gap
            if (!(h < 4 && Math.abs(x) < 2)) {
               add('2x4', x, y, cz - 9, Math.PI/2, cBPink);
            }
            // Back wall
            add('2x4', x, y, cz + 9, Math.PI/2, cBPink);
          }

          // Side Walls
          for (let z = cz - 5; z <= cz + 5; z += 4) {
            add('2x4', -11, y, z, 0, cBPink);
            add('2x4', 11, y, z, 0, cBPink);
          }
        }

        // Second Floor
        const secondFloorY = castleFloorY + 0.6 + castleWallH * 1.2 + 0.4;
        for (let x = -8; x < 8; x += 4) {
          for (let z = cz - 8; z < cz + 8; z += 4) {
            add('plate_4x4', x + 2, secondFloorY, z + 2, 0, cBWhite);
          }
        }

        // Central Mini Tower
        for(let h = 0; h < 6; h++) {
          add('cylinder_2x2', 0, secondFloorY + 0.6 + h * 1.2, cz, 0, cBWhite);
        }
        add('plate_4x4', 0, secondFloorY + 0.6 + 6 * 1.2 + 0.2, cz, 0, cBGold);
        add('cylinder_1x1', 0, secondFloorY + 0.6 + 6 * 1.2 + 0.8, cz, 0, cBPink);

        // Balcony Railings (Plates)
        for(let x = -10; x <= 10; x += 4) {
          add('plate_1x4', x, secondFloorY + 0.4, cz - 8, Math.PI/2, cBGold);
          add('plate_1x4', x, secondFloorY + 0.4, cz + 8, Math.PI/2, cBGold);
        }

        // Interior & Furniture
        add('canopy_bed', 0, castleFloorY + 2.5, cz + 4, 0, cBPink);
        add('heart_rug', 0, castleFloorY + 0.4, cz - 2, 0, cBPink);
        add('bow_chair', -4, castleFloorY + 1.2, cz - 4, Math.PI/2, cBGold);
        add('bow_chair', 4, castleFloorY + 1.2, cz - 4, -Math.PI/2, cBGold);
        add('vanity', 0, castleFloorY + 1.2, cz - 6, Math.PI, cBWhite);
        add('disco_ball', 0, secondFloorY + 4, cz, 0, '#ffffff');

        // Path between Mansion and Castle
        for(let z = 20; z < 45; z += 4) {
          add('plate_4x4', 0, floorY, z + 2, 0, '#FAF9F6');
        }

        // Heart-Shaped Pool
        add('heart_rug', -12, floorY + 0.1, 40, 0, '#00AEEF'); // Pool blue
        add('heart_rug', 12, floorY + 0.1, 40, 0, '#00AEEF');

        // Palm Trees
        const addPalm = (x: number, z: number) => {
          // Trunk
          for(let th = 0; th < 5; th++) {
            add('cylinder_1x1', x, floorY + 0.6 + th * 1.2, z, 0, '#6F4E37');
          }
          // Leaves (using plates)
          add('plate_4x4', x, floorY + 0.6 + 5 * 1.2 + 0.2, z, 0, '#228B22');
        };

        addPalm(-18, 50);
        addPalm(18, 50);
        addPalm(-18, 70);
        addPalm(18, 70);

        return blocks;
      };

  return {
  blocks: generateHouse(),
  history: [],
  redoStack: [],
  selectedColor: '#FFD1DC',
  selectedType: '2x4',
  isMobile: typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    (window.innerWidth < 768 && (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent)) // For iPad Pro
    : false,
  uiHidden: false,
  setUiHidden: (hidden) => set((state) => ({ uiHidden: typeof hidden === 'function' ? hidden(state.uiHidden) : hidden })),
  performanceMode: true,
  furnitureUnlocked: false,
  hasSeenTutorial: false,
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
  setIsMobile: (isMobile) => set({ isMobile }),
  setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),
};},
    {
      name: 'mansion-builder-storage',
      storage: createJSONStorage(() => crazyGamesStorage),
      partialize: (state) => ({ 
        blocks: state.blocks, 
        hasSeenTutorial: state.hasSeenTutorial 
      }),
    }
  )
);
