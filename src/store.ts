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
  isFlying: boolean;
  mobileMovement: { forward: number; backward: number; left: number; right: number };
  setMobileMovement: (movement: Partial<AppState['mobileMovement']>) => void;
  mobileActions: { jump: boolean; shift: boolean; rotate: boolean };
  setMobileAction: (action: keyof AppState['mobileActions'], value: boolean) => void;
  setIsFlying: (isFlying: boolean | ((prev: boolean) => boolean)) => void;
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
        
        const isMobileDevice = typeof window !== 'undefined' ? 
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
            (window.innerWidth < 768 && (typeof navigator !== 'undefined' && Math.max(navigator.maxTouchPoints, 0) > 0)) ||
            (typeof navigator !== 'undefined' && Math.max(navigator.maxTouchPoints, 0) > 0 && /Macintosh/.test(navigator.userAgent))
            : false;

        const mZ = -40; // Mansion Z offset
        const add = (type: BlockType, x: number, y: number, z: number, rotY: number, color: string) => {
          if (isMobileDevice) return;
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
            const pz = z + 4 + mZ;
            // Skip yard plates that are directly under the house foundation
            if (Math.abs(px) < 24 && Math.abs(pz - mZ) < 20) continue;
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
            
            add('plate_4x4', x + 2, floorY, z + 2 + mZ, 0, color);
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
              add('2x4', xOff, y, -19 + mZ, Math.PI / 2, cWallExt);
            }
            // Front Wall (Z = 19)
            if (!(h < 5 && x >= -4 && x < 4) && !(h >= 2 && h <= 5 && (x === -16 || x === 16))) {
              add('2x4', xOff, y, 19 + mZ, Math.PI / 2, cWallExt);
            }
          }

          // Outer Perimeter - Side Walls (Vertical orientation, adjusted to fit between corners)
          for (let z = -16; z < 16; z += 4) {
            const zOff = z + 2 + mZ;
            if (h >= 2 && h <= 5 && (z === -8 || z === 8)) continue;
            add('2x4', -23, y, zOff, 0, cWallExt);
            add('2x4', 23, y, zOff, 0, cWallExt);
          }
          // Close the corner gaps precisely
          add('2x2', -23, y, -17 + mZ, 0, cWallExt);
          add('2x2', 23, y, -17 + mZ, 0, cWallExt);
          add('2x2', -23, y, 17 + mZ, 0, cWallExt);
          add('2x2', 23, y, 17 + mZ, 0, cWallExt);

          // Interior Dividers
          // Vertical Hallway Walls
          for (let z = -20; z < 20; z += 4) {
             const zOff = z + 2 + mZ;
             if (h < 5 && (z === 0 || z === -8 || z === 8)) continue;
             add('2x3', -8, y, zOff, 0, cWallCore);
             add('2x3', 8, y, zOff, 0, cWallCore);
          }

          // Horizontal Room Dividers (Avoiding hallway vertical wall intersection)
          for (let x = -24; x < 24; x += 4) {
             const xOff = x + 2;
             if (x === -8 || x === 8) continue; // Step aside at hallway junctions
             if (h < 5 && (x === -16 || x === 16)) continue; 
             add('2x4', xOff, y, 0 + mZ, Math.PI / 2, cWallCore);
          }
        }

        // --- Roof details ---
        let roofY = floorY + 0.2 + wallH * 1.2 + 0.2; 
        for (let x = -28; x < 28; x += 8) {
          for (let z = -24; z < 24; z += 8) {
            add('plate_8x8', x + 4, roofY, z + 4 + mZ, 0, cRoof);
          }
        }
        
        // --- Furniture ---
        const fy = floorY + 0.2;

        // Grand Entrance Hall (Middle Front: x -8..8, z 0..20)
        
        add('pouf', -5, fy + 0.6, 14 + mZ, 0, '#FAF9F6');

        // Living Room (West Front: x -24..-8, z 0..20)
        add('sofa', -16, fy + 1.0, 14 + mZ, Math.PI, '#222222'); // Facing South
        add('coffee_table', -16, fy + 0.7, 9 + mZ, 0, '#ffffff');
        
        add('cabinet', -20, fy + 1.8, 0.8 + mZ, 0, '#111111');
        add('tv', -20, fy + 4.1, 0.8 + mZ, 0, '#000000'); // Moved right to clear doorway
        add('armchair', -21, fy + 1.0, 9 + mZ, Math.PI/4, '#d4af37'); 

        // Professional Kitchen (East Front: x 8..24, z 0..20)
        // Main units along the East wall
        add('fridge', 20.5, fy + 3.0, 3 + mZ, -Math.PI / 2, '#444444');
        add('stove', 20.5, fy + 1.2, 7 + mZ, -Math.PI / 2, '#222222');
        add('sink', 20.5, fy + 1.2, 11 + mZ, -Math.PI / 2, '#ffffff');
        
        // Kitchen Island
        add('cabinet', 18, fy + 1.6, 6 + mZ, -Math.PI / 2, '#222222');
        add('cabinet', 18, fy + 1.6, 10 + mZ, -Math.PI / 2, '#222222');

        // Formal Dining Area (Within East Front Room)
        add('dining_table', 13, fy + 1.2, 8 + mZ, Math.PI / 2, '#4d3227');
        add('chair', 13, fy + 1.0, 4 + mZ, 0, '#333333');
        add('chair', 13, fy + 1.0, 12 + mZ, -Math.PI, '#333333');

        // Executive Office (Middle Back: x -8..8, z -20..0)
        add('bookshelf', 0, fy + 3.0, -17 + mZ, 0, '#3b2f2f');
        add('desk', 0, fy + 1.2, -12 + mZ, 0, '#1a1a1a');
        add('monitor', 0, fy + 3.2, -12 + mZ, 0, '#000000');
        add('chair', 0, fy + 1.0, -14 + mZ, 0, '#333333');
        add('armchair', 5, fy + 1.0, -8 + mZ, -Math.PI/2, '#483c32');

        // Master Retreat (West Back: x -24..-8, z -20..0)
        add('canopy_bed', -16, fy + 2.5, -12 + mZ, 0, '#222222');
        add('tv', -20, fy + 3.0, -1.5 + mZ, Math.PI, '#000000');
        add('lamp', -12, fy + 2.4, -15 + mZ, 0, '#ffffff');

        // Spa Bathroom (East Back: x 8..24, z -20..0)
        add('bathtub', 18, fy + 0.8, -14 + mZ, 0, '#ffffff');
        add('shower', 20, fy + 3.0, -8 + mZ, 0, '#8ed1e0');
        add('vanity', 14, fy + 1.2, -4 + mZ, Math.PI, '#111111');
        add('toilet', 20, fy + 0.8, -16.5 + mZ, 0, '#ffffff');

        // --- Outdoor Oasis ---
        
        // Modern Floating Sun Deck
        for(let x = 8; x <= 32; x += 8) {
           for(let z = 24; z <= 40; z += 8) {
              add('plate_8x8', x + 4, floorY + 0.2, z + 4 + mZ, 0, '#e8e8e8'); // Light grey deck
           }
        }
        
        // Cabinets and Loungers
        add('sofa', 12, fy + 1.0, 31 + mZ, Math.PI, '#ffffff');
        add('sofa', 28, fy + 1.0, 31 + mZ, Math.PI, '#ffffff');
        add('coffee_table', 20, fy + 0.7, 31 + mZ, 0, '#333333');
        add('plant', 12, fy + 1.0, 36 + mZ, 0, '#006400');
        add('plant', 28, fy + 1.0, 36 + mZ, 0, '#006400');

        // Private Helipad (Left side of yard)
        add('cylinder_2x2', -24, floorY + 0.6, 28 + mZ, 0, '#aaaaaa');
        add('cylinder_2x2', -28, floorY + 0.6, 30 + mZ, 0, '#aaaaaa');
        add('cylinder_2x2', -20, floorY + 0.6, 30 + mZ, 0, '#aaaaaa');
        add('cylinder_2x2', -24, floorY + 0.6, 32 + mZ, 0, '#aaaaaa');
        add('plate_8x8', -24, floorY + 1.2, 30 + mZ, 0, '#333333'); // Helipad base
        add('plate_4x4', -24, floorY + 1.6, 30 + mZ, 0, '#FFD1DC'); // Gold 'H' center indicator

        // Vegetation and Topiary Arches along house border
        for (let i = 0; i < 4; i++) {
            add('plant', -28, floorY + 1.0, -20 + i * 16 + mZ, 0, '#006400');
            add('plant', 28, floorY + 1.0, -20 + i * 16 + mZ, 0, '#006400');
            
        }

        // Mansion Exterior Upgrades (Giant glass windows replacing some walls)
        

        add('disco_ball', 0, 8, 10 + mZ, 0, '#ffffff'); 

        // --- Barbie Castle Extension ---
        const cBPink = '#FA31A7'; // Barbie Pink
        const cBLightPink = '#FFB6C1'; // Light Pink
        const cBWhite = '#FFFFFF'; // White
        const cBGold = '#FFD700'; // Gold accents
        const cBMagenta = '#FF00FF';
        const cBWindow = '#87CEEB'; // Light blue for windows
        const cBWater = '#00FFFF'; // Bright cyan for water

        const cz = 120; // Castle Z position (moved from 75)
        const castleFloorY = floorY;

        // Grand Pathway from Mansion to Castle
        for(let z = mZ + 20; z < cz - 24; z += 8) {
          add('plate_8x8', 0, floorY, z + 4, 0, '#FFD1DC'); // Pinkish marble path
          // Path borders
          add('plate_1x8', -4, floorY+0.5, z + 4, 0, cBGold);
          add('plate_1x8', 4, floorY+0.5, z + 4, 0, cBGold);
          if (z % 16 === 4) {
            // Arches over the pathway
            add('cylinder_1x1', -4, floorY + 1.2, z + 4, 0, cBWhite);
            add('cylinder_1x1', -4, floorY + 2.4, z + 4, 0, cBWhite);
            add('cylinder_1x1', 4, floorY + 1.2, z + 4, 0, cBWhite);
            add('cylinder_1x1', 4, floorY + 2.4, z + 4, 0, cBWhite);
            add('plate_1x8', 0, floorY + 3.0, z + 4, Math.PI/2, cBPink);
          }
          add('plant', -8, floorY + 1.0, z + 4, 0, '#FF69B4');
          add('plant', 8, floorY + 1.0, z + 4, 0, '#FF69B4');
          add('lamp', -6, floorY + 1.0, z + 4, 0, cBGold);
          add('lamp', 6, floorY + 1.0, z + 4, 0, cBGold);
        }

        // Expanded Castle Grounds
        for (let x = -48; x < 48; x += 8) {
          for (let z = cz - 24; z < cz + 40; z += 8) {
             add('plate_8x8', x + 4, 0.2, z + 4, 0, cGrass);
          }
        }

        // --- Extravagant Outdoor Area ---
        
        // Massive Multi-Level Heart-Shaped Pool
        add('heart_rug', -20, floorY + 0.1, cz - 10, 0, '#00AEEF'); 
        add('heart_rug', -24, floorY + 0.1, cz - 14, 0, '#00AEEF');
        add('heart_rug', -16, floorY + 0.1, cz - 14, 0, '#00AEEF');
        
        // Pool borders
       

        // Luxury Pool Deck
        for(let x = -36; x < -12; x += 8) {
            for(let z = cz - 24; z < cz - 16; z += 8) {
                add('plate_8x8', x + 4, floorY + 0.2, z + 4, 0, cBWhite);
            }
        }
        add('sofa', -28, floorY + 1.4, cz - 20, Math.PI/2, cBPink);
        add('sofa', -16, floorY + 1.4, cz - 20, -Math.PI/2, cBPink);
        add('coffee_table', -22, floorY + 1.1, cz - 20, 0, cBWhite);
        add('armchair', -22, floorY + 1.4, cz - 23, 0, cBGold);
        add('lamp', -32, floorY + 2.8, cz - 18, 0, cBGold);
        add('lamp', -12, floorY + 2.8, cz - 18, 0, cBGold);
        
        // Outdoor Kitchen & Bar
        add('plate_8x8', -32, floorY + 0.2, cz - 12, 0, '#FFD1DC');
        add('cabinet', -34, floorY + 2.2, cz - 12, Math.PI/2, cBWhite);
        add('fridge', -34, floorY + 3.4, cz - 15, Math.PI/2, cBPink);
        add('stool', -31, floorY + 1.2, cz - 14, 0, cBGold);
        add('stool', -31, floorY + 1.2, cz - 12, 0, cBGold);
        add('stool', -31, floorY + 1.2, cz - 10, 0, cBGold);

        // Grand Fountain Garden (Right Side)
        add('plate_6x6', 24, floorY + 0.2, cz - 12, 0, cBWhite);
        add('cylinder_2x2', 24, floorY + 0.6, cz - 12, 0, cBLightPink);
        add('plate_4x4', 24, floorY + 1.8, cz - 12, 0, cBWhite);
        add('cylinder_1x1', 24, floorY + 2.4, cz - 12, 0, cBWater);
        add('cylinder_1x1', 24, floorY + 3.6, cz - 12, 0, cBWater);
        // Circular garden around fountain
        for(let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
             add('plant', 24 + Math.cos(a)*6, floorY + 1.0, cz - 12 + Math.sin(a)*6, 0, cBPink);
             add('bow_chair', 24 + Math.cos(a + Math.PI/8)*8, floorY + 1.0, cz - 12 + Math.sin(a + Math.PI/8)*8, -a - Math.PI/8 - Math.PI/2, cBGold);
        }

        // --- Castle Architecture ---
        
        // Massive Multi-Tier Foundation
        // Base Tier
        for (let x = -24; x < 24; x += 8) {
          for (let z = cz - 8; z < cz + 24; z += 8) {
             add('plate_8x8', x + 4, castleFloorY, z + 4, 0, cBWhite);
          }
        }
        // Elevated Tier
        const innerFloorY = castleFloorY + 1.2;
        for (let x = -16; x < 16; x += 4) {
          for (let z = cz - 4; z < cz + 20; z += 4) {
             add('plate_4x4', x + 2, innerFloorY, z + 2, 0, '#FFD1DC');
          }
        }
        // Grand Entrance Stairs (Sweeping)
        for(let sx = -4; sx <= 4; sx += 4) {
          add('plate_2x4', sx, castleFloorY + 0.4, cz - 6, 0, cBGold);
          add('plate_2x4', sx, castleFloorY + 0.8, cz - 5, 0, cBGold);
        }

        const buildTower = (tx: number, tz: number, height: number, color: string, roofColor: string) => {
           for(let h = 0; h < height; h++) {
             add('cylinder_2x2', tx, innerFloorY + 0.6 + h * 1.2, tz, 0, color);
           }
           const tTopY = innerFloorY + 0.6 + height * 1.2;
           add('plate_4x4', tx, tTopY + 0.2, tz, 0, cBWhite);
           // Decorative rim
           add('plate_1x4', tx, tTopY + 0.8, tz-2, Math.PI/2, cBGold);
           add('plate_1x4', tx, tTopY + 0.8, tz+2, Math.PI/2, cBGold);
           add('plate_1x4', tx-2, tTopY + 0.8, tz, 0, cBGold);
           add('plate_1x4', tx+2, tTopY + 0.8, tz, 0, cBGold);
           // Pointy Roof (Spires)
           for(let rh = 0; rh < 5; rh++) {
             add('cylinder_1x1', tx, tTopY + 0.6 + rh * 1.2, tz, 0, roofColor);
           }
        };

        // 6 Grand Towers
        buildTower(-18, cz - 4, 16, cBLightPink, cBPink);
        buildTower(18, cz - 4, 16, cBLightPink, cBPink);
        buildTower(-18, cz + 20, 18, cBMagenta, cBPink);
        buildTower(18, cz + 20, 18, cBMagenta, cBPink);
        buildTower(-22, cz + 8, 12, cBWhite, cBGold);
        buildTower(22, cz + 8, 12, cBWhite, cBGold);

        // Core Walls (1st Floor) with Large Glass Windows
        const castleWallH = 14;
        for (let h = 0; h < castleWallH; h++) {
          const y = innerFloorY + 0.6 + h * 1.2 + 0.6;
          // Front Wall with Enormous Arch
          if (h > 6) {
            add('2x8', -10, y, cz - 4, Math.PI/2, cBPink);
            add('2x8', 10, y, cz - 4, Math.PI/2, cBPink);
            if (h === 7 || h === 8) {
              add('2x6', 0, y, cz - 4, Math.PI/2, cBGold); // Arch top
            } else if (h < 12) {
              add('2x6', 0, y, cz - 4, Math.PI/2, cBWindow); // Giant glass window above arch
            } else {
              add('2x6', 0, y, cz - 4, Math.PI/2, cBPink);
            }
          } else {
            add('2x6', -12, y, cz - 4, Math.PI/2, cBPink);
            add('2x6', 12, y, cz - 4, Math.PI/2, cBPink);
          }
          // Back Wall
          for(let x=-16; x<=16; x+=8) {
            if (h > 2 && h < 10) {
                // Windows in back wall
                add('2x4', x, y, cz + 20, Math.PI/2, (x === 0) ? cBWindow : cBLightPink);
                add('2x4', x > 0 ? x-4 : x+4, y, cz + 20, Math.PI/2, cBPink);
            } else {
                add('2x8', x, y, cz + 20, Math.PI/2, cBPink);
            }
          }
          // Side Walls (Flanking)
          for(let tz=cz; tz<=cz+16; tz+=8) {
             if (h > 2 && h < 10 && tz === cz+8) {
                 add('2x8', -20, y, tz, 0, cBWindow);
                 add('2x8', 20, y, tz, 0, cBWindow);
             } else {
                 add('2x8', -20, y, tz, 0, cBPink);
                 add('2x8', 20, y, tz, 0, cBPink);
             }
          }
        }

        // Second Floor Deck
        const secondFloorY = innerFloorY + 0.6 + castleWallH * 1.2 + 0.4;
        for (let x = -24; x < 24; x += 8) {
          for (let z = cz - 4; z < cz + 20; z += 8) {
             add('plate_8x8', x + 4, secondFloorY, z + 4, 0, cBWhite);
          }
        }
        
        // Massive Grand Balcony
        for(let bx = -8; bx <= 8; bx += 8) {
            add('plate_4x8', bx, secondFloorY, cz - 8, Math.PI/2, cBGold);
        }
        // Balcony Railing
        for(let x = -10; x <= 10; x += 4) add('plate_1x4', x, secondFloorY + 0.8, cz - 10, Math.PI/2, cBWhite);
        add('plate_1x4', -12, secondFloorY + 0.8, cz - 8, 0, cBWhite);
        add('plate_1x4', 12, secondFloorY + 0.8, cz - 8, 0, cBWhite);

        // Core Walls (2nd Floor)
        for (let h = 0; h < 10; h++) {
          const y = secondFloorY + 0.6 + h * 1.2 + 0.6;
          // Front
          add('2x8', -12, y, cz - 2, Math.PI/2, cBLightPink);
          add('2x8', 12, y, cz - 2, Math.PI/2, cBLightPink);
          if(h>2 && h<8) {
              add('2x8', 0, y, cz - 2, Math.PI/2, cBWindow); // Giant upper window
          } else {
              add('2x8', 0, y, cz - 2, Math.PI/2, cBLightPink);
          }
          
          // Back & sides reduced
          for(let x=-12; x<=12; x+=8) {
             add('2x8', x, y, cz + 16, Math.PI/2, (h>2 && h<8 && x===0) ? cBWindow : cBLightPink);
          }
          for(let tz=cz+2; tz<=cz+12; tz+=8) {
             add('2x8', -16, y, tz, 0, cBLightPink);
             add('2x8', 16, y, tz, 0, cBLightPink);
          }
        }

        // Third Floor / Roof Terrace
        const thirdFloorY = secondFloorY + 0.6 + 10 * 1.2 + 0.4;
        for (let x = -16; x < 16; x += 8) {
          for (let z = cz - 4; z < cz + 20; z += 8) {
             add('plate_8x8', x + 4, thirdFloorY, z + 4, 0, cBWhite);
          }
        }
        
        // Massive Central Spire (Extravagant!)
        buildTower(0, cz + 8, 30, cBWhite, cBGold);
        
        // Roof Details and Battlements
        for(let x = -14; x <= 14; x += 4) {
          add('plate_1x4', x, thirdFloorY + 0.8, cz - 4, Math.PI/2, cBPink);
          add('plate_1x4', x, thirdFloorY + 0.8, cz + 20, Math.PI/2, cBPink);
        }
        for(let z = cz; z <= cz + 16; z += 4) {
          add('plate_1x4', -18, thirdFloorY + 0.8, z, 0, cBPink);
          add('plate_1x4', 18, thirdFloorY + 0.8, z, 0, cBPink);
        }

        // --- Extravagant Interior Design ---
        const f1Y = innerFloorY + 0.2;
        const f2Y = secondFloorY + 0.2;

        // Ground Floor Grand Foyer
        add('heart_rug', 0, f1Y, cz + 4, 0, cBMagenta);
        add('disco_ball', 0, f1Y + 12.0, cz + 4, 0, '#ffffff'); // Chandelier
        
        // Sweeping Staircases (Spiral to Second Floor)
        const spiralHeight = f2Y - f1Y; // Total height to cover
        const numSteps = Math.ceil(spiralHeight / 0.4); // 0.4 is plate height
        for(let step = 0; step < numSteps; step++) {
            const stepY = f1Y + step * 0.4;
            const angle = step * 0.15;
            const radius = 6;
            // Left sweeping stair
            add('plate_2x4', -12 + Math.cos(angle) * radius, stepY + 0.2, cz + 8 + Math.sin(angle) * radius, -angle, cBGold);
            // Right sweeping stair
            add('plate_2x4', 12 - Math.cos(angle) * radius, stepY + 0.2, cz + 8 + Math.sin(angle) * radius, angle, cBGold);
        }

        // Royal Banquet Hall (Left Wing)
        add('dining_table', -14, f1Y + 1.0, cz + 12, Math.PI/2, cBWhite);
        add('dining_table', -14, f1Y + 1.0, cz + 6, Math.PI/2, cBWhite); // Extended table
        add('bow_chair', -16, f1Y + 1.0, cz + 12, Math.PI/2, cBGold);
        add('bow_chair', -12, f1Y + 1.0, cz + 12, -Math.PI/2, cBGold);
        add('bow_chair', -16, f1Y + 1.0, cz + 6, Math.PI/2, cBGold);
        add('bow_chair', -12, f1Y + 1.0, cz + 6, -Math.PI/2, cBGold);
        add('lamp', -14, f1Y + 4.0, cz + 9, 0, cBGold); // Chandelier over table
        add('cabinet', -18, f1Y + 1.8, cz + 9, Math.PI/2, cBPink);

        // Ultimate Glam Lounge & Pet Area (Right Wing)
        add('sofa', 14, f1Y + 1.0, cz + 6, -Math.PI/2, cBPink);
        add('sofa', 14, f1Y + 1.0, cz + 12, -Math.PI/2, cBPink);
        add('coffee_table', 10, f1Y + 0.7, cz + 9, Math.PI/2, cBWhite);
        add('tv', 18, f1Y + 3.0, cz + 9, Math.PI/2, cBWhite);
        add('rug_6x6', 12, f1Y, cz + 9, 0, '#FFD1DC');
        add('bow_chair', 10, f1Y + 1.2, cz + 4, 0, cBMagenta);
        
        // Second Floor: Dream Master Suite
        add('canopy_bed', 0, f2Y + 2.5, cz + 12, 0, cBMagenta);
        add('heart_rug', 0, f2Y, cz + 6, 0, cBPink);
        
        // Massive Walk-in Closet (Left side of 2nd floor)
        add('clothing_rack', -10, f2Y + 2.0, cz + 14, 0, cBGold);
        add('clothing_rack', -10, f2Y + 2.0, cz + 10, 0, cBGold);
        add('vanity', -14, f2Y + 1.2, cz + 12, Math.PI/2, cBWhite);
        add('stool', -12, f2Y + 0.8, cz + 12, 0, cBPink);
        add('mirror', -14, f2Y + 4.0, cz + 8, Math.PI/2, cBWhite);
        
        // Spa Oasis (Right side of 2nd floor)
        add('bathtub', 12, f2Y + 0.8, cz + 14, Math.PI/2, cBPink);
        add('shower', 14, f2Y + 3.0, cz + 8, 0, '#FFD1DC');
        add('toilet', 14, f2Y + 0.8, cz + 4, 0, cBWhite);
        add('plant', 8, f2Y + 1.0, cz + 14, 0, cBMagenta);
        
        // Second Floor Balcony DJ Party Area
        add('disco_ball', 0, f2Y + 8.0, cz - 6, 0, cBWhite);
        add('record_player', 0, f2Y + 0.5, cz - 6, 0, cBPink);
        add('pouf', -4, f2Y + 0.6, cz - 4, 0, cBWhite);
        add('pouf', 4, f2Y + 0.6, cz - 4, 0, cBWhite);
        add('plant', -8, f2Y + 1.0, cz - 8, 0, cBMagenta);
        add('plant', 8, f2Y + 1.0, cz - 8, 0, cBMagenta);

        // --- Mobile Barbie House ---
        const addMobile = (type: BlockType, x: number, y: number, z: number, rotY: number, color: string) => {
          blocks.push({ id: `mobile_barbie_${idCounter++}`, type, position: [x, y, z], rotation: [0, rotY, 0], color });
        };
        const mbZ = -36; // Center near player spawn [0, 8, -30]
        const cMBPink = '#FA31A7';
        const cMBLightPink = '#FFB6C1';
        const cMBWhite = '#FFFFFF';
        
        // Grass base for mobile
        for (let x = -16; x < 16; x += 8) {
          for (let z = mbZ - 16; z < mbZ + 16; z += 8) {
            addMobile('plate_8x8', x + 4, 0.2, z + 4, 0, cGrass);
          }
        }

        const mbFloorY = 0.6;
        // Floor plate
        for (let x = -8; x < 8; x += 4) {
          for (let z = mbZ - 8; z < mbZ + 8; z += 4) {
            addMobile('plate_4x4', x + 2, mbFloorY, z + 2, 0, '#FFD1DC');
          }
        }
        
        // Walls
        const mbWallH = 5;
        for (let h = 0; h < mbWallH; h++) {
          const y = mbFloorY + 0.2 + h * 1.2 + 0.6;
          // Back Wall
          for(let x=-8; x<8; x+=4) {
             addMobile('2x4', x + 2, y, mbZ - 7, Math.PI/2, cMBPink);
          }
          // Front Wall (with door)
          for(let x=-8; x<8; x+=4) {
             if (h < 3 && (x === -4 || x === 0)) continue; // door gap
             addMobile('2x4', x + 2, y, mbZ + 7, Math.PI/2, cMBPink);
          }
          // Sides
          for(let z=mbZ - 4; z<mbZ + 4; z+=4) {
             addMobile('2x4', -7, y, z + 2, 0, cMBLightPink);
             addMobile('2x4', 7, y, z + 2, 0, cMBLightPink);
          }
          // Close corners
          addMobile('2x2', -7, y, mbZ - 5, 0, cMBWhite);
          addMobile('2x2', 7, y, mbZ - 5, 0, cMBWhite);
          addMobile('2x2', -7, y, mbZ + 5, 0, cMBWhite);
          addMobile('2x2', 7, y, mbZ + 5, 0, cMBWhite);
        }

        // Roof
        const mbRoofY = mbFloorY + 0.2 + mbWallH * 1.2 + 0.2;
        for (let x = -12; x < 12; x += 8) {
          for (let z = mbZ - 12; z < mbZ + 12; z += 8) {
             addMobile('plate_8x8', x + 4, mbRoofY, z + 4, 0, '#FF00FF');
          }
        }

        // Interior Furniture
        const mfY = mbFloorY + 0.2;
        addMobile('bed', -4, mfY + 0.6, mbZ - 4, 0, cMBWhite);
        addMobile('rug_4x4', 0, mfY, mbZ, 0, '#FFB6C1');
        addMobile('tv', -6, mfY + 2.0, mbZ + 4, Math.PI / 2, '#000000');
        addMobile('sofa', 0, mfY + 1.0, mbZ + 4, -Math.PI, cMBPink);
        addMobile('lamp', -6, mfY + 1.0, mbZ - 6, 0, '#FFD700');
        addMobile('coffee_table', 0, mfY + 0.7, mbZ + 2, 0, '#FFFFFF');

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
  isFlying: false,
  mobileMovement: { forward: 0, backward: 0, left: 0, right: 0 },
  setMobileMovement: (movement) => set((state) => ({ 
    mobileMovement: { ...state.mobileMovement, ...movement } 
  })),
  mobileActions: { jump: false, shift: false, rotate: false },
  setMobileAction: (action, value) => set((state) => ({
    mobileActions: { ...state.mobileActions, [action]: value }
  })),
  setIsFlying: (isFlying) => set((state) => ({ isFlying: typeof isFlying === 'function' ? isFlying(state.isFlying) : isFlying })),
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
        blocks: state.blocks
      }),
    }
  )
);
