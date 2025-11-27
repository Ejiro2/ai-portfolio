"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  Final interactive portfolio page with:
  - Inline Lottie animation (uses lottie-web if available; falls back to CSS mesh)
  - Robust theme toggle (no SSR errors, persisted in localStorage)
  - Smooth scrolling + ScrollSpy active link highlighting
  - Custom cursor + subtle parallax background
  - Professional, minimal animations and interactions

  NOTE: For the Lottie animation to render you should install `lottie-web` locally
  (npm i lottie-web) so the dynamic import resolves in your environment. If
  `lottie-web` is not available the page will quietly fall back to a CSS animated
  gradient hero visual. This keeps the page safe in sandbox/build systems.
*/

type Project = {
  id: string;
  title: string;
  description: string;
  stack: string[];
  repo?: string;
  demo?: string;
};

const PROJECTS: Project[] = [
  { id: "p1", title: "AI Engineer's Python Toolkit", description: "Reusable Jupyter notebooks and utility modules for data cleaning, EDA, and preprocessing.", stack: ["Python", "Jupyter", "Pandas"], repo: "#" },
  { id: "p2", title: "Fake News NLP Classifier", description: "TF-IDF + logistic regression pipeline for detecting fake news headlines.", stack: ["NLTK", "scikit-learn"], repo: "#" },
  { id: "p3", title: "LLM Study Assistant", description: "RAG-powered chatbot that summarizes PDFs and answers study questions.", stack: ["LangChain", "HF Models", "Chroma"], repo: "#" },
  { id: "p4", title: "Speech-to-Text Dashboard", description: "Whisper-based transcription, summarization, and playback demo.", stack: ["Whisper", "Streamlit"], repo: "#" },
  { id: "p5", title: "Semantic Course Search", description: "Semantic search over course content using embeddings + vector DB.", stack: ["OpenAI Embeddings", "Pinecone"], repo: "#" },
  { id: "p6", title: "Resume AI Analyzer", description: "Embedding-based resume scorer with GPT explainability layer.", stack: ["LangChain", "OpenAI"], repo: "#" },
];

// Inline Lottie JSON (trimmed/simplified version of the ai-brain animation provided)
const AI_LOTTIE_JSON = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 240,
  w: 600,
  h: 600,
  nm: "AI Brain Circuit",
  ddd: 0,
  assets: [],
  layers: [
    { ddd: 0, ind: 1, ty: 4, nm: "Brain Outline", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [300, 300, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, shapes: [{ ty: "sh", ks: { a: 1, k: [{ i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 0, s: [{ i: [[0, 0], [50, -80], [80, 0], [30, 80], [-80, 100]], o: [[0, 0], [-40, 90], [-80, 0], [-30, -60], [70, -90]], v: [[-80, -100], [80, -80], [140, 0], [80, 120], [-80, 80]], c: true }] }, { t: 240, s: [{ i: [[0, 0], [50, -80], [80, 0], [30, 80], [-80, 100]], o: [[0, 0], [-40, 90], [-80, 0], [-30, -60], [70, -90]], v: [[-80, -100], [80, -80], [140, 0], [80, 120], [-80, 80]], c: true }] }] }, nm: "Brain Path" }, { ty: "st", c: { a: 0, k: [0.169, 0.349, 0.42, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 6 } }], ao: 0 }, { ddd: 0, ind: 2, ty: 4, nm: "Circuits Glow", sr: 1, ks: { o: { a: 1, k: [{ t: 0, s: [0] }, { t: 120, s: [100] }, { t: 240, s: [0] }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [300, 300, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, shapes: [{ ty: "gr", it: [{ ty: "sh", ks: { a: 0, k: { i: [[0, 0]], o: [[0, 0]], v: [[0, 0]], c: false } } }, { ty: "fl", c: { a: 0, k: [0.168, 0.6, 1, 1] }, o: { a: 0, k: 100 } }] }], ao: 0 }], markers: []
};

export default function HomePage() {
  // theme handling: hydrated ensures we only read localStorage on client
  const [hydrated, setHydrated] = useState(false);
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Project[]>(PROJECTS);
  const [activeSection, setActiveSection] = useState<string>("home");

  const lottieContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);

  // Theme: run on client only
  useEffect(() => {
    setHydrated(true);
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("pref-theme");
      if (saved === "dark") setDark(true);
      else if (saved === "light") setDark(false);
      else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(!!prefersDark);
      }
    } catch (e) {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
    try {
      window.localStorage.setItem("pref-theme", dark ? "dark" : "light");
    } catch (e) { }
  }, [dark]);

  // Filtering
  useEffect(() => {
    if (!query) return setFiltered(PROJECTS);
    const q = query.toLowerCase();
    setFiltered(PROJECTS.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.stack.join(" ").toLowerCase().includes(q)));
  }, [query]);

  // Smooth cursor & parallax
  useEffect(() => {
    if (typeof window === "undefined") return;
    let req: number | null = null;
    let mouseX = 0, mouseY = 0, cx = 0, cy = 0;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      cx += (mouseX - cx) * 0.16;
      cy += (mouseY - cy) * 0.16;
      if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${cx - 8}px, ${cy - 8}px, 0)`;
      if (parallaxRef.current) {
        const px = (mouseX / window.innerWidth - 0.5) * 10;
        const py = (mouseY / window.innerHeight - 0.5) * 6;
        parallaxRef.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      }
      req = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMove);
    req = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); if (req) cancelAnimationFrame(req); };
  }, []);

  // Lottie: dynamic import; fallback to CSS if unavailable
  useEffect(() => {
    let anim: any = null;
    let canceled = false;
    async function mount() {
      if (!lottieContainerRef.current) return;
      try {
        // try dynamic import of lottie-web
        const lottieModule = await import("lottie-web");
        // some bundlers/types export lottie as default, others as the module itself — normalize and cast to any
        const lottie = (lottieModule && (lottieModule as any).default) || (lottieModule as any);
        if (canceled) return;
        anim = lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: AI_LOTTIE_JSON,
        });
        // hide the CSS fallback if lottie successfully loaded
        const root = lottieContainerRef.current.parentElement;
        const fallback = root?.querySelector('.lottie-fallback') as HTMLElement | null;
        if (fallback) fallback.style.display = 'none';
      } catch (err) {
        // failed to load lottie-web (e.g., not installed) — keep CSS fallback
        console.warn("lottie-web not available; using CSS fallback animation.");
        // ensure fallback is visible
        const root = lottieContainerRef.current?.parentElement;
        const fallback = root?.querySelector('.lottie-fallback') as HTMLElement | null;
        if (fallback) fallback.style.display = 'block';
      }
    }
    mount();
    return () => { canceled = true; if (anim) anim.destroy && anim.destroy(); };
  }, []);

  // ScrollSpy: observe sections and set active nav link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = ["home", "projects", "skills", "about", "contact"];
    const options = { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, options);

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // smooth scroll helper
  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Motion variants
  const heroVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const cardVariants = { hidden: { opacity: 0, y: 8 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }) };

  return (
    <main id="home" className="min-h-screen relative overflow-hidden bg-white dark:bg-[#06121b] text-gray-900 dark:text-gray-100">
      {/* Parallax decorative layer */}
      <div aria-hidden ref={parallaxRef} className="pointer-events-none absolute inset-0 -z-10 transition-transform duration-200" />

      {/* custom cursor */}
      <div ref={cursorRef} className="fixed z-50 w-4 h-4 rounded-full bg-[#2b596b] mix-blend-exclusion pointer-events-none transform-gpu transition-transform" />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* NAV */}
        <nav className="flex items-center justify-between mb-8" aria-label="Main navigation">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: "#2b596b" }}>Eng Fortune Abohwo</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Engineer • NLP & LLM Specialist</p>
          </div>

          <div className="flex items-center gap-3">
            {hydrated && (
              <div className="hidden sm:flex items-center gap-3 border border-transparent rounded-md bg-transparent p-1">
                <button onClick={() => { scrollToId("projects"); }} className={`px-3 py-2 rounded-md ${activeSection === "projects" ? "bg-[#2b596b] text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>Projects</button>
                <button onClick={() => { scrollToId("skills"); }} className={`px-3 py-2 rounded-md ${activeSection === "skills" ? "bg-[#2b596b] text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>Skills</button>
                <button onClick={() => { scrollToId("about"); }} className={`px-3 py-2 rounded-md ${activeSection === "about" ? "bg-[#2b596b] text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>About</button>
                <button onClick={() => { scrollToId("contact"); }} className={`px-3 py-2 rounded-md ${activeSection === "contact" ? "bg-[#2b596b] text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>Contact</button>
              </div>
            )}

            <button onClick={() => setDark((d) => !d)} aria-label="Toggle theme" className="px-3 py-2 rounded-md bg-[#2b596b] text-white hover:scale-105 transition-transform">{dark ? 'Dark' : 'Light'}</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          <motion.div className="md:col-span-2" initial="hidden" animate="visible" variants={heroVariants}>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">Building intelligent systems that understand, reason, and assist.</h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mb-6">I design and ship NLP and LLM-powered applications—RAG systems, semantic search, and multimodal assistants—focusing on clean code, reproducibility, and deployable demos.</p>

            <div className="flex gap-3">
              <button onClick={() => scrollToId('projects')} className="px-5 py-3 rounded-md bg-[#2b596b] text-white shadow hover:translate-y-[-1px] transition-transform">See work</button>
              <button onClick={() => scrollToId('contact')} className="px-5 py-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Contact</button>
            </div>
          </motion.div>

          {/* Lottie container (inline JSON) with CSS fallback */}
          <motion.div className="rounded-xl p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#071018] shadow-sm flex items-center justify-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ width: 220, height: 220 }}>
              <div ref={lottieContainerRef} style={{ width: '100%', height: '100%', display: 'block' }} />

              {/* CSS fallback: animated gradient mesh (visible if lottie-web not available) */}
              <div className="lottie-fallback absolute inset-0 w-[220px] h-[220px] rounded-full bg-gradient-to-tr from-[#e6f6f6] to-[#dff3ee] opacity-90 dark:opacity-10 blur-lg" aria-hidden />
            </div>
          </motion.div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Projects</h3>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects or tech..." className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#06121b] focus:outline-none focus:ring-2 focus:ring-[#2b596b]/30" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.article key={p.id} layout initial="hidden" animate="visible" exit={{ opacity: 0, y: 8 }} variants={cardVariants} custom={i} whileHover={{ scale: 1.02 }} className="relative rounded-2xl p-5 bg-white dark:bg-[#041018] border border-gray-100 dark:border-gray-800 shadow-md overflow-hidden transform-gpu">
                  <h4 className="text-lg font-semibold mb-1 text-[#2b596b]">{p.title}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{p.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.stack.map((t) => (<span key={t} className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">{t}</span>))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <a href={p.repo} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 transition">View Repo</a>
                    {p.demo ? (<a href={p.demo} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md bg-[#2b596b] text-white text-sm hover:opacity-95 transition">Live</a>) : (<span className="text-xs text-gray-400">No demo</span>)}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Skills & Tools</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["Python", "NLP", "LLMs", "LangChain", "Pinecone", "HF Models", "Whisper", "Streamlit"].map((s) => (
              <motion.div key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="p-3 rounded-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#041018] text-center shadow-sm">
                <div className="font-medium">{s}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="mb-12">
          <h3 className="text-xl font-semibold mb-3">About</h3>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>Hi — I'm <strong>Eng Fortune Abohwo</strong>, an AI Engineer focused on practical NLP and LLM systems. I build end-to-end applications that combine data pipelines, embeddings, RAG, and multimodal interfaces. I emphasize reproducible notebooks, clean engineering, and deployable demos.</p>
            <ul>
              <li>Data processing & feature engineering</li>
              <li>Model training, fine-tuning, and evaluation</li>
              <li>Retrieval-Augmented Generation & semantic search</li>
              <li>Speech recognition and multimodal prototype systems</li>
            </ul>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="mb-12">
          <h3 className="text-xl font-semibold mb-3">Contact</h3>
          <p className="text-gray-700 dark:text-gray-300">Email: <a href="mailto:ejiroabohwo2@gmail.com" className="underline">ejiroabohwo2@gmail.com</a></p>
          <p className="text-gray-700 dark:text-gray-300">LinkedIn: <a href="https://www.linkedin.com/in/ejiro2" target="_blank" rel="noreferrer" className="underline">linkedin.com/in/ejiro2</a></p>
        </section>

        <footer className="py-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} Eng Fortune Abohwo — AI Engineer</footer>
      </div>

      {/* small styles for CSS fallback + minor enhancements (scoped inline) */}
      <style jsx>{`
        .lottie-fallback { display: none; }
        @media (prefers-reduced-motion: reduce) { .lottie-fallback { display: block; } }
        /* if lottie-web isn't present the fallback will show via JS by removing display:none */
      `}</style>
    </main>
  );
}
