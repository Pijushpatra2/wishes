"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";

/* ─────────────────────────── TYPES ─────────────────────────── */
type Slide =
  | "intro"
  | "opening"
  | "gallery"
  | "video"
  | "garden"
  | "timeline"
  | "letter"
  | "finale";

/* ─────────────────────────── CURSOR ────────────────────────── */
function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dot.current) {
        dot.current.style.left = e.clientX + "px";
        dot.current.style.top = e.clientY + "px";
      }
      setTimeout(() => {
        if (ring.current) {
          ring.current.style.left = e.clientX + "px";
          ring.current.style.top = e.clientY + "px";
        }
      }, 80);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}

/* ─────────────────────── FLOATING PARTICLES ────────────────── */
function Particles() {
  const items = ["💖", "💕", "🌹", "✨", "💫", "🌸", "💗", "⭐", "🥂", "💐"];
  const [ps, setPs] = useState<
    {
      id: number;
      left: number;
      delay: number;
      dur: number;
      size: number;
      emoji: string;
    }[]
  >([]);
  useEffect(() => {
    setPs(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        dur: 10 + Math.random() * 10,
        size: 14 + Math.random() * 18,
        emoji: items[i % items.length],
      })),
    );
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {ps.map((p) => (
        <div
          key={p.id}
          className="absolute select-none"
          style={{
            left: `${p.left}%`,
            bottom: "-60px",
            fontSize: p.size,
            animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-out`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── FIREWORKS CANVAS ─────────────────────── */
function FireworksCanvas({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    class Pt {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      alpha = 1;
      size = 1;
      color = "";
      grav = 0.1;
      res = 0.97;
      fade = 0;
      constructor(
        x: number,
        y: number,
        color: string,
        vx: number,
        vy: number,
        sz?: number,
        grav?: number,
      ) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.size = sz ?? Math.random() * 3 + 1;
        this.grav = grav ?? 0.1;
        this.fade = Math.random() * 0.018 + 0.007;
      }
      tick() {
        this.vx *= this.res;
        this.vy *= this.res;
        this.vy += this.grav;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.fade;
        this.size *= 0.98;
      }
      draw() {
        ctx!.save();
        ctx!.globalAlpha = Math.max(0, this.alpha);
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx!.fillStyle = this.color;
        ctx!.fill();
        ctx!.restore();
      }
    }

    class Fw {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      alpha = 1;
      color = "";
      pts: Pt[] = [];
      done = false;
      r = 3;
      constructor() {
        this.x = Math.random() * (canvas?.width ?? 800);
        this.y = canvas?.height ?? 600;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(Math.random() * 6 + 10);
        this.color = `hsl(${Math.random() * 360},100%,70%)`;
      }
      tick() {
        if (!this.done) {
          this.vy += 0.08;
          this.x += this.vx;
          this.y += this.vy;
          if (this.y < (canvas?.height ?? 600) * 0.35 + Math.random() * 80)
            this.boom();
        }
        this.pts = this.pts.filter((p) => p.alpha > 0);
        this.pts.forEach((p) => p.tick());
        this.alpha -= 0.006;
      }
      boom() {
        this.done = true;
        const h = Math.random() * 360;
        for (let i = 0; i < 140; i++) {
          const a = Math.PI * 2 * (i / 140),
            s = Math.random() * 5 + 1.5;
          this.pts.push(
            new Pt(
              this.x,
              this.y,
              `hsla(${h + Math.random() * 30 - 15},100%,70%,0.9)`,
              Math.cos(a) * s,
              Math.sin(a) * s,
            ),
          );
        }
        this.pts.push(new Pt(this.x, this.y, "white", 0, 0, 9, 0.3));
      }
      draw() {
        if (!this.done) {
          ctx!.beginPath();
          ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx!.fillStyle = this.color;
          ctx!.fill();
        }
        this.pts.forEach((p) => p.draw());
      }
    }

    const fws: Fw[] = [];
    let raf: number;
    function launch() {
      fws.push(new Fw());
      setTimeout(launch, Math.random() * 1300 + 400);
    }
    launch();
    function loop() {
      ctx!.clearRect(0, 0, canvas?.width ?? 800, canvas?.height ?? 600);
      for (let i = fws.length - 1; i >= 0; i--) {
        fws[i].tick();
        fws[i].draw();
        if (fws[i].alpha <= 0 && fws[i].done && fws[i].pts.length === 0)
          fws.splice(i, 1);
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [active]);
  if (!active) return null;
  return (
    <canvas ref={ref} className="fixed inset-0 pointer-events-none z-50" />
  );
}

/* ──────────────────── HEART GARDEN CANVAS ──────────────────── */
function HeartGarden({ run }: { run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gardenRef = useRef<{
    render: () => void;
    createRandomBloom: (x: number, y: number) => void;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!run) return;
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "lighter";

    // Inline garden engine (from garden.js)
    function Vector(this: any, a: number, b: number) {
      this.x = a;
      this.y = b;
    }
    (Vector as any).prototype = {
      rotate(b: number) {
        const a = this.x,
          c = this.y;
        this.x = Math.cos(b) * a - Math.sin(b) * c;
        this.y = Math.sin(b) * a + Math.cos(b) * c;
        return this;
      },
      mult(a: number) {
        this.x *= a;
        this.y *= a;
        return this;
      },
      clone() {
        return new (Vector as any)(this.x, this.y);
      },
      length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      },
      subtract(a: any) {
        this.x -= a.x;
        this.y -= a.y;
        return this;
      },
      set(a: number, b: number) {
        this.x = a;
        this.y = b;
        return this;
      },
    };
    const degrad = (a: number) => ((Math.PI * 2) / 360) * a;
    const rnd = (b: number, a: number) => Math.random() * (a - b) + b;
    const rndInt = (b: number, a: number) =>
      Math.floor(Math.random() * (a - b + 1)) + b;
    const rgba = (f: number, e: number, c: number, d: number) =>
      `rgba(${f},${e},${c},${d})`;
    const rndRgba = (
      i: number,
      n: number,
      h: number,
      m: number,
      l: number,
      dd: number,
      k: number,
    ) => {
      const c = Math.round(rnd(i, n)),
        f = Math.round(rnd(h, m)),
        j = Math.round(rnd(l, dd));
      return rgba(c, f, j, k);
    };
    const opts = {
      petalCount: { min: 8, max: 15 },
      petalStretch: { min: 0.1, max: 3 },
      growFactor: { min: 0.1, max: 1 },
      bloomRadius: { min: 8, max: 10 },
      growSpeed: 1000 / 60,
      color: {
        rmin: 180,
        rmax: 255,
        gmin: 0,
        gmax: 80,
        bmin: 60,
        bmax: 140,
        opacity: 0.18,
      },
    };

    function Petal(
      this: any,
      a: number,
      f: number,
      b: number,
      e: number,
      c: number,
      d: any,
    ) {
      this.stretchA = a;
      this.stretchB = f;
      this.startAngle = b;
      this.angle = e;
      this.bloom = d;
      this.growFactor = c;
      this.r = 1;
      this.isfinished = false;
    }
    (Petal as any).prototype = {
      draw() {
        const a = this.bloom.garden.ctx;
        const e = new (Vector as any)(0, this.r);
        (e as any).rotate(degrad(this.startAngle));
        const d = (e as any).clone().rotate(degrad(this.angle));
        const c = (e as any).clone().mult(this.stretchA);
        const b = d.clone().mult(this.stretchB);
        a.strokeStyle = this.bloom.c;
        a.beginPath();
        a.moveTo(e.x, e.y);
        a.bezierCurveTo(c.x, c.y, b.x, b.y, d.x, d.y);
        a.stroke();
      },
      render() {
        if (this.r <= this.bloom.r) {
          this.r += this.growFactor;
          this.draw();
        } else {
          this.isfinished = true;
        }
      },
    };

    function Bloom(this: any, e: any, d: number, f: string, a: number, b: any) {
      this.p = e;
      this.r = d;
      this.c = f;
      this.pc = a;
      this.petals = [];
      this.garden = b;
      const cv = 360 / this.pc,
        bv = rndInt(0, 90);
      for (let i = 0; i < this.pc; i++)
        this.petals.push(
          new (Petal as any)(
            rnd(opts.petalStretch.min, opts.petalStretch.max),
            rnd(opts.petalStretch.min, opts.petalStretch.max),
            bv + i * cv,
            cv,
            rnd(opts.growFactor.min, opts.growFactor.max),
            this,
          ),
        );
      this.garden.addBloom(this);
    }
    (Bloom as any).prototype = {
      draw() {
        let done = true;
        this.garden.ctx.save();
        this.garden.ctx.translate(this.p.x, this.p.y);
        this.petals.forEach((p: any) => {
          p.render();
          done = done && p.isfinished;
        });
        this.garden.ctx.restore();
        if (done) this.garden.removeBloom(this);
      },
    };

    function GardenClass(this: any, a: any, b: any) {
      this.blooms = [];
      this.element = b;
      this.ctx = a;
    }
    (GardenClass as any).prototype = {
      render() {
        this.blooms.forEach((b: any) => b.draw());
      },
      addBloom(a: any) {
        this.blooms.push(a);
      },
      removeBloom(a: any) {
        const i = this.blooms.indexOf(a);
        if (i > -1) this.blooms.splice(i, 1);
      },
      createRandomBloom(a: number, b: number) {
        new (Bloom as any)(
          new (Vector as any)(a, b),
          rndInt(opts.bloomRadius.min, opts.bloomRadius.max),
          rndRgba(
            opts.color.rmin,
            opts.color.rmax,
            opts.color.gmin,
            opts.color.gmax,
            opts.color.bmin,
            opts.color.bmax,
            opts.color.opacity,
          ),
          rndInt(opts.petalCount.min, opts.petalCount.max),
          this,
        );
      },
    };

    const g = new (GardenClass as any)(ctx, canvas);
    gardenRef.current = g;
    const renderTimer = setInterval(() => g.render(), opts.growSpeed);
    timerRef.current = renderTimer;

    // Draw heart shape
    const W = canvas.width,
      H = canvas.height;
    const cx = W / 2,
      cy = H / 2 - 30;
    let d = 8;
    const heartTimer = setInterval(() => {
      const t = d / Math.PI;
      const x = cx + 19.5 * (16 * Math.pow(Math.sin(t), 3));
      const y =
        cy -
        20 *
          (13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t));
      g.createRandomBloom(x, y);
      d += 0.18;
      if (d >= 30) clearInterval(heartTimer);
    }, 60);

    return () => {
      clearInterval(renderTimer);
      clearInterval(heartTimer);
    };
  }, [run]);

  return (
    <canvas
      ref={ref}
      id="garden"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ──────────────────── COUNTER ──────────────────── */
function Counter({ since }: { since: Date }) {
  const [t, setT] = useState({
    y: 0,
    d: 0,
    h: "00",
    m: "00",
    s: "00",
  });

  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - since.getTime()) / 1000);

      const years = Math.floor(diff / (365 * 24 * 60 * 60));
      const remainingAfterYears = diff % (365 * 24 * 60 * 60);

      const days = Math.floor(remainingAfterYears / 86400);
      const hours = Math.floor((remainingAfterYears % 86400) / 3600);
      const minutes = Math.floor((remainingAfterYears % 3600) / 60);
      const seconds = Math.floor(remainingAfterYears % 60);

      setT({
        y: years,
        d: days,
        h: String(hours).padStart(2, "0"),
        m: String(minutes).padStart(2, "0"),
        s: String(seconds).padStart(2, "0"),
      });
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [since]);

const units = [
  { v: 7, l: "Years" },
  { v: 51, l: "Days" },
  { v: t.h, l: "Hours" },
  { v: t.m, l: "Min" },
  { v: t.s, l: "Sec" },
];

  return (
    <div className="flex gap-3 flex-wrap justify-center mt-6">
      {units.map(({ v, l }) => (
        <div
          key={l}
          className="flex flex-col items-center border border-rose-400/30 rounded-xl px-5 py-3 bg-black/30 backdrop-blur-md min-w-[80px]"
        >
          <span className="digit text-4xl text-rose-300 tracking-tight">
            {v}
          </span>

          <span className="text-[10px] text-rose-300/50 uppercase tracking-[0.2em] mt-1 font-sans">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── SLIDE NAV DOT ──────────────────── */
function NavDots({
  slides,
  current,
  onClick,
}: {
  slides: Slide[];
  current: number;
  onClick: (i: number) => void;
}) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: i === current ? "#ff4d6d" : "rgba(255,255,255,0.25)",
            transform: i === current ? "scale(1.5)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────── REVEAL WRAPPER ──────────────────── */
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────── PHOTO CARD ──────────────────── */
function PhotoCard({
  rotate,
  label,
  src,
  delay = 0,
}: {
  rotate: number;
  label: string;
  src?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="polaroid hover:scale-105 transition-all duration-500"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {/* Image Area */}
        <div className="relative w-52 h-52 md:w-60 md:h-60 overflow-hidden rounded-sm bg-gradient-to-br from-rose-900/40 to-rose-700/20">
          {src ? (
            <Image
              src={src}
              alt={label}
              fill
              className="object-cover transition-transform duration-700 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-rose-200/40">
              <span className="text-5xl">📸</span>
              <span className="text-xs font-sans">Add your photo</span>
            </div>
          )}

          {/* soft overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
        </div>

        {/* Caption */}
        {/* <p className="mt-3 text-center text-xs text-gray-600 font-sans tracking-wide">
          {label}
        </p> */}
      </div>
    </Reveal>
  );
}

/* ──────────────────── VIDEO PLACEHOLDER ──────────────────── */
function VideoSlide() {
  const [playing, setPlaying] = useState(false);
  const vRef = useRef<HTMLVideoElement>(null);

  // keep video inside /public folder
  const videoSrc =
    "https://res.cloudinary.com/dmi5ntbgn/video/upload/v1781375642/IMG_4747_e3z0ob.mp4";

  const toggleVideo = async () => {
    if (!vRef.current) return;

    if (playing) {
      vRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await vRef.current.play();
        setPlaying(true);
      } catch (error) {
        console.log("Autoplay blocked:", error);
      }
    }
  };

  return (
    <div
      className="slide grain"
      style={{
        background:
          "linear-gradient(135deg,#2a0014 0%,#4b001f 45%,#5e1730 75%,#3a0018 100%)",
      }}
    >
      <div className="relative w-full max-w-4xl mx-auto px-6 z-10">
        <Reveal>
          <p className="text-rose-200/60 uppercase tracking-[0.4em] text-xs mb-4 text-center font-sans">
            Our Memories
          </p>

          <h2 className="text-center font-serif italic text-4xl md:text-5xl text-rose-50 mb-10">
            A Year in Motion
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-rose-200/10 shadow-2xl shadow-rose-500/20 bg-black/40 group">
            <video
              ref={vRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              loop
              playsInline
              preload="auto"
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            {/* custom play button */}
            {!playing && (
              <button
                onClick={toggleVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
              >
                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:scale-110 transition">
                  <span className="text-4xl text-white ml-1">▶</span>
                </div>
              </button>
            )}

            <div className="video-overlay pointer-events-none" />
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="text-center text-rose-100/55 italic text-lg mt-6 font-serif">
            "Every frame a memory, every second a gift."
          </p>
        </Reveal>
      </div>
    </div>
  );
}
/* ─────────────────────── MAIN PAGE ─────────────────────────── */
export default function AnniversaryPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [candleBlown, setCandleBlown] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [finaleActive, setFinaleActive] = useState(false);
  const [gardenRun, setGardenRun] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ← CUSTOMIZE these
  const anniversaryDate = new Date("2019-04-19T15:00:00");
  const names = { person1: "You", person2: "Me" };

  const slides: Slide[] = [
    "intro",
    "opening",
    "gallery",
    "video",
    "garden",
    "timeline",
    "letter",
    "finale",
  ];

  const burst = useCallback((ox = 0.5, oy = 0.5) => {
    const colors = ["#ff4d6d", "#ffd1dc", "#f5c842", "#ff85a2", "#c8b6e2"];
    confetti({
      particleCount: 100,
      spread: 340,
      startVelocity: 32,
      ticks: 80,
      origin: { x: ox, y: oy },
      colors,
      zIndex: 9999,
    });
    setTimeout(
      () =>
        confetti({
          particleCount: 60,
          spread: 200,
          startVelocity: 22,
          origin: { x: 0.2, y: 0.7 },
          colors,
          zIndex: 9999,
        }),
      300,
    );
    setTimeout(
      () =>
        confetti({
          particleCount: 60,
          spread: 200,
          startVelocity: 22,
          origin: { x: 0.8, y: 0.7 },
          colors,
          zIndex: 9999,
        }),
      500,
    );
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setCurrentSlide(i);
      if (slides[i] === "garden") setTimeout(() => setGardenRun(true), 800);
      if (slides[i] === "finale") {
        setFinaleActive(true);
        burst();
        setTimeout(() => burst(0.1, 0.5), 600);
        setTimeout(() => burst(0.9, 0.5), 1000);
      }
    },
    [slides, burst],
  );

  // keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight")
        goTo(Math.min(currentSlide + 1, slides.length - 1));
      if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        goTo(Math.max(currentSlide - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlide, goTo, slides.length]);

  const handleBlowCandle = () => {
    if (candleBlown) return;
    setCandleBlown(true);
    setShowSmoke(true);
    setTimeout(() => goTo(slides.indexOf("letter")), 2000);
  };

  const sv = (id: Slide) => slides[currentSlide] === id;

  const slideVariants = {
    enter: { opacity: 0, y: 60, scale: 0.97 },
    center: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -40, scale: 0.98 },
  };

  return (
    <div className="relative" style={{ cursor: "none" }}>
      <CustomCursor />
      <Particles />
      <FireworksCanvas active={finaleActive && sv("finale")} />
      <NavDots slides={slides} current={currentSlide} onClick={goTo} />

      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-50 transition-all duration-700"
        style={{
          width: `${(currentSlide / (slides.length - 1)) * 100}%`,
          background: "linear-gradient(90deg, #ff4d6d, #f5c842)",
        }}
      />

      {/* Slide container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="min-h-screen w-full"
          ref={containerRef}
        >
          {/* === SLIDE 0: INTRO === */}
          {sv("intro") && (
            <div
              className="slide grain relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at center, #2d0020 0%, #0d0008 60%, #000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
              }}
            >
              {/* Animated rings */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-rose-400/10 pointer-events-none"
                  style={{
                    width: i * 300,
                    height: i * 300,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    animation: `pulseRing ${3 + i}s ${i * 0.5}s infinite ease-out`,
                  }}
                />
              ))}

              <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full max-w-xl mx-auto">
                <motion.p
                  className="font-sans uppercase tracking-[0.45em] text-xs text-rose-300/60 mb-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  A Special Surprise For You
                </motion.p>

                <motion.h1
                  className="shimmer-text mb-3 w-full"
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: "clamp(2.6rem,7vw,5rem)",
                    lineHeight: 1.1,
                  }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.9 }}
                >
                  Happy Togetherness
                </motion.h1>

                <motion.p
                  className="font-serif italic text-rose-200/50 text-lg mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                >
                  Mi Vida (NOVIO)
                </motion.p>

                {/* Big gift */}
                <motion.div
                  className="flex flex-col items-center cursor-pointer"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.05, type: "spring", stiffness: 150 }}
                  onClick={() => {
                    burst();
                    setTimeout(() => goTo(1), 600);
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <motion.div
                    className="w-44 h-44"
                    animate={{ y: [-8, 8, -8] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full drop-shadow-2xl"
                    >
                      <defs>
                        <radialGradient id="boxGrad" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#ff85a2" />
                          <stop offset="100%" stopColor="#c2185b" />
                        </radialGradient>
                        <radialGradient id="lidGrad" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#ffb3c6" />
                          <stop offset="100%" stopColor="#e91e63" />
                        </radialGradient>
                      </defs>
                      <rect
                        x="35"
                        y="85"
                        width="130"
                        height="95"
                        rx="10"
                        fill="url(#boxGrad)"
                      />
                      <rect
                        x="92"
                        y="85"
                        width="18"
                        height="95"
                        fill="rgba(0,0,0,0.15)"
                      />
                      <rect
                        x="25"
                        y="63"
                        width="150"
                        height="30"
                        rx="8"
                        fill="url(#lidGrad)"
                      />
                      <rect
                        x="92"
                        y="63"
                        width="18"
                        height="30"
                        fill="rgba(0,0,0,0.12)"
                      />
                      <path
                        d="M100 62 C72 28 42 55 85 65 C42 70 24 32 96 62 C104 30 152 32 118 65 C158 58 165 28 100 62"
                        fill="none"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <text
                        x="100"
                        y="138"
                        fontSize="22"
                        fill="rgba(255,255,255,0.25)"
                        textAnchor="middle"
                      >
                        ♡
                      </text>
                      <text
                        x="138"
                        y="118"
                        fontSize="16"
                        fill="rgba(255,255,255,0.2)"
                        textAnchor="middle"
                      >
                        ✦
                      </text>
                    </svg>
                  </motion.div>
                  <motion.p
                    className="font-sans text-rose-300/50 text-xs tracking-[0.3em] uppercase mt-2"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    tap to open ♡
                  </motion.p>
                </motion.div>
              </div>
            </div>
          )}

          {/* === SLIDE 1: OPENING === */}
          {sv("opening") && (
            <div
              className="slide"
              style={{
                background:
                  "linear-gradient(160deg,#0d0008 0%,#1a000f 40%,#1a0010 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
              }}
            >
              <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-2xl mx-auto">
                {/* Top Label */}
                <Reveal>
                  <p className="font-sans uppercase tracking-[0.55em] text-[11px] text-rose-400/55 mb-6">
                    A Love That Chose Us Twice
                  </p>

                  {/* Main Heading */}
                  <h2
                    className="font-serif italic text-rose-50 mb-6"
                    style={{
                      fontSize: "clamp(3rem,7vw,6rem)",
                      lineHeight: 1.08,
                      letterSpacing: "-0.02em",
                      color: "#ffd1dc",
                      maxWidth: "760px",
                    }}
                  >
                    Every day with <br />
                    you feels like the <br />
                    first
                  </h2>

                  {/* Description */}
                  <p
                    className="font-serif italic text-rose-200/45 text-lg leading-relaxed mb-10"
                    style={{ maxWidth: "620px" }}
                  >
                    A whole year of laughing too loud, staying up too late,
                    <br />
                    and falling more in love every single day.
                  </p>
                </Reveal>

                {/* Counter */}
                <Reveal delay={0.25}>
                  <div className="mb-8">
                    <Counter since={anniversaryDate} />
                  </div>
                </Reveal>

                {/* Bottom Text + Button */}
                <Reveal delay={0.45}>
                  <div className="flex flex-col items-center gap-5">
                    <p className="font-sans text-rose-300/35 text-sm tracking-wide italic">
                      ...and every second was worth it.
                    </p>

                    <button
                      onClick={() => goTo(2)}
                      className="group relative inline-flex items-center justify-center min-w-[260px] h-[54px] px-8 rounded-full overflow-hidden whitespace-nowrap font-sans text-sm md:text-[15px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        background:
                          "linear-gradient(135deg,#ff4d6d 0%,#c2185b 100%)",
                        boxShadow:
                          "0 0 28px rgba(255,77,109,0.35), 0 4px 20px rgba(0,0,0,0.35)",
                      }}
                    >
                      {/* Shine Effect */}
                      <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                      {/* Text */}
                      <span className="relative z-10 flex items-center gap-2 leading-none">
                        <span>See Our Memories</span>
                        <span className="text-base transition-transform duration-300 group-hover:translate-y-0.5">
                          ↓
                        </span>
                      </span>
                    </button>
                  </div>
                </Reveal>
              </div>
            </div>
          )}

          {/* === SLIDE 2: GALLERY === */}
          {/* {sv("gallery") && (
            <div
              className="slide py-24 relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at top left, rgba(255,90,140,0.22) 0%, transparent 32%),
                  radial-gradient(circle at top right, rgba(255,70,110,0.16) 0%, transparent 28%),
                  radial-gradient(circle at bottom center, rgba(255,120,180,0.14) 0%, transparent 35%),
                  linear-gradient(180deg,#2a0014 0%,#4b001f 45%,#5e1730 75%,#3a0018 100%)
                `,
              }}
            >
             
              <div className="absolute -top-10 -left-10 w-80 h-80 rounded-full bg-pink-400/20 blur-[140px]" />
              <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-rose-500/20 blur-[140px]" />
              <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-fuchsia-400/10 blur-[160px]" />

              <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
                <Reveal>
                  <p className="text-rose-100/55 uppercase tracking-[0.4em] text-xs mb-3 text-center font-sans">
                    Our Gallery
                  </p>

                  <h2
                    className="text-center font-serif italic text-rose-50 mb-12"
                    style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}
                  >
                    Frames I'll Never Forget
                  </h2>
                </Reveal>

               
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 place-items-center">
                  <PhotoCard
                    rotate={-4}
                    label="The day we met ✨"
                    src="/images/img01.jpeg"
                    delay={0.1}
                  />

                  <PhotoCard
                    rotate={3}
                    label="Our first date 🌹"
                    src="/images/img02.jpeg"
                    delay={0.2}
                  />

                  <PhotoCard
                    rotate={-2}
                    label="That sunset 🌅"
                    src="/images/img03.jpeg"
                    delay={0.3}
                  />

                  <PhotoCard
                    rotate={5}
                    label="The road trip 🗺️"
                    src="/images/img04.jpeg"
                    delay={0.4}
                  />

                  <PhotoCard
                    rotate={-3}
                    label="Your smile 💖"
                    src="/images/img05.jpeg"
                    delay={0.5}
                  />

                  <PhotoCard
                    rotate={2}
                    label="Us, always 💑"
                    src="/images/img06.jpg"
                    delay={0.6}
                  />
                </div>

                <Reveal delay={0.8}>
                  <div className="text-center mt-10">
                    <button
                      onClick={() => goTo(3)}
                      className="group relative inline-flex items-center justify-center min-w-[220px] h-[54px] px-8 rounded-full overflow-hidden whitespace-nowrap font-sans text-sm md:text-[15px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        background:
                          "linear-gradient(135deg,#ff4d6d 0%,#d81b60 55%,#b31252 100%)",
                        boxShadow:
                          "0 0 28px rgba(255,77,109,0.28), 0 10px 28px rgba(0,0,0,0.28)",
                      }}
                    >
                      <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                      <span className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

                      <span className="relative z-10 flex items-center gap-2">
                        Continue
                        <span className="text-base transition-transform duration-300 group-hover:translate-y-0.5">
                          ↓
                        </span>
                      </span>
                    </button>
                  </div>
                </Reveal>
              </div>
            </div>
          )} */}

{/* === SLIDE 2: GALLERY === */}
{sv("gallery") && (
  <div
    className="slide relative overflow-hidden py-16 sm:py-20 md:py-24"
    style={{
      background: `
        radial-gradient(circle at top left, rgba(255,90,140,0.22) 0%, transparent 32%),
        radial-gradient(circle at top right, rgba(255,70,110,0.16) 0%, transparent 28%),
        radial-gradient(circle at bottom center, rgba(255,120,180,0.14) 0%, transparent 35%),
        linear-gradient(180deg,#2a0014 0%,#4b001f 45%,#5e1730 75%,#3a0018 100%)
      `,
    }}
  >
    {/* Ambient Glow */}
    <div className="absolute -top-10 -left-10 w-52 sm:w-72 md:w-80 h-52 sm:h-72 md:h-80 rounded-full bg-pink-400/20 blur-[100px] md:blur-[140px]" />
    <div className="absolute top-10 sm:top-20 right-0 w-52 sm:w-64 md:w-72 h-52 sm:h-64 md:h-72 rounded-full bg-rose-500/20 blur-[100px] md:blur-[140px]" />
    <div className="absolute bottom-0 left-1/3 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 rounded-full bg-fuchsia-400/10 blur-[120px] md:blur-[160px]" />

    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <p className="text-rose-100/55 uppercase tracking-[0.28em] sm:tracking-[0.4em] text-[10px] sm:text-xs mb-3 text-center font-sans">
          Our Gallery
        </p>

        <h2
          className="text-center font-serif italic text-rose-50 mb-10 sm:mb-12 leading-tight px-2"
          style={{ fontSize: "clamp(1.8rem,6vw,3.5rem)" }}
        >
          Frames I'll Never Forget
        </h2>
      </Reveal>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-10 place-items-center">
        <PhotoCard
          rotate={-4}
          label="The day we met ✨"
          src="/images/img01.jpeg"
          delay={0.1}
        />

        <PhotoCard
          rotate={3}
          label="Our first date 🌹"
          src="/images/img02.jpeg"
          delay={0.2}
        />

        <PhotoCard
          rotate={-2}
          label="That sunset 🌅"
          src="/images/img03.jpeg"
          delay={0.3}
        />

        <PhotoCard
          rotate={5}
          label="The road trip 🗺️"
          src="/images/img04.jpeg"
          delay={0.4}
        />

        <PhotoCard
          rotate={-3}
          label="Your smile 💖"
          src="/images/img05.jpeg"
          delay={0.5}
        />

        <PhotoCard
          rotate={2}
          label="Us, always 💑"
          src="/images/img06.jpg"
          delay={0.6}
        />
      </div>

      <Reveal delay={0.8}>
        <div className="text-center mt-10 sm:mt-14">
          <button
            onClick={() => goTo(3)}
            className="group relative inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] sm:min-w-[220px] h-[50px] sm:h-[54px] px-6 sm:px-8 rounded-full overflow-hidden whitespace-nowrap font-sans text-xs sm:text-sm md:text-[15px] font-semibold tracking-[0.12em] sm:tracking-[0.16em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg,#ff4d6d 0%,#d81b60 55%,#b31252 100%)",
              boxShadow:
                "0 0 28px rgba(255,77,109,0.28), 0 10px 28px rgba(0,0,0,0.28)",
            }}
          >
            {/* Shine Sweep */}
            <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

            {/* Glow Border */}
            <span className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

            {/* Text */}
            <span className="relative z-10 flex items-center gap-2">
              Continue

              <span className="text-base transition-transform duration-300 group-hover:translate-y-0.5">
                ↓
              </span>
            </span>
          </button>
        </div>
      </Reveal>
    </div>
  </div>
)}

          {/* === SLIDE 3: VIDEO === */}
          {sv("video") && (
            <div>
              <VideoSlide />
              <div className="flex justify-center pb-8 -mt-2 relative z-20">
                <button
                  onClick={() => goTo(4)}
                  className="group relative inline-flex items-center justify-center min-w-[220px] h-[54px] px-8 rounded-full overflow-hidden whitespace-nowrap font-sans text-sm md:text-[15px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg,#ff4d6d 0%,#d81b60 55%,#b31252 100%)",
                    boxShadow:
                      "0 0 28px rgba(255,77,109,0.28), 0 10px 28px rgba(0,0,0,0.28)",
                  }}
                >
                  {/* Shine Sweep */}
                  <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                  {/* Border */}
                  <span className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

                  {/* Text */}
                  <span className="relative z-10 flex items-center gap-2">
                    Continue
                    <span className="text-base transition-transform duration-300 group-hover:translate-y-0.5">
                      ↓
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* === SLIDE 4: HEART GARDEN === */}
          {sv("garden") && (
            <div
              className="slide relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg,#050005 0%,#12000a 50%,#050005 100%)",
              }}
            >
              <HeartGarden run={gardenRun} />

              <div className="z-10 text-center max-w-md mx-auto px-6 relative">
                <motion.p
                  className="text-rose-300/50 uppercase tracking-[0.4em] text-xs mb-4 font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  For You
                </motion.p>
                <motion.h2
                  className="font-serif italic text-rose-100 mb-4"
                  style={{ fontSize: "clamp(2rem,6vw,3.5rem)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  A Garden of
                  <br />
                  My Love
                </motion.h2>
                <motion.p
                  className="text-rose-200/40 text-sm font-sans mb-8 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  Every bloom, a moment. Every petal, a reason.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                >
                  <button
                    onClick={() => goTo(5)}
                    className="group relative inline-flex items-center justify-center min-w-[220px] h-[54px] px-8 rounded-full overflow-hidden whitespace-nowrap font-sans text-sm md:text-[15px] font-semibold tracking-[0.16em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background:
                        "linear-gradient(135deg,#ff4d6d 0%,#d81b60 55%,#b31252 100%)",
                      boxShadow:
                        "0 0 28px rgba(255,77,109,0.28), 0 10px 28px rgba(0,0,0,0.28)",
                    }}
                  >
                    {/* Shine Sweep */}
                    <span className="absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                    {/* Border */}
                    <span className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

                    {/* Text */}
                    <span className="relative z-10 flex items-center gap-2">
                      Continue
                      <span className="text-base transition-transform duration-300 group-hover:translate-y-0.5">
                        ↓
                      </span>
                    </span>
                  </button>
                </motion.div>
              </div>
            </div>
          )}

          {/* === SLIDE 5: TIMELINE === */}
{/* === SLIDE 5: TIMELINE === */}
{sv("timeline") && (
  <div
    className="slide py-16 sm:py-20 relative overflow-hidden"
    style={{
      background:
        "linear-gradient(180deg,#0d0008 0%,#1a000f 45%,#12000b 100%)",
    }}
  >
    {/* Ambient Glow */}
    <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-[140px] rounded-full" />
    <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/10 blur-[150px] rounded-full" />

    <div className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-6">
      <Reveal>
        <p className="text-rose-300/50 uppercase tracking-[0.35em] text-[10px] sm:text-xs mb-3 text-center font-sans">
          Our Journey
        </p>

        <h2
          className="text-center font-serif italic text-rose-100 mb-14 leading-tight"
          style={{ fontSize: "clamp(2rem,6vw,3.4rem)" }}
        >
          The Story of Us
        </h2>
      </Reveal>

      {[
        {
          icon: "✨",
          year: "DAY ONE ✨",
          title: "We Met",
          desc: "The universe didn’t rush—it quietly aligned two souls that didn’t know they were home yet. 🌙",
        },
        {
          icon: "🌹",
          year: "MONTH ONE 🌹",
          title: "First Date",
          desc: "Time slowed down for us—coffee went cold, but something warm began. ☕💞",
        },
        {
          icon: "💖",
          year: "YEAR ONE 💖",
          title: "We Stayed",
          desc: "Through little fights and soft apologies, we learned—love isn’t perfect, it’s patient. 🤍",
        },
        {
          icon: "🌈",
          year: "3 YEARS 🌧️➡️🌈",
          title: "We Found Our Way Back",
          desc: "Even distance couldn’t rewrite us. Some stories pause… but ours chose to continue. 💫",
        },
        {
          icon: "🫶",
          year: "5 YEARS 🫶",
          title: "We Grew",
          desc: "Not the same people, but still choosing each other—a little softer, a little stronger. 🌿",
        },
        {
          icon: "♾️",
          year: "TODAY — 7 YEARS ♾️❤️",
          title: "Still Us",
          desc: "Seven years… not just time, but a thousand feelings, a million memories, and one constant—you. I don’t just love you… I recognize you as my forever. 🏡💖",
        },
      ].map((e, i) => (
        <Reveal key={e.year} delay={i * 0.12}>
          <div className="flex gap-4 sm:gap-6 mb-10 last:mb-0">
            {/* Timeline Left */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl"
                style={{
                  background:
                    "linear-gradient(135deg,#ff4d6d 0%,#c2185b 100%)",
                  boxShadow: "0 0 24px rgba(255,77,109,0.45)",
                }}
              >
                {e.icon}
              </div>

              {i < 5 && (
                <div
                  className="w-px flex-1 mt-3 min-h-[70px]"
                  style={{
                    background:
                      "linear-gradient(to bottom,#ff4d6d55,transparent)",
                  }}
                />
              )}
            </div>

            {/* Timeline Content */}
            <div className="pb-2 pt-1">
              <p className="text-rose-400/60 text-[10px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-widest font-sans mb-2">
                {e.year}
              </p>

              <h3 className="text-rose-100 font-serif text-xl sm:text-2xl mb-3 leading-tight">
                {e.title}
              </h3>

              <p className="text-rose-100/60 text-sm sm:text-[15px] leading-7 font-sans max-w-xl">
                {e.desc}
              </p>
            </div>
          </div>
        </Reveal>
      ))}

      {/* Candle Section */}
      <Reveal delay={0.8}>
        <div className="text-center mt-14 sm:mt-16">
          <p className="text-rose-200/40 text-sm sm:text-base italic font-serif mb-6 leading-relaxed">
            Make a wish… ✨
            <br />
            We already are one. 💫
          </p>

          <div
            className="cursor-pointer inline-block select-none"
            onClick={handleBlowCandle}
          >
            <svg
              viewBox="0 0 100 150"
              width="90"
              height="140"
              className="sm:w-[100px] sm:h-[150px]"
            >
              <ellipse
                cx="50"
                cy="142"
                rx="35"
                ry="7"
                fill="#0d0008"
              />

              <rect
                x="18"
                y="95"
                width="64"
                height="46"
                rx="8"
                fill="#ff4d6d"
              />

              <path d="M18 95 Q50 110 82 95" fill="#ff6b8a" />

              <path
                d="M18 95 C23 86 28 95 33 86 C38 77 43 95 48 86 C53 77 58 95 63 86 C68 77 73 95 78 86 C83 77 82 95 82 95"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />

              <rect
                x="46"
                y="58"
                width="8"
                height="37"
                rx="2"
                fill="#c8b6e2"
              />

              {!candleBlown && (
                <>
                  <motion.path
                    d="M50 58 Q43 43 50 27 Q57 43 50 58"
                    fill="#ffb347"
                    animate={{
                      scaleX: [1, 1.25, 0.85, 1.15, 1],
                      scaleY: [1, 0.92, 1.1, 0.96, 1],
                    }}
                    transition={{
                      duration: 0.22,
                      repeat: Infinity,
                    }}
                    style={{ transformOrigin: "50px 58px" }}
                  />

                  <motion.circle
                    cx="50"
                    cy="52"
                    r="3.5"
                    fill="#ff7700"
                    opacity="0.7"
                    animate={{ r: [3.5, 4.5, 2.5, 4, 3.5] }}
                    transition={{
                      duration: 0.22,
                      repeat: Infinity,
                    }}
                  />
                </>
              )}

              {showSmoke && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.path
                    d="M50 58 Q44 42 47 26"
                    stroke="#888"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: [0, 0.5, 0],
                      y: -22,
                    }}
                    transition={{
                      duration: 1.6,
                      ease: "easeOut",
                    }}
                  />

                  <motion.path
                    d="M50 58 Q56 40 53 23"
                    stroke="#777"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: [0, 0.4, 0],
                      y: -28,
                    }}
                    transition={{
                      duration: 1.6,
                      delay: 0.2,
                      ease: "easeOut",
                    }}
                  />
                </motion.g>
              )}
            </svg>

            <motion.p
              className="text-xs text-rose-300/40 font-sans mt-2"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {candleBlown ? "✨ wish granted" : "tap to blow out"}
            </motion.p>
          </div>
        </div>
      </Reveal>
    </div>
  </div>
)}

          {/* === SLIDE 6: LETTER === */}
          {sv("letter") && (
            <div
              className="slide py-20"
              style={{
                background: "linear-gradient(160deg,#0d0008,#1a001a,#0d0008)",
              }}
            >
              <div className="z-10 w-full lg:max-w-7xl mx-auto px-6">
                <Reveal>
                  <p className="text-rose-300/50 uppercase tracking-[0.4em] text-xs mb-3 text-center font-sans">
                    From My Heart
                  </p>
                  <h2
                    className="text-center font-serif italic text-rose-100 mb-8"
                    style={{ fontSize: "clamp(2rem,5vw,3rem)" }}
                  >
                    A Letter For You
                  </h2>
                </Reveal>

                <Reveal delay={0.15}>
                  <div
                    className="rounded-2xl p-8 border border-rose-200/10"
                    style={{
                      background: "rgba(255,77,109,0.04)",
                      backdropFilter: "blur(20px)",
                      boxShadow:
                        "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <p className="text-right text-rose-300/30 text-xs font-sans mb-6">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <h3 className="font-serif italic text-2xl text-rose-200 mb-6">
                      My Dearest,
                    </h3>
                    {[
                      "Seven years today—yet it still feels like the story began just yesterday, on a quiet night that stretched till 3 a.m. 🌙✨ Two strangers spoke, not knowing they were slowly becoming each other’s forever. There was no promise then, no certainty—just a soft spark between words, a bond budding like a quiet flower 🌸.",

"Time tested us in ways we never expected. There were moments of closeness 🤗, and moments where silence took over, where we drifted apart for months as if the story paused ⏳. But love, when it’s true, has a strange way of finding its way back 💫. When we spoke again, it wasn’t the same beginning—it was deeper, calmer, built on trust and understanding 🌊💛. We didn’t just reconnect; we chose each other again, hand in hand, with more patience and a braver heart 💖🤝.",

"I still remember our first real conflict—the moment that could have broken us 😔, but instead, it showed me who you truly are. You stood by me when you didn’t have to, and in that moment, I quietly realized—you are my person 💑. Every argument since, every “little fight” that once felt so big, has only shaped us, softened us, and made us stronger 💪💞.",

"And then came the golden chapters—meeting you, being with you, the days in Kolkata that turned ordinary streets into magic 🏙️✨. That city is no longer just a place; it’s you. The laughter, the evening scooty rides 🛵, the secret plans, the little celebrations—we built a world inside a world, one that belongs only to us 💫🌍. And every time you leave, even for a day, it feels like a piece of me is waiting to return 💭💔.",

"There were moments we almost gave up, when emotions ran high and uncertainty swirled 🌪️. But your patience, your quiet strength, your way of always returning to me—that’s what held us together 💖🌈. Loving me hasn’t always been easy, but you stayed, you understood, and you chose me every time💗.",

"You are my comfort, my safe place in this restless world 🌍🧡. Even in your most tiring moments, you still seek me, still want that one hug 🤗—it means more than words can ever say. You are my peace, just as I am yours 🕊️💞.",

"If there are pages marked with mistakes, I hold them gently with an apology. I never meant to hurt you—only to see you smile, to give you reasons to stay, to make this love worth it every single day 🌷💛.",

"Seven years later, I don’t just see a relationship—I see a journey, a story that grew, broke, healed, and still blooms beautifully 🌸✨. I see a future in all those small promises, in every wish waiting to come true, in the quiet hope that one day, “someday” will become our everyday 🏡💫.",

"And through it all, one truth stays simple and constant—you are my home, my comfort, my happiness 🏠💖. Thank you for choosing me, for staying, for loving me through every version of myself. I love you—always, and a little more with every passing day 💖✨"
                    
                    ].map((p, i) => (
                      <motion.p
                        key={i}
                        className="text-rose-100/60 leading-loose mb-4 font-serif text-base p-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.2 }}
                      >
                        {p}
                      </motion.p>
                    ))}
                    <motion.p
                      className="mt-8 font-serif italic text-right text-rose-300 text-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      — Yours, forever 💕
                    </motion.p>
                  </div>
                </Reveal>

                <Reveal delay={0.9}>
                  <div className="text-center mt-8">
                    <p className="text-rose-300/30 text-xs font-sans mb-4">
                      One last surprise...
                    </p>
                    <motion.button
                      onClick={() => goTo(7)}
                      className="px-10 py-3 rounded-full font-sans text-sm tracking-wide font-medium"
                      style={{
                        background: "linear-gradient(135deg,#ff4d6d,#9b5de5)",
                        boxShadow: "0 0 50px rgba(255,77,109,0.35)",
                      }}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      🎇 The Grand Finale
                    </motion.button>
                  </div>
                </Reveal>
              </div>
            </div>
          )}

          {/* === SLIDE 7: FINALE === */}
          {sv("finale") && (
            <div
              className="slide relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at center,#2d0020 0%,#0d0008 60%,#000 100%)",
              }}
            >
              {/* Animated rings */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-rose-500/10"
                  style={{
                    width: i * 250,
                    height: i * 250,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    animation: `pulseRing ${2.5 + i * 0.5}s ${i * 0.3}s infinite ease-out`,
                  }}
                />
              ))}

              <div className="z-10 text-center max-w-lg mx-auto px-6">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span style={{ fontSize: "6rem" }}>💖</span>
                </motion.div>

                <motion.h2
                  className="shimmer-text mt-6 mb-2"
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: "clamp(2.5rem,7vw,4.5rem)",
                    lineHeight: 1.1,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Happy Birthday!
                </motion.h2>

                <motion.p
                  className="text-rose-200/50 italic font-serif text-lg mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Here's to forever and a day.
                </motion.p>

                <motion.div
                  className="flex justify-center gap-4 flex-wrap mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  {["💕", "🌹", "✨", "💫", "🥂", "💖", "🌸", "⭐"].map(
                    (e, i) => (
                      <motion.span
                        key={i}
                        style={{ fontSize: "1.8rem" }}
                        animate={{
                          y: [0, -18, 0],
                          rotate: [0, 20, -20, 0],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2.2,
                          delay: i * 0.12,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {e}
                      </motion.span>
                    ),
                  )}
                </motion.div>
                <motion.button
                  onClick={handleReset}
                  className="text-rose-300/30 text-xs font-sans border border-rose-300/15 rounded-full px-5 py-2 hover:border-rose-300/40 transition-all hover:scale-105"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  ↺ Experience Again
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Keyboard hint */}
      {currentSlide === 0 && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 text-rose-300/30 text-xs font-sans tracking-widest z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ delay: 2, duration: 3, repeat: Infinity }}
        >
          ↑ ↓ or click nav dots to navigate
        </motion.div>
      )}
    </div>
  );

  function handleReset() {
    setCurrentSlide(0);
    setFinaleActive(false);
    setCandleBlown(false);
    setShowSmoke(false);
    setGardenRun(false);
  }
}
