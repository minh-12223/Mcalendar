import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Sparkles,
  Edit2,
  Check,
  X,
  Heart,
  Utensils,
  Gamepad2,
  Zap,
  Star,
  Diamond,
} from "lucide-react";
import { type PetState } from "../../types.js";

// --- IMPORT THƯ VIỆN LẬP TRÌNH ĐỒ HỌA 3D ---
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { useAuth } from "../../hooks/useAuth.js";

const PET_CONFIGS: Record<
  string,
  { scale: number; positionY: number; positionZ: number; rotationY?: number }
> = {
  "egg.glb": {
    scale: 0.8,
    positionY: -0.2,
    positionZ: -2.6,
    rotationY: 0,
  },
  "pikachu_baby.glb": {
    scale: 0.007,
    positionY: 0.75,
    positionZ: -2.6,
    rotationY: -Math.PI / 2,
  },
  "squirtle_baby.glb": {
    scale: 0.05,
    positionY: -1.2,
    positionZ: 0,
  },
  "eevee_baby.glb": {
    scale: 0.3,
    positionY: -2.0,
    positionZ: 0.5,
  },
  "bulbasaur_baby.glb": {
    scale: 0.2,
    positionY: -1.5,
    positionZ: 0,
  },
};

interface PetTabProps {
  diamonds: number;
  onUpdateDiamonds: (amount: number) => void;
}

const PetTab: React.FC<PetTabProps> = ({ diamonds, onUpdateDiamonds }) => {
  const syncDataStructureToCloud = (key: string, data: any) => {};

  const BackgroundModel3D = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    const bgRef = React.useRef<any>();
    return (
      <primitive ref={bgRef} object={scene} scale={1} position={[0, -2, -3]} />
    );
  };

  const PetModel3D = ({ url, status }: { url: string; status: string }) => {
    const { scene, animations } = useGLTF(url);
    const modelRef = React.useRef<any>();
    const { actions, names } = useAnimations(animations, scene);

    const fileName = url.split("/").pop() || "";
    const petConfig = PET_CONFIGS[fileName] || {
      scale: 0.2,
      positionY: -1.2,
      positionZ: 0,
      rotationY: 0,
    };

    useFrame((state) => {
      if (!modelRef.current) return;
      const time = state.clock.getElapsedTime();

      if (names && names.length > 0) return;

      if (status === "SLEEPING") {
        const breathe = 1 + Math.sin(time * 2) * 0.03;
        modelRef.current.scale.set(
          breathe * petConfig.scale,
          breathe * petConfig.scale,
          breathe * petConfig.scale,
        );
        modelRef.current.position.y = petConfig.positionY;
      } else if (status === "SAD" || status === "HUNGRY") {
        modelRef.current.rotation.z = Math.sin(time * 3) * 0.05;
        modelRef.current.position.y = petConfig.positionY;
      } else {
        modelRef.current.position.y =
          petConfig.positionY + Math.sin(time * 3.5) * 0.1;
        modelRef.current.scale.set(
          petConfig.scale,
          petConfig.scale,
          petConfig.scale,
        );
      }
    });

    useEffect(() => {
      if (!actions || !names || names.length === 0) return;
      let actionName = names[0];

      if (status === "SLEEPING") {
        const sleepAction = names.find(
          (n) =>
            n.toLowerCase().includes("sleep") ||
            n.toLowerCase().includes("sit"),
        );
        if (sleepAction) actionName = sleepAction;
      } else if (status === "SAD" || status === "HUNGRY") {
        const sadAction = names.find(
          (n) =>
            n.toLowerCase().includes("sad") || n.toLowerCase().includes("cry"),
        );
        if (sadAction) actionName = sadAction;
      } else {
        const idleAction = names.find(
          (n) =>
            n.toLowerCase().includes("idle") ||
            n.toLowerCase().includes("walk"),
        );
        if (idleAction) actionName = idleAction;
      }

      if (actions[actionName]) {
        if (modelRef.current) {
          modelRef.current.position.set(
            0,
            petConfig.positionY,
            petConfig.positionZ,
          );
          modelRef.current.scale.set(
            petConfig.scale,
            petConfig.scale,
            petConfig.scale,
          );
        }
        actions[actionName].reset().fadeIn(0.3).play();
        return () => {
          actions[actionName]?.fadeOut(0.3);
        };
      }
    }, [status, actions, names, petConfig]);

    return (
      <primitive
        ref={modelRef}
        object={scene}
        scale={petConfig.scale}
        position={[0, petConfig.positionY, petConfig.positionZ]}
        rotation={[0, petConfig.rotationY || 0, 0]}
      />
    );
  };

  class ErrorBoundary3D extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    state = { hasError: false };
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error: any) {
      console.log("Lỗi tải 3D:", error);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/50 text-amber-900 font-bold text-center p-4">
            <p className="text-sm">
              ⚠️ Mô hình 3D đang bị trống hoặc lỗi định dạng!
            </p>
            <p className="text-[11px] text-gray-500 font-normal mt-1">
              Vui lòng kiểm tra lại file trong public/models/
            </p>
          </div>
        );
      }
      return this.props.children;
    }
  }

  const [pet, setPet] = useState<PetState>(() => {
    const savedPet = localStorage.getItem("pet_state");
    if (savedPet) {
      try {
        const parsed = JSON.parse(savedPet);
        if (parsed && typeof parsed === "object" && "name" in parsed) {
          return parsed;
        }
      } catch (e) {
        console.error("Lỗi dữ liệu Pet:", e);
      }
    }
    return {
      name: "Con khỉ",
      level: 1,
      hunger: 100,
      exp: 0,
      maxExp: 100,
      health: 100,
      status: "HAPPY",
      evolutionStage: "EGG",
      petType: "slime",
    };
  });

  useEffect(() => {
    if (pet && pet.name) {
      localStorage.setItem("pet_state", JSON.stringify(pet));
      syncDataStructureToCloud("pet_state", pet);
    }
  }, [pet]);

  const [showEvolutionAlert, setShowEvolutionAlert] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(pet.name);

  useEffect(() => {
    if (pet.exp >= pet.maxExp) {
      setPet((prev: PetState) => {
        const newLevel = prev.level + 1;
        return {
          ...prev,
          level: newLevel,
          exp: prev.exp - prev.maxExp,
          maxExp: newLevel * 100,
        };
      });
    }
    let nextStage: "EGG" | "BABY" | "ADULT" = "EGG";
    if (pet.level >= 7) nextStage = "ADULT";
    else if (pet.level >= 3) nextStage = "BABY";

    if (nextStage !== pet.evolutionStage) {
      setPet((prev: PetState) => {
        let chosenType = prev.petType;
        if (prev.evolutionStage === "EGG" && nextStage === "BABY") {
          chosenType = "PIKACHU";
        }
        return { ...prev, evolutionStage: nextStage, petType: chosenType };
      });
      setShowEvolutionAlert(true);
    }
  }, [pet.level, pet.exp, pet.maxExp, pet.evolutionStage]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setPet((prev) => {
          const newHunger = Math.max(0, prev.hunger - 1);
          let newHealth = prev.health;
          if (newHunger < 20) {
            newHealth = Math.max(0, prev.health - 2);
          }
          let newStatus = prev.status;
          if (newHunger < 20) {
            newStatus = "HUNGRY";
          } else if (newHealth < 40) {
            newStatus = "SAD";
          } else if (newHunger >= 85 && newHealth >= 80) {
            newStatus = "HAPPY";
          }
          return {
            ...prev,
            hunger: newHunger,
            health: newHealth,
            status: newStatus as any,
          };
        });
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleFeed = () => {
    if (diamonds >= 10) {
      onUpdateDiamonds(diamonds - 10);
      setPet((prev: PetState) => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + 20),
      }));
    } else {
      alert("Bạn không đủ Kim cương để mua thức ăn! 💎");
    }
  };

  const handleHeal = () => {
    if (pet.health < 95 && diamonds >= 15) {
      onUpdateDiamonds(diamonds - 15);
      setPet((prev: PetState) => ({
        ...prev,
        health: Math.min(100, prev.health + 30),
      }));
    } else if (pet.health >= 95) {
      alert("Thú nuôi vẫn khỏe mạnh, chưa cần chữa bệnh!");
    } else {
      alert("Bạn không đủ Kim cương! 💎");
    }
  };

  const handlePlay = () => {
    if (pet.status !== "SLEEPING" && pet.hunger >= 15 && diamonds >= 5) {
      onUpdateDiamonds(diamonds - 5);
      setPet((prev: PetState) => ({
        ...prev,
        exp: prev.exp + 20,
        hunger: Math.max(0, prev.hunger - 10),
      }));
    } else if (pet.status === "SLEEPING") {
      alert("Thú nuôi đang ngủ, không nên làm phiền!");
    } else if (pet.hunger < 15) {
      alert("Thú nuôi quá đói, hãy cho ăn trước khi chơi!");
    } else {
      alert("Bạn không đủ Kim cương! 💎");
    }
  };

  const renderPet3DCanvas = () => {
    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    let modelPath = "models/egg.glb";
    if (pet.evolutionStage === "BABY") {
      modelPath = `models/${pet.petType.toLowerCase()}_baby.glb`;
    } else if (pet.evolutionStage === "ADULT") {
      modelPath = `models/${pet.petType.toLowerCase()}_adult.glb`;
    }

    return (
      <div className="absolute inset-0 w-full h-full bg-zinc-950 rounded-3xl overflow-visible pointer-events-none z-10">
        {pet.evolutionStage === "ADULT" && (
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-4 right-4 z-20 pointer-events-none"
          >
            <Sparkles size={32} color="#FBBF24" />
          </motion.div>
        )}
        <React.Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/20 text-amber-800 font-bold text-sm gap-2">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang nạp mô hình 3D...</span>
            </div>
          }
        >
          <ErrorBoundary3D>
            <Canvas camera={{ position: [0, 1.2, 4.5], fov: 55 }}>
              <ambientLight intensity={0.7} />
              <directionalLight
                position={[5, 10, 5]}
                intensity={1.3}
                castShadow
              />
              <pointLight position={[-5, 5, -5]} intensity={0.5} />
              <BackgroundModel3D url={`${baseUrl}models/pet_background.glb`} />
              <PetModel3D url={`${baseUrl}${modelPath}`} status={pet.status} />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 2}
              />
            </Canvas>
          </ErrorBoundary3D>
        </React.Suspense>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-69px)] flex flex-col bg-white rounded-3xl border border-gray-200 shadow-xl font-sans relative overflow-visible">
      <div className="absolute top-20 left-6 z-50 pointer-events-none">
        <div className="flex flex-col gap-1 bg-zinc-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-700 pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-zinc-950 text-[10px] font-black rounded-lg">
              LV.{pet.level}
            </span>
            <h2 className="text-xl font-black text-white tracking-wide">
              {pet.name}
            </h2>
          </div>
        </div>
      </div>

      {renderPet3DCanvas()}

      {pet.status === "SLEEPING" && (
        <div className="absolute top-16 right-20 z-30 pointer-events-none">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -50, opacity: [0, 1, 0], x: i * 12 - 24 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute text-amber-500 font-bold text-2xl"
            >
              Z
            </motion.span>
          ))}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        <div className="col-span-3 p-6 flex flex-col justify-center gap-8 z-30">
          <div className="text-center">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 block">
              Evolution
            </span>
            <div className="bg-white border-2 border-amber-200 rounded-2xl py-1 px-2 shadow-sm">
              <p className="font-black text-amber-500 uppercase tracking-widest">
                {pet.evolutionStage}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-red-600 uppercase">
                <span className="flex items-center gap-1">
                  <Heart size={12} fill="currentColor" /> Health
                </span>
                <span>{pet.health}%</span>
              </div>
              <div className="h-3 bg-red-100 rounded-full overflow-hidden border border-red-200 shadow-inner">
                <motion.div
                  animate={{ width: `${pet.health}%` }}
                  className="h-full bg-gradient-to-r from-red-400 to-red-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-amber-600 uppercase">
                <span className="flex items-center gap-1">
                  <Utensils size={12} /> Hunger
                </span>
                <span>{pet.hunger}%</span>
              </div>
              <div className="h-3 bg-amber-100 rounded-full overflow-hidden border border-amber-200 shadow-inner">
                <motion.div
                  animate={{ width: `${pet.hunger}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-emerald-600 uppercase">
                <span className="flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> Mood
                </span>
                <span className="lowercase">{pet.status}</span>
              </div>
              <div className="h-3 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200 shadow-inner">
                <motion.div
                  animate={{
                    width:
                      pet.status === "HAPPY"
                        ? "100%"
                        : pet.status === "HUNGRY"
                          ? "40%"
                          : "20%",
                  }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-6 relative flex flex-col justify-between p-6 bg-transparent overflow-visible pointer-events-none z-40">
          <div className="w-full flex flex-col items-center mt-auto mb-4 pointer-events-auto">
            <div className="w-80 h-7 bg-amber-100/10 rounded-full border-2 border-amber-500/3Load p-0.5 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.2)] relative backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pet.exp / pet.maxExp) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full"
              />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                EXP {pet.exp} / {pet.maxExp}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-3 p-4 flex flex-col gap-4 overflow-y-auto z-30">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1 text-center">
            Interactions
          </span>

          <button
            onClick={handleFeed}
            disabled={diamonds < 10}
            className={`flex items-center gap-4 p-4 rounded-2xl border-b-4 transition-all text-left ${diamonds < 10 ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed" : "bg-white border-amber-200 hover:translate-y-[-2px] hover:border-b-[6px] active:translate-y-[1px] active:border-b-2 shadow-sm"}`}
          >
            <div className="bg-amber-100 p-3 rounded-xl">
              <Utensils size={28} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-amber-900 text-sm uppercase">
                  Feed
                </h4>
                <div className="flex items-center gap-0.5 text-sky-600 font-bold text-xs">
                  <span>10</span>
                  <Diamond size={12} className="fill-sky-600" />
                </div>
              </div>
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                +20 Hunger
              </p>
            </div>
          </button>

          <button
            onClick={handleHeal}
            disabled={diamonds < 15 || pet.health >= 95}
            className={`flex items-center gap-4 p-4 rounded-2xl border-b-4 transition-all text-left ${diamonds < 15 || pet.health >= 95 ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed" : "bg-white border-red-100 hover:translate-y-[-2px] hover:border-b-[6px] active:translate-y-[1px] active:border-b-2 shadow-sm"}`}
          >
            <div className="bg-red-50 p-3 rounded-xl">
              <Zap size={28} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-red-900 text-sm uppercase">
                  Heal
                </h4>
                <div className="flex items-center gap-0.5 text-sky-600 font-bold text-xs">
                  <span>15</span>
                  <Diamond size={12} className="fill-sky-600" />
                </div>
              </div>
              <p className="text-[10px] text-red-500 font-bold mt-1">
                +30 Health
              </p>
            </div>
          </button>

          <button
            onClick={handlePlay}
            disabled={
              diamonds < 5 || pet.status === "SLEEPING" || pet.hunger < 15
            }
            className={`flex items-center gap-4 p-4 rounded-2xl border-b-4 transition-all text-left ${diamonds < 5 || pet.status === "SLEEPING" || pet.hunger < 15 ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed" : "bg-white border-indigo-100 hover:translate-y-[-2px] hover:border-b-[6px] active:translate-y-[1px] active:border-b-2 shadow-sm"}`}
          >
            <div className="bg-indigo-50 p-3 rounded-xl">
              <Gamepad2 size={28} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-indigo-900 text-sm uppercase">
                  Play
                </h4>
                <div className="flex items-center gap-0.5 text-sky-600 font-bold text-xs">
                  <span>5</span>
                  <Diamond size={12} className="fill-sky-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-indigo-600 font-bold">
                  +20 EXP
                </span>
                <span className="text-[10px] text-amber-600 font-bold">
                  -10 Hunger
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showEvolutionAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-sm w-full border-8 border-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-amber-100">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles size={64} className="text-amber-400" />
                  </motion.div>
                </div>
                <h3 className="text-3xl font-black text-amber-900 mb-2 italic uppercase">
                  Evolution!
                </h3>
                <p className="text-amber-700 font-bold mb-6">
                  {" "}
                  {pet.name} has evolved into the{" "}
                  <span className="text-amber-900 underline decoration-amber-400 decoration-4 uppercase">
                    {pet.evolutionStage}
                  </span>{" "}
                  stage!
                </p>
                <button
                  onClick={() => setShowEvolutionAlert(false)}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_4px_0_0_#D97706] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest"
                >
                  Amazing!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-4 flex gap-1 overflow-x-auto opacity-0 hover:opacity-100 transition-opacity z-20">
        <button
          onClick={() => setPet((p: PetState) => ({ ...p, exp: p.exp + 50 }))}
          className="text-[6px] bg-white/80 px-1 py-0.5 rounded border border-amber-100 whitespace-nowrap"
        >
          EXP
        </button>
        <button
          onClick={() =>
            setPet((p: PetState) => ({ ...p, level: p.level + 1 }))
          }
          className="text-[6px] bg-white/80 px-1 py-0.5 rounded border border-amber-100 whitespace-nowrap"
        >
          LVL
        </button>
        <button
          onClick={() => onUpdateDiamonds(diamonds + 50)}
          className="text-[6px] bg-white/80 px-1 py-0.5 rounded border border-amber-100 whitespace-nowrap"
        >
          DIA
        </button>
      </div>
    </div>
  );
};

export default PetTab;
