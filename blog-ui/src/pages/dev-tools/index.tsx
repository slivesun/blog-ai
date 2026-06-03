import React, { useState, useEffect, useRef } from "react";
import { calculateMD5, calculateSHA256 } from "../../utils";
import { SystemSettings } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import {
  Binary,
  Hash,
  Globe,
  Sliders,
  Braces,
  KeyRound,
  Copy,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react";

interface DevToolsProps {
  settings: SystemSettings;
}

type DevToolType = "base64" | "md5-sha" | "url-codec" | "shader" | "json-formatter" | "uuid-generator";

export default function DevToolsView({ settings }: DevToolsProps) {
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<DevToolType>("base64");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const displayCopyFeedback = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const [b64Input, setB64Input] = useState("PortalCore Systems - Built client side");
  const [b64Output, setB64Output] = useState("");
  const [b64Error, setB64Error] = useState<string | null>(null);

  const handleB64Encode = () => {
    try {
      setB64Error(null);
      const encoded = btoa(unescape(encodeURIComponent(b64Input)));
      setB64Output(encoded);
    } catch (err: any) {
      setB64Error("Invalid character set for native Base64 encoding.");
    }
  };

  const handleB64Decode = () => {
    try {
      setB64Error(null);
      const decoded = decodeURIComponent(escape(atob(b64Input)));
      setB64Output(decoded);
    } catch (err: any) {
      setB64Error("Unable to decode input: String is not valid Base64.");
    }
  };

  const handleB64Swap = () => {
    setB64Input(b64Output);
    setB64Output("");
  };

  const [hashInput, setHashInput] = useState("PortalCore Root Authorization Node");
  const [md5Hash, setMd5Hash] = useState("");
  const [shaHash, setShaHash] = useState("");

  const recomputeHashes = async () => {
    const md5Result = calculateMD5(hashInput);
    const shaResult = await calculateSHA256(hashInput);
    setMd5Hash(md5Result);
    setShaHash(shaResult);
  };

  useEffect(() => {
    recomputeHashes();
  }, [hashInput]);

  const [urlInput, setUrlInput] = useState("https://portalcore.systems/api/mesh?node=4&cluster=alpha west");
  const [urlOutput, setUrlOutput] = useState("");

  const handleUrlEncode = () => {
    setUrlOutput(encodeURIComponent(urlInput));
  };

  const handleUrlDecode = () => {
    try {
      setUrlOutput(decodeURIComponent(urlInput));
    } catch (e) {
      setUrlOutput("Error parsing URL: Hex encoding mismatch.");
    }
  };

  const [shaderPreset, setShaderPreset] = useState<"cosmic" | "cyber" | "plasma" | "emerald">("cosmic");
  const [shaderSpeed, setShaderSpeed] = useState(20);
  const [shaderDensity, setShaderDensity] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shaderPresets = {
    cosmic: {
      title: "Cosmic Swirl",
      code: `// Fragment shader simulation kernel \n\nvec4 mainImage(vec2 uv) {\n  float speed = time * 0.05;\n  float dist = length(uv - 0.5);\n  float swirl = sin(dist * density - speed);\n  return vec4(swirl * 0.4, swirl * 0.1, swirl * 0.8, 1.0);\n}`
    },
    cyber: {
      title: "Cyber Gradients",
      code: `// Fragment shader simulation kernel \n\nvec4 mainImage(vec2 uv) {\n  float speed = time * 0.08;\n  float horizontal = sin(uv.x * density + speed);\n  float vertical = cos(uv.y * density - speed);\n  return vec4(horizontal * 0.7, 0.0, vertical * 0.6, 1.0);\n}`
    },
    plasma: {
      title: "Plasma Ripples",
      code: `// Fragment shader simulation kernel \n\nvec4 mainImage(vec2 uv) {\n  float speed = time * 0.1;\n  float wave = sin(uv.x * density + speed) + cos(uv.y * density + speed);\n  return vec4(wave * 0.5, wave * 0.5, 0.0, 1.0);\n}`
    },
    emerald: {
      title: "Terminal Echoes",
      code: `// Fragment shader simulation kernel \n\nvec4 mainImage(vec2 uv) {\n  float speed = time * 0.02;\n  float matrix = sin(uv.y * density + speed) * cos(uv.x * density);\n  return vec4(0.0, matrix * 0.8, 0.0, 1.0);\n}`
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += shaderSpeed * 0.1;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const densityVal = shaderDensity * 0.5;

      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const uvX = x / width;
          const uvY = y / height;

          let r = 0, g = 0, b = 0;

          if (shaderPreset === "cosmic") {
            const dist = Math.sqrt(Math.pow(uvX - 0.5, 2) + Math.pow(uvY - 0.5, 2));
            const swirl = Math.sin(dist * densityVal - time * 0.1);
            r = Math.floor((swirl + 1) * 128);
            g = Math.floor((Math.cos(time * 0.05) + 1) * 30);
            b = Math.floor((Math.sin(time * 0.03) + 1) * 200 + dist * 50);
          } else if (shaderPreset === "cyber") {
            const gridH = Math.sin(uvX * densityVal + time * 0.15);
            const gridV = Math.cos(uvY * densityVal - time * 0.1);
            r = Math.floor((gridH + 1) * 180);
            g = 15;
            b = Math.floor((gridV + 1) * 140);
          } else if (shaderPreset === "plasma") {
            const wave = Math.sin(uvX * densityVal + time * 0.2) + Math.sin(uvY * densityVal + time * 0.1);
            r = Math.floor((wave + 2) * 60);
            g = Math.floor((wave + 2) * 60);
            b = 40;
          } else if (shaderPreset === "emerald") {
            const stream = Math.sin(uvY * densityVal + time * 0.06) * Math.cos(uvX * 8);
            r = 10;
            g = Math.floor((stream + 1) * 130 + 40);
            b = 10;
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, 4, 4);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [shaderPreset, shaderSpeed, shaderDensity, activeTool]);

  const [jsonInput, setJsonInput] = useState(`{"node": 105, "status": "nominal", "routing": ["cluster-alpha", "cluster-beta"], "spec": {"frequency_ms": 100, "secure": true}}`);
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSpaces, setJsonSpaces] = useState(2);

  const handleFormatJSON = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, jsonSpaces));
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON syntax. Parser failed.");
    }
  };

  const handleMinifyJSON = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON syntax. Minifier failed.");
    }
  };

  const [uuidCount, setUuidCount] = useState(5);
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);

  const triggerUuidGeneration = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      list.push(uuid);
    }
    setGeneratedUuids(list);
  };

  useEffect(() => {
    if (generatedUuids.length === 0) {
      triggerUuidGeneration();
    }
  }, [uuidCount]);

  const toolOptions = [
    { id: "base64" as DevToolType, label: t.devTools.tools.base64.label, icon: <Binary className="w-4 h-4" />, desc: t.devTools.tools.base64.desc },
    { id: "md5-sha" as DevToolType, label: t.devTools.tools.hash.label, icon: <Hash className="w-4 h-4" />, desc: t.devTools.tools.hash.desc },
    { id: "url-codec" as DevToolType, label: t.devTools.tools.url.label, icon: <Globe className="w-4 h-4" />, desc: t.devTools.tools.url.desc },
    { id: "shader" as DevToolType, label: t.devTools.tools.shader.label, icon: <Sliders className="w-4 h-4" />, desc: t.devTools.tools.shader.desc },
    { id: "json-formatter" as DevToolType, label: t.devTools.tools.json.label, icon: <Braces className="w-4 h-4" />, desc: t.devTools.tools.json.desc },
    { id: "uuid-generator" as DevToolType, label: t.devTools.tools.uuid.label, icon: <KeyRound className="w-4 h-4" />, desc: t.devTools.tools.uuid.desc },
  ];

  const sidebarBorders = {
    cyan: "border-cyan-500 bg-cyan-500/10 text-cyan-400",
    violet: "border-violet-500 bg-violet-500/10 text-violet-400",
    amber: "border-amber-500 bg-amber-500/10 text-amber-400",
    emerald: "border-emerald-500 bg-emerald-500/10 text-emerald-400"
  };

  const borderAccents = {
    cyan: "hover:border-cyan-500/30",
    violet: "hover:border-violet-500/30",
    amber: "hover:border-amber-500/30",
    emerald: "hover:border-emerald-500/30"
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="devtools-main-workspace">
      
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white mb-2">
          {t.devTools.title}
        </h1>
        <p className="text-sm text-slate-400 font-sans max-w-2xl font-light">
          {t.devTools.subtitle}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-3 pl-2">{t.devTools.console}</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {toolOptions.map((tool) => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  id={`devtools-selector-${tool.id}`}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setCopiedText(null);
                  }}
                  className={`flex items-center gap-3 w-full rounded-xl border text-left p-3.5 transition-all text-xs font-semibold cursor-pointer ${
                    isActive
                      ? sidebarBorders[settings.themeAccent]
                      : `border-slate-800 bg-slate-900/10 text-slate-400 hover:bg-slate-900/30 hover:text-white ${borderAccents[settings.themeAccent]}`
                  }`}
                >
                  <div className="shrink-0">{tool.icon}</div>
                  <div>
                    <span>{tool.label}</span>
                    <p className="text-[10px] text-slate-500 group-hover:text-slate-400 font-light font-sans hidden lg:block mt-0.5">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/10 p-6 sm:p-8 min-w-0" id="devtools-active-stage">
          
          {activeTool === "base64" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.base64.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={4}
                  value={b64Input}
                  onChange={(e) => setB64Input(e.target.value)}
                  placeholder={t.devTools.tools.base64.placeholder}
                />
              </div>

              {b64Error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>{b64Error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-slate-800/60">
                <button
                  onClick={handleB64Encode}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono transition-transform active:scale-95 cursor-pointer"
                >
                  {t.devTools.tools.base64.encode}
                </button>
                <button
                  onClick={handleB64Decode}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono transition-transform active:scale-95 cursor-pointer"
                >
                  {t.devTools.tools.base64.decode}
                </button>
                <button
                  onClick={handleB64Swap}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                >
                  {t.devTools.tools.base64.swap}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.base64.output}</dt>
                  {b64Output && (
                    <button
                      onClick={() => displayCopyFeedback(b64Output)}
                      className="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                    >
                      {copiedText === b64Output ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{t.devTools.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.devTools.tools.base64.copy}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="w-full rounded-xl bg-slate-950 border border-slate-850 p-4 min-h-[80px] font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all select-all">
                  {b64Output || (
                    <span className="text-slate-600 italic">{t.devTools.tools.base64.empty}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTool === "md5-sha" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.hash.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-sans"
                  rows={3}
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="Paste contents here. Hash values compute in real-time."
                />
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-950/40 border border-sky-800/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-sky-400">MD5</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">{t.devTools.tools.hash.md5}</span>
                  </div>
                  <button
                    onClick={() => displayCopyFeedback(md5Hash)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    {copiedText === md5Hash ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs font-mono text-emerald-400 break-all select-all">{md5Hash || t.devTools.tools.hash.calculating}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-fuchsia-950/40 border border-fuchsia-800/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-fuchsia-400">SHA256</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">{t.devTools.tools.hash.sha256}</span>
                  </div>
                  <button
                    onClick={() => displayCopyFeedback(shaHash)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    {copiedText === shaHash ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs font-mono text-fuchsia-400 break-all select-all">{shaHash || t.devTools.tools.hash.shaCalculating}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900/40 rounded-lg p-3">
                <Info className="w-4 h-4 shrink-0 text-slate-400" />
                <span>{t.devTools.tools.hash.note}</span>
              </div>
            </div>
          )}

          {activeTool === "url-codec" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.url.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={3}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t.devTools.tools.url.placeholder}
                />
              </div>

              <div className="flex gap-2 pb-6 border-b border-slate-800/60">
                <button
                  onClick={handleUrlEncode}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                >
                  {t.devTools.tools.url.encode}
                </button>
                <button
                  onClick={handleUrlDecode}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                >
                  {t.devTools.tools.url.decode}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.url.output}</dt>
                  {urlOutput && (
                    <button
                      onClick={() => displayCopyFeedback(urlOutput)}
                      className="text-slate-500 hover:text-white flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                    >
                      {copiedText === urlOutput ? <span className="text-emerald-400">{t.devTools.copied}</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="w-full rounded-xl bg-slate-950 border border-slate-850 p-4 min-h-[60px] font-mono text-xs text-amber-400 break-all select-all">
                  {urlOutput || <span className="text-slate-600 italic">{t.devTools.tools.url.empty}</span>}
                </div>
              </div>
            </div>
          )}

          {activeTool === "shader" && (
            <div className="space-y-6">
              <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={176}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-950/75 rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-300 border border-slate-800/60 flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {t.devTools.tools.shader.preview}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-slate-400 text-xs font-mono uppercase">
                    <span>{t.devTools.tools.shader.speed}</span>
                    <span>{shaderSpeed * 5}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={shaderSpeed}
                    onChange={(e) => setShaderSpeed(Number(e.target.value))}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1 text-slate-400 text-xs font-mono uppercase">
                    <span>{t.devTools.tools.shader.density}</span>
                    <span>{shaderDensity}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={shaderDensity}
                    onChange={(e) => setShaderDensity(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.shader.presets}</dt>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(shaderPresets) as Array<keyof typeof shaderPresets>).map((key) => {
                    const active = shaderPreset === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setShaderPreset(key)}
                        className={`rounded-lg py-2 text-xs font-mono transition-colors text-center border cursor-pointer ${
                          active
                            ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                        }`}
                      >
                        {shaderPresets[key].title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.shader.code}</dt>
                <pre className="rounded-xl border border-slate-850 bg-slate-950 p-4 text-[10px] sm:text-xs font-mono text-slate-400 overflow-x-auto select-all leading-tight">
                  {shaderPresets[shaderPreset].code}
                </pre>
              </div>
            </div>
          )}

          {activeTool === "json-formatter" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.json.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={4}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={t.devTools.tools.json.placeholder}
                />
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-500 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800/60">
                <div className="flex gap-2">
                  <button
                    onClick={handleFormatJSON}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                  >
                    {t.devTools.tools.json.format}
                  </button>
                  <button
                    onClick={handleMinifyJSON}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-mono cursor-pointer"
                  >
                    {t.devTools.tools.json.minify}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 font-light">{t.devTools.tools.json.indent}</span>
                  <select
                    className="rounded bg-slate-950 border border-slate-800 text-xs px-2 py-1 text-slate-300 font-mono"
                    value={jsonSpaces}
                    onChange={(e) => setJsonSpaces(Number(e.target.value))}
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.json.output}</dt>
                  {jsonOutput && (
                    <button
                      onClick={() => displayCopyFeedback(jsonOutput)}
                      className="text-slate-500 hover:text-white flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                    >
                      {copiedText === jsonOutput ? <span className="text-emerald-400 animate-pulse">{t.devTools.copied}</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="w-full rounded-xl bg-slate-950 border border-slate-850 p-4 min-h-[140px] max-h-[300px] overflow-y-auto font-mono text-xs text-cyan-400 select-all leading-relaxed whitespace-pre-wrap">
                  {jsonOutput ? (
                    jsonOutput
                  ) : (
                    <span className="text-slate-600 italic">{t.devTools.tools.json.empty}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTool === "uuid-generator" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 uppercase">{t.devTools.tools.uuid.quantity}</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-16 rounded-lg bg-slate-950 border border-slate-850 p-1.5 text-center text-sm text-white font-mono"
                    value={uuidCount}
                    onChange={(e) => setUuidCount(Math.min(30, Math.max(1, Number(e.target.value))))}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={triggerUuidGeneration}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.devTools.tools.uuid.regenerate}
                  </button>
                  <button
                    onClick={() => {
                      const all = generatedUuids.join("\n");
                      displayCopyFeedback(all);
                    }}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 rounded-lg px-4 py-2 text-xs font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t.devTools.tools.uuid.copyAll}
                  </button>
                </div>
              </div>

              {copiedText?.includes("\n") && (
                <div className="rounded bg-emerald-950/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400 text-center animate-pulse">
                  {t.devTools.tools.uuid.copySuccess.replace("{count}", generatedUuids.length.toString())}
                </div>
              )}

              <div className="space-y-2">
                {generatedUuids.map((uuid, i) => (
                  <div key={uuid} className="rounded-xl border border-slate-850 bg-slate-950/70 p-3 sm:p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-600">[{i + 1}]</span>
                      <span className="text-xs sm:text-sm font-mono text-white select-all break-all">{uuid}</span>
                    </div>

                    <button
                      onClick={() => displayCopyFeedback(uuid)}
                      className="text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedText === uuid ? (
                        <span className="text-[10px] font-mono text-emerald-400">{t.devTools.copied}</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}