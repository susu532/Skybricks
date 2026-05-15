import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Palette,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers,
  RotateCcw,
  Eye,
  Rocket,
  Menu,
} from "lucide-react";

export function TutorialOverlay() {
  const {
    hasSeenTutorial,
    setHasSeenTutorial,
    isMobile,
    blocks,
    selectedColor,
    selectedType,
  } = useStore();
  const [step, setStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const initialBlockCount = useRef(blocks.length);
  const initialColor = useRef(selectedColor);
  const initialType = useRef(selectedType);

  // Fallback SDK Check in case Zustand rehydrated before SDK was ready
  useEffect(() => {
    let checked = false;
    const checkSDK = async () => {
      try {
        const cg = (window as any).CrazyGames;
        if (cg && cg.SDK && cg.SDK.data) {
          const val = await cg.SDK.data.getItem("block-builder-storage");
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && parsed.state && parsed.state.hasSeenTutorial) {
              setHasSeenTutorial(true);
            }
          }
        }
      } catch (e) {}
      if (!checked) {
        setIsInitializing(false);
      }
    };
    checkSDK();
    const timer = setTimeout(() => {
      if (isInitializing) setIsInitializing(false);
    }, 1000); // 1s fallback

    return () => {
      checked = true;
      clearTimeout(timer);
    };
  }, [isInitializing, setHasSeenTutorial]);

  // Step listeners
  useEffect(() => {
    if (step === 0.5 || step === 0 || step === 10) {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    }
  }, [step]);

  useEffect(() => {
    if (hasSeenTutorial) return;

    // Step 4: Place
    if (step === 4 && blocks.length > initialBlockCount.current) {
      setStep(5);
      initialBlockCount.current = blocks.length;
    }

    // Step 5: Demolish
    if (step === 5 && blocks.length < initialBlockCount.current) {
      setStep(6);
      initialType.current = useStore.getState().selectedType;
    }

    // Step 6: Change Type
    if (step === 6 && selectedType !== initialType.current) {
      setStep(7);
    }

    // Step 8: Paint
    if (step === 8 && selectedColor !== initialColor.current) {
      setStep(9);
    }
  }, [blocks.length, selectedColor, selectedType, step, hasSeenTutorial]);

  // Keyboard/Touch Listeners
  useEffect(() => {
    if (hasSeenTutorial) return;

    let lookAmount = 0;
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (step === 1) {
        if (!isMobile && !document.pointerLockElement) return;

        let dx = 0,
          dy = 0;
        if (e instanceof MouseEvent) {
          dx = e.movementX;
          dy = e.movementY;
        } else if (e.touches && e.changedTouches) {
          // just approximate for mobile if they are doing any touchmove
          dx = 10;
          dy = 10;
        }
        lookAmount += Math.abs(dx) + Math.abs(dy);
        if (lookAmount > 500) {
          setStep(2);
        }
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      // Step 2: Move (WASD)
      if (
        step === 2 &&
        ["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)
      ) {
        setStep(3);
      }
      // Step 3: Fly (Space/Shift)
      if (step === 3 && [" ", "Shift"].includes(e.key)) {
        setStep(4);
        initialBlockCount.current = useStore.getState().blocks.length;
      }
      // Step 7: Rotate (R)
      if (step === 7 && (e.key === "r" || e.key === "R")) {
        setStep(8);
        initialColor.current = useStore.getState().selectedColor;
      }
      // Step 9: Menu (ESC) handled by pointerlockchange below if possible, but fallback here
      if (step === 9 && e.key === "Escape") {
        setStep(10);
      }
    };

    const handlePointerLock = () => {
      if (step === 9 && !document.pointerLockElement && !isMobile) {
        setStep(10);
      }
    };

    // For mobile menu button open
    const handleMobileMenu = () => {
      if (step === 9 && isMobile) {
        setStep(10);
      }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    document.addEventListener("pointerlockchange", handlePointerLock);
    window.addEventListener("mobile-menu-opened", handleMobileMenu);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("pointerlockchange", handlePointerLock);
      window.removeEventListener("mobile-menu-opened", handleMobileMenu);
    };
  }, [step, hasSeenTutorial, isMobile]);

  if (isInitializing) return null;
  if (hasSeenTutorial) return null;

  const stepsInfo = [
    {
      id: 0,
      title: "Welcome to SkyBricks",
      description: "Let's learn how to build your world.",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500",
      border: "border-amber-500",
    },
    {
      id: 1,
      title: "Look Around",
      description: isMobile
        ? "Drag on the screen to look around"
        : "Move your mouse to look around",
      icon: Eye,
      color: "text-sky-500",
      bg: "bg-sky-500",
      border: "border-sky-500",
    },
    {
      id: 2,
      title: "Move",
      description: isMobile
        ? "Use the left joystick to move"
        : "Use W, A, S, D to walk",
      icon: Gamepad2,
      color: "text-blue-500",
      bg: "bg-blue-500",
      border: "border-blue-500",
    },
    {
      id: 3,
      title: "Fly",
      description: isMobile
        ? "Tap the UP/DOWN arrows"
        : "Use Space to fly, Shift to descend",
      icon: Rocket,
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500",
      border: "border-fuchsia-500",
    },
    {
      id: 4,
      title: "Place Brick",
      description: isMobile
        ? "Tap the pink + button to place"
        : "Click to place a brick",
      icon: Plus,
      color: "text-pink-500",
      bg: "bg-pink-500",
      border: "border-pink-500",
    },
    {
      id: 5,
      title: "Demolish",
      description: isMobile
        ? "Tap the red trash button"
        : "Right click a brick to delete it",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-500",
      border: "border-red-500",
    },
    {
      id: 6,
      title: "Shape",
      description: isMobile
        ? "Swipe the menu to change shape"
        : "Scroll wheel to cycle shapes",
      icon: Layers,
      color: "text-indigo-500",
      bg: "bg-indigo-500",
      border: "border-indigo-500",
    },
    {
      id: 7,
      title: "Rotate",
      description: isMobile
        ? "Tap the rotate button to spin"
        : "Press 'R' to rotate",
      icon: RotateCcw,
      color: "text-teal-500",
      bg: "bg-teal-500",
      border: "border-teal-500",
    },
    {
      id: 8,
      title: "Paint Brick",
      description: isMobile
        ? "Tap the color palette to paint"
        : "Use Arrow Keys to change color",
      icon: Palette,
      color: "text-violet-500",
      bg: "bg-violet-500",
      border: "border-violet-500",
    },
    {
      id: 9,
      title: "Pause / Menu",
      description: isMobile
        ? "Tap the top-right menu button"
        : "Press 'ESC' to pause the game",
      icon: Menu,
      color: "text-slate-500",
      bg: "bg-slate-500",
      border: "border-slate-500",
    },
    {
      id: 10,
      title: "Master Builder!",
      description: "You are ready to create your dreams.",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500",
      border: "border-emerald-500",
    },
  ];

  const currentStep = stepsInfo[step] || stepsInfo[0];
  const Icon = currentStep.icon;

  const requestLock = () => {
    if (!isMobile) {
      document.body.requestPointerLock();
    }
  };

  const handleGameplayStart = () => {
    try {
      const cg = (window as any).CrazyGames;
      if (
        cg &&
        cg.SDK &&
        cg.SDK.game &&
        typeof cg.SDK.game.gameplayStart === "function"
      ) {
        cg.SDK.game.gameplayStart();
      }
    } catch (e) {}
  };

  return (
    <AnimatePresence mode="wait">
      {step === 0.5 ? (
        <motion.div
          key="modal-quality"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 pointer-events-auto"
        >
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-[400px] w-full p-8 text-center flex flex-col items-center relative overflow-hidden border border-white/50">
            <div className="absolute top-0 left-0 w-full h-3 bg-fuchsia-500 opacity-90" />
            <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 bg-slate-50 shadow-inner border border-slate-100 text-fuchsia-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-fuchsia-500 opacity-10" />
              <Sparkles className="w-12 h-12 relative z-10" strokeWidth={2.5} />
            </div>
            <h2
              className="text-3xl font-black tracking-tight text-slate-900 mb-2"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Enable Ultra-Quality?
            </h2>
            <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed max-w-[320px]">
              You can change it later in menu section if you want better fps.
            </p>
            <div className="flex w-full gap-4">
              <button
                onClick={() => {
                  useStore.setState({ performanceMode: true });
                  setStep(1);
                  requestLock();
                  handleGameplayStart();
                }}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-bold hover:bg-slate-200 active:scale-95 transition-all shadow-md"
              >
                No
              </button>
              <button
                onClick={() => {
                  useStore.setState({ performanceMode: false });
                  setStep(1);
                  requestLock();
                  handleGameplayStart();
                }}
                className="flex-1 py-4 bg-fuchsia-500 text-white rounded-[1.5rem] font-bold hover:bg-fuchsia-600 active:scale-95 transition-all shadow-xl shadow-fuchsia-500/30"
              >
                Yes
              </button>
            </div>
          </div>
        </motion.div>
      ) : step === 0 || step === 10 ? (
        <motion.div
          key={`modal-${step}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40  p-4 pointer-events-auto"
        >
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-[360px] w-full p-8 text-center flex flex-col items-center relative overflow-hidden border border-white/50">
            <div
              className={`absolute top-0 left-0 w-full h-3 ${currentStep.bg} opacity-90`}
            />

            <div
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 bg-slate-50 shadow-inner border border-slate-100 ${currentStep.color} relative overflow-hidden group`}
            >
              <div
                className={`absolute inset-0 ${currentStep.bg} opacity-10`}
              />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <Icon className="w-12 h-12 relative z-10" strokeWidth={2.5} />
              </motion.div>
            </div>

            <h2
              className="text-3xl font-black tracking-tight text-slate-900 mb-2"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {currentStep.title}
            </h2>
            <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed max-w-[280px]">
              {currentStep.description}
            </p>

            <button
              onClick={(e) => {
                if (step === 0) {
                  handleGameplayStart();
                  setStep(0.5);
                  initialBlockCount.current = useStore.getState().blocks.length;
                  initialColor.current = useStore.getState().selectedColor;
                  initialType.current = useStore.getState().selectedType;
                } else {
                  setHasSeenTutorial(true);
                  requestLock();
                }
              }}
              className={`flex items-center gap-2 px-8 py-4 ${currentStep.bg} text-white rounded-[1.5rem] font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-current/20 w-full justify-center group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">
                {step === 0 ? "Start Tutorial" : "Finish Tutorial"}
              </span>
              {step === 0 && (
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={`pill-${step}`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-8 sm:top-10 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
        >
          <div
            className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm w-full relative overflow-hidden"
            style={{ color: "inherit" }}
          >
            {/* Soft pulsing background glow */}
            <motion.div
              className={`absolute inset-0 opacity-5 ${currentStep.bg}`}
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />

            <div
              className={`shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center ${currentStep.bg} text-white shadow-inner relative z-10`}
            >
              <Icon className="w-6 h-6" strokeWidth={2.5} />
            </div>

            <div className="flex-1 font-sans relative z-10 pt-0.5">
              <div
                className={`text-[10px] font-black tracking-widest uppercase ${currentStep.color} mb-0.5`}
              >
                Step {step} of 9
              </div>
              <h3 className="text-slate-900 font-bold text-[15px] leading-tight">
                {currentStep.title}
              </h3>
              <p className="text-slate-500 text-sm mt-0.5 font-medium leading-tight">
                {currentStep.description}
              </p>
            </div>

            <motion.div
              className={`w-8 h-8 rounded-full border-2 ${currentStep.border} bg-white flex items-center justify-center shrink-0 relative z-10 shadow-sm`}
              animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div
                className={`w-3 h-3 rounded-full ${currentStep.bg} shadow-inherit`}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
