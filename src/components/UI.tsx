import { Download, Globe, Undo2, Redo2, Upload, Crosshair, Zap, ZapOff, Armchair, Square, BedDouble, Table, Flower2, Monitor, Lamp, Archive, Library, Tv, Bath, Refrigerator, Microwave, Droplet, Heart, Shirt, Circle, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerRightUp, Plus, Lock, Trash2 } from 'lucide-react';
import { useStore, BlockType, BLOCK_DIMENSIONS } from '../store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playSelectSound } from '../audio';

const COLORS = [
  { name: 'Ballet Pink', hex: '#FFD1DC' },
  { name: 'Barbie Pink', hex: '#E0218A' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Neon Pink', hex: '#FF1493' },
  { name: 'Bubblegum', hex: '#FFC1CC' },
  { name: 'Fuchsia', hex: '#FF00FF' },
  { name: 'Magenta', hex: '#FF0090' },
  { name: 'Cotton Candy', hex: '#FFBCD9' },
  { name: 'Watermelon', hex: '#FC6C85' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Peach', hex: '#FFCBA4' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Mint Macaron', hex: '#A2E4B8' },
  { name: 'Mint Green', hex: '#98FF98' },
  { name: 'Seafoam', hex: '#9FE2BF' },
  { name: 'Powder Blue', hex: '#B0E0E6' },
  { name: 'Electric Lilac', hex: '#B026FF' },
  { name: 'Periwinkle', hex: '#CCCCFF' },
  { name: 'Lavender Dream', hex: '#E6E6FA' },
  { name: 'Lilac', hex: '#C8A2C8' },
  { name: 'Lemon Chiffon', hex: '#FFFACD' },
  { name: 'Zesty Yellow', hex: '#FFF44F' },
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Classic Red', hex: '#C91A09' },
  { name: 'Bright Red', hex: '#FF3333' },
  { name: 'Dark Red', hex: '#7B201A' },
  { name: 'Orange', hex: '#F2703E' },
  { name: 'Bright Yellow', hex: '#F2CD37' },
  { name: 'Warm Gold', hex: '#D7A755' },
  { name: 'Dark Green', hex: '#184632' },
  { name: 'Olive Green', hex: '#9B9A5A' },
  { name: 'Lime', hex: '#AEEA00' },
  { name: 'Classic Blue', hex: '#0055BF' },
  { name: 'Dark Blue', hex: '#0A3463' },
  { name: 'Medium Blue', hex: '#5A93DB' },
  { name: 'Light Blue', hex: '#A6C9E2' },
  { name: 'Turquoise', hex: '#40A391' },
  { name: 'Dark Purple', hex: '#3C2068' },
  { name: 'Medium Purple', hex: '#873B8F' },
  { name: 'Black', hex: '#05131D' },
  { name: 'Dark Grey', hex: '#545955' },
  { name: 'Light Grey', hex: '#9BA19D' },
  { name: 'Tan', hex: '#E4CD9E' },
  { name: 'Dark Tan', hex: '#958A73' },
  { name: 'Brown', hex: '#582A12' }
];

const TYPES: { type: BlockType; label: string }[] = [
  { type: '1x1', label: '1x1' },
  { type: '1x2', label: '1x2' },
  { type: '1x3', label: '1x3' },
  { type: '1x4', label: '1x4' },
  { type: '1x6', label: '1x6' },
  { type: '1x8', label: '1x8' },
  { type: '2x2', label: '2x2' },
  { type: '2x3', label: '2x3' },
  { type: '2x4', label: '2x4' },
  { type: '2x6', label: '2x6' },
  { type: '2x8', label: '2x8' },
  { type: 'plate_1x1', label: 'P 1x1' },
  { type: 'plate_1x2', label: 'P 1x2' },
  { type: 'plate_1x3', label: 'P 1x3' },
  { type: 'plate_1x4', label: 'P 1x4' },
  { type: 'plate_1x6', label: 'P 1x6' },
  { type: 'plate_1x8', label: 'P 1x8' },
  { type: 'plate_2x2', label: 'P 2x2' },
  { type: 'plate_2x3', label: 'P 2x3' },
  { type: 'plate_2x4', label: 'P 2x4' },
  { type: 'plate_2x6', label: 'P 2x6' },
  { type: 'plate_2x8', label: 'P 2x8' },
  { type: 'plate_4x4', label: 'P 4x4' },
  { type: 'plate_4x8', label: 'P 4x8' },
  { type: 'plate_6x6', label: 'P 6x6' },
  { type: 'plate_8x8', label: 'P 8x8' },
  { type: 'cylinder_1x1', label: 'C 1x1' },
  { type: 'cylinder_2x2', label: 'C 2x2' },
  { type: 'chair', label: 'Chair' },
  { type: 'table', label: 'Table' },
  { type: 'bed', label: 'Bed' },
  { type: 'plant', label: 'Plant' },
  { type: 'rug_4x4', label: 'Rug 4x4' },
  { type: 'rug_6x6', label: 'Rug 6x6' },
  { type: 'sofa', label: 'Sofa' },
  { type: 'desk', label: 'Desk' },
  { type: 'monitor', label: 'Monitor' },
  { type: 'lamp', label: 'Lamp' },
  { type: 'cabinet', label: 'Cabinet' },
  { type: 'bookshelf', label: 'Bookshelf' },
  { type: 'tv', label: 'TV' },
  { type: 'toilet', label: 'Toilet' },
  { type: 'bathtub', label: 'Bathtub' },
  { type: 'fridge', label: 'Fridge' },
  { type: 'stove', label: 'Stove' },
  { type: 'sink', label: 'Sink' },
  { type: 'washer', label: 'Washer' },
  { type: 'dining_table', label: 'Din. Table' },
  { type: 'coffee_table', label: 'Coff. Table' },
  { type: 'armchair', label: 'Armchair' },
  { type: 'shower', label: 'Shower' },
  { type: 'vanity', label: 'Vanity Mkp' },
  { type: 'mirror', label: 'Mirror' },
  { type: 'stool', label: 'Stool' },
  { type: 'pouf', label: 'Pouf' },
  { type: 'heart_rug', label: 'Heart Rug' },
  { type: 'canopy_bed', label: 'Canopy Bed' },
  { type: 'clothing_rack', label: 'Clothes Rack' },
  { type: 'bow_chair', label: 'Bow Chair' },
  { type: 'record_player', label: 'Vinyl Player' },
  { type: 'disco_ball', label: 'Disco Ball' },
];

function isFurniture(type: BlockType): boolean {
  const d = BLOCK_DIMENSIONS[type] || { w: 1, d: 1 };
  return !!d.shape && d.shape !== 'brick' && d.shape !== 'cylinder';
}

function ModelIcon({ type, selected }: { type: BlockType, selected: boolean }) {
  const d = BLOCK_DIMENSIONS[type] || { w: 1, d: 1 };
  const isPlate = d.isPlate || false;
  const w = d.w;
  const depth = d.d;
  const shape = d.shape || 'brick';

  if (shape && shape !== 'brick' && shape !== 'cylinder') {
    const iconClass = `w-8 h-8 ${selected ? 'text-pink-600' : 'text-slate-400'}`;
    let Icon = Square;
    
    switch (shape) {
      case 'chair':
      case 'armchair':
      case 'stool':
      case 'pouf':
      case 'bow_chair':
      case 'sofa': Icon = Armchair; break;
      case 'bed': 
      case 'canopy_bed': Icon = BedDouble; break;
      case 'table':
      case 'dining_table':
      case 'coffee_table':
      case 'vanity':
      case 'desk': Icon = Table; break;
      case 'plant': Icon = Flower2; break;
      case 'rug': Icon = Square; break;
      case 'heart_rug': Icon = Heart; break;
      case 'clothing_rack': Icon = Shirt; break;
      case 'record_player': Icon = Circle; break;
      case 'disco_ball': Icon = Globe; break;
      case 'monitor':
      case 'mirror': Icon = Monitor; break;
      case 'lamp': Icon = Lamp; break;
      case 'cabinet': Icon = Archive; break;
      case 'bookshelf': Icon = Library; break;
      case 'tv': Icon = Tv; break;
      case 'bathtub':
      case 'shower':
      case 'sink': Icon = Bath; break;
      case 'fridge': Icon = Refrigerator; break;
      case 'stove':
      case 'washer': Icon = Microwave; break;
      case 'toilet': Icon = Droplet; break;
    }

    return (
      <div className="w-full h-full pointer-events-none flex items-center justify-center">
        <Icon className={iconClass} strokeWidth={selected ? 2.5 : 1.5} />
      </div>
    );
  }

  return (
    <div className="w-full h-full pointer-events-none flex flex-col justify-center items-center drop-shadow-sm mt-1">
      <div 
        className="grid gap-[1px]"
        style={{ 
          gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`, 
          transform: 'rotateX(55deg) rotateZ(45deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {Array.from({ length: w * depth }).map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full relative ${selected ? 'bg-pink-400' : 'bg-slate-300'}`}
            style={{ 
              boxShadow: `0px 2px 0px 0px ${selected ? '#be185d' : '#94a3b8'}`,
            }}
          ></div>
        ))}
      </div>
      <div 
        className={`rounded-sm mt-1 mb-1 transition-colors ${selected ? 'bg-pink-500' : 'bg-slate-400'}`} 
        style={{ 
          width: `${Math.max(w, depth) * 6}px`, 
          height: isPlate ? '3px' : '8px' 
        }} 
      />
    </div>
  );
}

export function UI() {
  const {
    selectedColor,
    setColor,
    selectedType,
    setType,
    performanceMode,
    togglePerformanceMode,
    clearBlocks,
    blocks,
    history,
    redoStack,
    undo,
    redo,
    setBlocks,
    isMobile,
    furnitureUnlocked,
    unlockFurniture
  } = useStore();

  const [hasPointerLock, setHasPointerLock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleLockChange = () => {
      setHasPointerLock(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasPointerLock) return;
      
      const key = e.key;

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        const ITEMS_PER_ROW = 18; // Approximate items per row given max-w-4xl and button sizes
        const index = COLORS.findIndex(c => c.hex === selectedColor);
        if (index === -1) return;

        let nextIndex;
        if (key === 'ArrowDown') {
          nextIndex = (index + ITEMS_PER_ROW) % COLORS.length;
        } else {
          nextIndex = (index - ITEMS_PER_ROW + COLORS.length) % COLORS.length;
        }
        
        setColor(COLORS[nextIndex].hex);
        playSelectSound();
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Number keys 1-7 for types
      const typeIndex = parseInt(key) - 1;
      if (typeIndex >= 0 && typeIndex < TYPES.length) {
         const targetType = TYPES[typeIndex].type;
         if (isFurniture(targetType) && !useStore.getState().furnitureUnlocked) {
             // skip locked via hotkey
         } else {
             setType(targetType);
             playSelectSound();
         }
      }
      
      // We can use Shift + 1-9 for colors
      if (e.shiftKey) {
        const colorIndex = parseInt(key) - 1;
        if (colorIndex >= 0 && colorIndex < COLORS.length) {
            setColor(COLORS[colorIndex].hex);
            playSelectSound();
        }
      }

      // Alternate colors with arrows
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        const currentColorIndex = COLORS.findIndex(c => c.hex === useStore.getState().selectedColor);
        if (currentColorIndex !== -1) {
            let nextIndex = currentColorIndex + (key === 'ArrowRight' ? 1 : -1);
            if (nextIndex >= COLORS.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = COLORS.length - 1;
            setColor(COLORS[nextIndex].hex);
            playSelectSound();
        }
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (!hasPointerLock) return;
      
      const currentIndex = TYPES.findIndex(t => t.type === useStore.getState().selectedType);
      if (currentIndex === -1) return;
      
      const direction = e.deltaY > 0 ? 1 : -1;
      let nextIndex = currentIndex;
      let found = false;
      const isUnlocked = useStore.getState().furnitureUnlocked;

      for (let i = 0; i < TYPES.length; i++) {
          nextIndex = nextIndex + direction;
          if (nextIndex >= TYPES.length) nextIndex = 0;
          if (nextIndex < 0) nextIndex = TYPES.length - 1;
          
          if (!isFurniture(TYPES[nextIndex].type) || isUnlocked) {
              found = true;
              break;
          }
      }
      
      if (found) {
        setType(TYPES[nextIndex].type);
        playSelectSound();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('wheel', handleWheel);
    };
  }, [hasPointerLock, setType, setColor, undo, redo, selectedColor]);

  const handleSave = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "skybricks_save.json");
    dlAnchorElem.click();
  }, [blocks]);

  const handleLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
        }
      } catch (err) {
        console.error("Failed to load save file", err);
        alert("Invalid save file");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, [setBlocks]);

  const handleUnlockFurniture = () => {
    try {
        const cg = (window as any).CrazyGames;
        if (cg && cg.SDK && cg.SDK.ad && cg.SDK.ad.requestAd) {
            const callbacks = {
                adStarted: () => console.log('Ad started'),
                adFinished: () => {
                    console.log('Ad finished');
                    unlockFurniture();
                    playSelectSound();
                },
                adError: (error: any) => {
                    console.error('Ad error', error);
                    unlockFurniture();
                    playSelectSound();
                }
            };
            cg.SDK.ad.requestAd('rewarded', callbacks);
        } else {
            unlockFurniture();
            playSelectSound();
        }
    } catch (e) {
        unlockFurniture();
        playSelectSound();
    }
  };

  const handleTypeSelect = (type: BlockType) => {
    if (isFurniture(type) && !furnitureUnlocked) {
        return;
    }
    setType(type);
    playSelectSound();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between overflow-hidden font-sans">
      
      {/* Starting Overlay if not locked */}
      {(!hasPointerLock && !isMobile) && (
        <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-center z-[60] p-4 transition-opacity animate-in fade-in slide-in-from-top-4 duration-300">
          <button 
            onClick={() => document.body.requestPointerLock()}
            className="bg-white/95 backdrop-blur-md text-pink-500 font-bold py-3 px-6 sm:px-8 rounded-full shadow-lg border border-pink-100 transition-all hover:scale-105 active:scale-95 text-lg sm:text-xl tracking-tight pointer-events-auto"
          >
            Click here to resume
          </button>
        </div>
      )}

      {/* Crosshair */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 mix-blend-difference pointer-events-none z-30 transition-opacity ${(!hasPointerLock && !isMobile) ? 'hidden' : ''}`}>
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
      </div>

      {/* Header/Title and Save/Load (Only visible when unlocked) */}
      <div className={`flex flex-col h-full justify-between transition-transform duration-300 z-50 relative ${(hasPointerLock && !isMobile) ? '-translate-y-full opacity-0 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-start p-2 sm:p-6 pointer-events-none">
            {/* Title */}
            <div className="font-black text-3xl sm:text-4xl tracking-tighter drop-shadow-md flex items-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <span className="text-[#5FA6FF]">Sky</span><span className="text-[#FA31A7]">Bricks</span>
            </div>
            {/* Right Corner Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 items-end pointer-events-auto">
                {!furnitureUnlocked && (
                    <button 
                        onClick={handleUnlockFurniture}
                        className="group relative flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full shadow-[0_0_20px_rgba(217,70,239,0.4)] border border-white/20 transition-all hover:scale-105 active:scale-95 animate-pulse hover:animate-none"
                    >
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white shadow-sm" />
                        <span className="font-extrabold text-xs sm:text-base tracking-wide flex items-center gap-1 text-shadow-sm">
                            Unlock Furniture
                        </span>
                    </button>
                )}
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-end max-w-[120px] sm:max-w-none">
                    <button 
                        onClick={() => { togglePerformanceMode(); playSelectSound(); }} 
                        className={`p-2 sm:p-3 rounded-full shadow-lg border transition-all flex items-center justify-center ${performanceMode ? 'bg-amber-100/90 text-amber-600 border-amber-200' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100'}`}
                        title={performanceMode ? "Disable Performance Mode" : "Enable Performance Mode (Low Graphics)"}
                    >
                        {performanceMode ? <ZapOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleLoad} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg border border-slate-100 transition-all" title="Load Model">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={handleSave} className="p-2 sm:p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg border border-slate-100 transition-all" title="Save Model">
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Left Sidebar (Bricks) - Visible when locked but fades out slightly */}
      <div className={`absolute left-0 top-[45%] sm:top-1/2 -translate-y-1/2 p-2 sm:p-6 transition-all duration-300 z-40 ${hasPointerLock ? 'opacity-40 pointer-events-none translate-x-0' : 'translate-x-0 pointer-events-auto'} max-h-[50vh] sm:h-[90vh]`}>
        <div className="bg-white/80 backdrop-blur-xl p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col gap-2 max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto touch-pan-y pr-1 -mr-1 space-y-1 sm:space-y-2 hide-scrollbar scroll-smooth">
              {TYPES.map((t, index) => (
                  <button
                  key={t.type}
                  ref={(el) => {
                    if (el && selectedType === t.type) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  onClick={() => handleTypeSelect(t.type)}
                  className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all ${
                      selectedType === t.type
                      ? 'bg-white shadow-lg border border-pink-100'
                      : 'bg-transparent hover:bg-white/40'
                  }`}
                  title={t.label}
                  >
                  <span className="absolute top-1 left-1.5 text-[0.4rem] sm:text-[0.5rem] opacity-30 font-mono z-20 pointer-events-none">{index + 1}</span>
                  {isFurniture(t.type) && !useStore.getState().furnitureUnlocked && (
                    <Lock className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3 h-3 sm:w-4 sm:h-4 text-slate-400 opacity-60 pointer-events-none" />
                  )}
                  <div className="scale-75 sm:scale-100 flex items-center justify-center w-full h-full">
                     <ModelIcon type={t.type} selected={selectedType === t.type} />
                  </div>
                  </button>
              ))}
            </div>
        </div>
      </div>

      {/* Bottom Action Bar (Hotbar) */}
      <div className={`absolute bottom-0 left-0 right-0 pointer-events-auto flex flex-col items-center w-full pb-2 md:pb-6 transition-transform duration-300 z-[55] origin-bottom ${hasPointerLock ? 'opacity-80 scale-[0.80] sm:scale-95 pointer-events-none' : ''}`}>
        
        {/* Color Hotbar */}
        <div className="bg-white/80 backdrop-blur-xl p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 flex items-center gap-1 mb-2 sm:mb-4 mx-2 sm:mx-4 max-w-full overflow-hidden">
          <div className="flex overflow-x-auto touch-pan-x hide-scrollbar sm:flex-wrap items-center sm:justify-center gap-2 sm:gap-2 px-1 max-w-[90vw] sm:max-w-4xl py-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => { setColor(c.hex); playSelectSound(); }}
                className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 sm:border-2 transition-transform shadow-sm ${
                  selectedColor === c.hex ? 'border-white scale-125 sm:scale-110 shadow-md ring-1 sm:ring-2 ring-black z-10' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Action controls */}
        <div className="bg-white/90 backdrop-blur-xl p-1.5 sm:p-2 rounded-full shadow-2xl border border-white/50 flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-slate-100/50 rounded-full">
            <button
              onClick={() => undo()}
              disabled={history.length === 0}
              className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all ${
                history.length === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400' 
                  : 'bg-white text-rose-500 shadow-sm hover:scale-105 active:scale-95'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => redo()}
              disabled={redoStack.length === 0}
              className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all ${
                redoStack.length === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400' 
                  : 'bg-white text-emerald-500 shadow-sm hover:scale-105 active:scale-95'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
        </div>
      </div>

      {/* Shortcuts Reminder */}
      <div className={`absolute bottom-6 right-6 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-xl transition-opacity duration-300 z-40 hidden md:block ${isMobile ? '!hidden' : ''} ${hasPointerLock ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex justify-between gap-8">
            <span>Place</span>
            <span className="text-pink-500">LMB</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Delete</span>
            <span className="text-pink-500">RMB</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Rotate</span>
            <span className="text-pink-500">R</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Cycle Brick</span>
            <span className="text-pink-500">Scroll</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Flying</span>
            <span className="text-pink-500">Space x2</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Undo</span>
            <span className="text-pink-500">Ctrl+Z</span>
          </div>
             <div className="flex justify-between gap-8">
            <span>Re Undo</span>
            <span className="text-pink-500">Ctrl+Y</span>
          </div>
        </div>
      </div>

      {/* Mobile Controls Overlay */}
      <div className={`absolute inset-x-0 bottom-32 sm:bottom-32 z-40 flex justify-between px-4 sm:px-6 pointer-events-none transition-opacity ${!isMobile ? 'hidden' : ''}`}>
          {/* Movement D-pad */}
          <div className="pointer-events-auto grid grid-cols-3 gap-1.5 sm:gap-2 w-36 h-36 sm:w-40 sm:h-40 opacity-70">
              <div />
              <button 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW' }))}}
                  onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', code: 'KeyW' }))}}
                  onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', code: 'KeyW' }))}}
                  className="bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md touch-none">
                  <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
              </button>
              <div />
              <button 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }))}}
                  onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' }))}}
                  onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' }))}}
                  className="bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md touch-none">
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
              </button>
              <button 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS' }))}}
                  onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 's', code: 'KeyS' }))}}
                  onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 's', code: 'KeyS' }))}}
                  className="bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md touch-none">
                  <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
              </button>
              <button 
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD' }))}}
                  onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD' }))}}
                  onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD' }))}}
                  className="bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md touch-none">
                  <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
              </button>
          </div>

          {/* Action buttons */}
          <div className="pointer-events-auto flex flex-col gap-2 sm:gap-3 items-end">
              <div className="flex flex-col gap-2">
                 <button 
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }))}}
                      onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space' }))}}
                      onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space' }))}}
                      className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md opacity-70 touch-none">
                      <ArrowUp className="w-6 h-6 text-slate-700" />
                  </button>
                 <button 
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }))}}
                      onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftLeft' }))}}
                      onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftLeft' }))}}
                      className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md opacity-70 mb-2 touch-none">
                      <ArrowDown className="w-6 h-6 text-slate-700" />
                  </button>
              </div>
              <div className="flex gap-2">
                 <button 
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR' }))}}
                      onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r', code: 'KeyR' }))}}
                      onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'r', code: 'KeyR' }))}}
                      className="w-14 h-14 sm:w-16 sm:h-16 bg-white/80 rounded-full flex items-center justify-center active:bg-pink-100 shadow-md opacity-80 touch-none">
                      <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
                  </button>
                  <button 
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('mobile-delete')) }}
                      className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-400/90 rounded-full flex items-center justify-center active:bg-rose-500 shadow-md text-white opacity-90 touch-none">
                      <Trash2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
              </div>
              <div className="flex gap-2">
                  <button 
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('mobile-place')) }}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-400/90 rounded-full flex items-center justify-center active:bg-pink-500 shadow-lg text-white touch-none">
                      <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
                  </button>
              </div>
          </div>
      </div>

    </div>
  );
}
