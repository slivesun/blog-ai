import React, { useState, useEffect, useRef, useCallback } from "react";
import { calculateMD5, calculateSHA256 } from "../../utils";
import { SystemSettings } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { QRCodeSVG } from "qrcode.react";
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
  Info,
  Clock,
  Image,
  Palette,
  FileDiff,
  FileText,
  Regex,
  QrCode,
  Code
} from "lucide-react";

interface DevToolsProps {
  settings: SystemSettings;
}

type DevToolType =
  | "base64"
  | "md5-sha"
  | "url-codec"
  | "shader"
  | "json-formatter"
  | "uuid-generator"
  | "code-beautifier"
  | "base-converter"
  | "timestamp"
  | "image-compress"
  | "color-picker"
  | "text-diff"
  | "char-counter"
  | "qr-code"
  | "regex-tester";

export default function DevToolsView({ settings }: DevToolsProps) {
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<DevToolType>("base64");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const displayCopyFeedback = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // HTTP 环境降级方案
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // ─── Base64 ───────────────────────────────────────────────────────────────────
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

  // ─── Hash ─────────────────────────────────────────────────────────────────────
  const [hashInput, setHashInput] = useState("PortalCore Root Authorization Node");
  const [md5Hash, setMd5Hash] = useState("");
  const [shaHash, setShaHash] = useState("");
  const [sha1Hash, setSha1Hash] = useState("");
  const [sha512Hash, setSha512Hash] = useState("");

  const recomputeHashes = async () => {
    const md5Result = calculateMD5(hashInput);
    const sha256Result = await calculateSHA256(hashInput);
    setMd5Hash(md5Result);
    setShaHash(sha256Result);

    // SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    try {
      const sha1Buffer = await crypto.subtle.digest("SHA-1", data);
      setSha1Hash(Array.from(new Uint8Array(sha1Buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""));
    } catch {
      setSha1Hash("");
    }

    // SHA-512
    try {
      const sha512Buffer = await crypto.subtle.digest("SHA-512", data);
      setSha512Hash(Array.from(new Uint8Array(sha512Buffer)).map((b) => b.toString(16).padStart(2, "0")).join(""));
    } catch {
      setSha512Hash("");
    }
  };

  useEffect(() => {
    recomputeHashes();
  }, [hashInput]);

  // ─── URL Codec ────────────────────────────────────────────────────────────────
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

  // ─── Shader ───────────────────────────────────────────────────────────────────
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

  // ─── JSON Formatter ───────────────────────────────────────────────────────────
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

  // ─── UUID Generator ──────────────────────────────────────────────────────────
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

  // ─── Code Beautifier ─────────────────────────────────────────────────────────
  const [beautifierInput, setBeautifierInput] = useState("");
  const [beautifierOutput, setBeautifierOutput] = useState("");
  const [beautifierError, setBeautifierError] = useState<string | null>(null);

  const handleBeautifierFormat = () => {
    try {
      setBeautifierError(null);
      const parsed = JSON.parse(beautifierInput);
      setBeautifierOutput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setBeautifierError(e.message || t.devTools.tools.codeBeautifier.error);
    }
  };

  const handleBeautifierMinify = () => {
    try {
      setBeautifierError(null);
      const parsed = JSON.parse(beautifierInput);
      setBeautifierOutput(JSON.stringify(parsed));
    } catch (e: any) {
      setBeautifierError(e.message || t.devTools.tools.codeBeautifier.error);
    }
  };

  // ─── Base Converter ──────────────────────────────────────────────────────────
  const [binValue, setBinValue] = useState("");
  const [octValue, setOctValue] = useState("");
  const [decValue, setDecValue] = useState("");
  const [hexValue, setHexValue] = useState("");
  const [baseConverterError, setBaseConverterError] = useState<string | null>(null);

  const updateFromBin = (val: string) => {
    setBinValue(val);
    if (!val) {
      setOctValue(""); setDecValue(""); setHexValue(""); setBaseConverterError(null);
      return;
    }
    const parsed = parseInt(val, 2);
    if (isNaN(parsed)) { setBaseConverterError(t.devTools.tools.baseConverter.error); return; }
    setBaseConverterError(null);
    setOctValue(parsed.toString(8));
    setDecValue(parsed.toString(10));
    setHexValue(parsed.toString(16).toUpperCase());
  };

  const updateFromOct = (val: string) => {
    setOctValue(val);
    if (!val) {
      setBinValue(""); setDecValue(""); setHexValue(""); setBaseConverterError(null);
      return;
    }
    const parsed = parseInt(val, 8);
    if (isNaN(parsed)) { setBaseConverterError(t.devTools.tools.baseConverter.error); return; }
    setBaseConverterError(null);
    setBinValue(parsed.toString(2));
    setDecValue(parsed.toString(10));
    setHexValue(parsed.toString(16).toUpperCase());
  };

  const updateFromDec = (val: string) => {
    setDecValue(val);
    if (!val) {
      setBinValue(""); setOctValue(""); setHexValue(""); setBaseConverterError(null);
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) { setBaseConverterError(t.devTools.tools.baseConverter.error); return; }
    setBaseConverterError(null);
    setBinValue(parsed.toString(2));
    setOctValue(parsed.toString(8));
    setHexValue(parsed.toString(16).toUpperCase());
  };

  const updateFromHex = (val: string) => {
    setHexValue(val);
    if (!val) {
      setBinValue(""); setOctValue(""); setDecValue(""); setBaseConverterError(null);
      return;
    }
    const parsed = parseInt(val, 16);
    if (isNaN(parsed)) { setBaseConverterError(t.devTools.tools.baseConverter.error); return; }
    setBaseConverterError(null);
    setBinValue(parsed.toString(2));
    setOctValue(parsed.toString(8));
    setDecValue(parsed.toString(10));
  };

  // ─── Timestamp ────────────────────────────────────────────────────────────────
  const [tsUnixInput, setTsUnixInput] = useState("");
  const [tsDateInput, setTsDateInput] = useState("");
  const [tsMode, setTsMode] = useState<"s" | "ms">("s");

  const handleTsToDate = () => {
    const num = Number(tsUnixInput);
    if (isNaN(num)) return;
    const ms = tsMode === "s" ? num * 1000 : num;
    const date = new Date(ms);
    setTsDateInput(date.toLocaleString());
  };

  const handleTsToUnix = () => {
    const date = new Date(tsDateInput);
    if (isNaN(date.getTime())) return;
    const val = tsMode === "s" ? Math.floor(date.getTime() / 1000) : date.getTime();
    setTsUnixInput(val.toString());
  };

  const handleTsNow = () => {
    const now = Date.now();
    const val = tsMode === "s" ? Math.floor(now / 1000) : now;
    setTsUnixInput(val.toString());
    setTsDateInput(new Date(now).toLocaleString());
  };

  // ─── Image Compress ──────────────────────────────────────────────────────────
  const [imageOriginal, setImageOriginal] = useState<string | null>(null);
  const [imageCompressed, setImageCompressed] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState(0.7);
  const [imageMaxWidth, setImageMaxWidth] = useState(1200);
  const [imageOriginalSize, setImageOriginalSize] = useState(0);
  const [imageCompressedSize, setImageCompressedSize] = useState(0);
  const imageFileRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageOriginal(ev.target?.result as string);
      setImageCompressed(null);
      setImageCompressedSize(0);
    };
    reader.readAsDataURL(file);
  };

  const handleImageCompress = () => {
    if (!imageOriginal) return;
    const img = new window.Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > imageMaxWidth) {
        h = Math.round((h * imageMaxWidth) / w);
        w = imageMaxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", imageQuality);
      setImageCompressed(dataUrl);
      // estimate size from base64
      const base64 = dataUrl.split(",")[1] || "";
      setImageCompressedSize(Math.round((base64.length * 3) / 4));
    };
    img.src = imageOriginal;
  };

  const handleImageDownload = () => {
    if (!imageCompressed) return;
    const a = document.createElement("a");
    a.href = imageCompressed;
    a.download = "compressed.jpg";
    a.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // ─── Color Picker ────────────────────────────────────────────────────────────
  const [colorHex, setColorHex] = useState("#3b82f6");
  const [colorR, setColorR] = useState(59);
  const [colorG, setColorG] = useState(130);
  const [colorB, setColorB] = useState(246);
  const [colorHslH, setColorHslH] = useState(0);
  const [colorHslS, setColorHslS] = useState(0);
  const [colorHslL, setColorHslL] = useState(0);

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("");
  };

  const hexToRgb = (hex: string) => {
    const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return null;
    return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const updateColorFromRgb = useCallback((r: number, g: number, b: number) => {
    setColorR(r); setColorG(g); setColorB(b);
    setColorHex(rgbToHex(r, g, b));
    const hsl = rgbToHsl(r, g, b);
    setColorHslH(hsl.h); setColorHslS(hsl.s); setColorHslL(hsl.l);
  }, []);

  const updateColorFromHex = useCallback((hex: string) => {
    setColorHex(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setColorR(rgb.r); setColorG(rgb.g); setColorB(rgb.b);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setColorHslH(hsl.h); setColorHslS(hsl.s); setColorHslL(hsl.l);
    }
  }, []);

  useEffect(() => {
    updateColorFromRgb(colorR, colorG, colorB);
  }, []);

  // ─── Text Diff ────────────────────────────────────────────────────────────────
  const [diffOriginal, setDiffOriginal] = useState("");
  const [diffModified, setDiffModified] = useState("");
  const [diffResult, setDiffResult] = useState<{ type: string; text: string }[] | null>(null);

  const handleTextDiff = () => {
    const origLines = diffOriginal.split("\n");
    const modLines = diffModified.split("\n");
    const result: { type: string; text: string }[] = [];
    const maxLen = Math.max(origLines.length, modLines.length);

    for (let i = 0; i < maxLen; i++) {
      const o = i < origLines.length ? origLines[i] : undefined;
      const m = i < modLines.length ? modLines[i] : undefined;

      if (o === m) {
        result.push({ type: "same", text: o ?? "" });
      } else {
        if (o !== undefined) result.push({ type: "removed", text: o });
        if (m !== undefined) result.push({ type: "added", text: m });
      }
    }
    setDiffResult(result);
  };

  // ─── Char Counter ─────────────────────────────────────────────────────────────
  const [counterInput, setCounterInput] = useState("");

  const counterStats = React.useMemo(() => {
    const text = counterInput;
    const total = text.length;
    const noSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    const utf8Bytes = new TextEncoder().encode(text).length;
    return { total, noSpaces, words, lines, paragraphs, utf8Bytes };
  }, [counterInput]);

  // ─── QR Code ──────────────────────────────────────────────────────────────────
  const [qrInput, setQrInput] = useState("https://whzzzhy.xyz");
  const [qrSize, setQrSize] = useState(200);
  const qrSvgRef = useRef<HTMLDivElement>(null);

  const handleQrDownload = () => {
    if (!qrSvgRef.current) return;
    const svgEl = qrSvgRef.current.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Regex Tester ─────────────────────────────────────────────────────────────
  const [regexPattern, setRegexPattern] = useState("");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexTestString, setRegexTestString] = useState("");
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);
  const [regexHighlighted, setRegexHighlighted] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!regexPattern || !regexTestString) {
      setRegexMatches([]);
      setRegexError(null);
      setRegexHighlighted(null);
      return;
    }
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches: string[] = [];
      let match: RegExpExecArray | null;
      if (regexFlags.includes("g")) {
        while ((match = re.exec(regexTestString)) !== null) {
          matches.push(match[0]);
          if (match[0].length === 0) re.lastIndex++;
        }
      } else {
        match = re.exec(regexTestString);
        if (match) matches.push(match[0]);
      }
      setRegexMatches(matches);
      setRegexError(null);

      // build highlighted JSX
      const re2 = new RegExp(regexPattern, regexFlags.includes("g") ? regexFlags : regexFlags + "g");
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      while ((m = re2.exec(regexTestString)) !== null) {
        if (m.index > lastIdx) {
          parts.push(<span key={`t${lastIdx}`}>{regexTestString.slice(lastIdx, m.index)}</span>);
        }
        parts.push(<mark key={`m${m.index}`} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{m[0]}</mark>);
        lastIdx = m.index + m[0].length;
        if (m[0].length === 0) re2.lastIndex++;
      }
      if (lastIdx < regexTestString.length) {
        parts.push(<span key={`e`}>{regexTestString.slice(lastIdx)}</span>);
      }
      setRegexHighlighted(<>{parts}</>);
    } catch (e: any) {
      setRegexError(e.message);
      setRegexMatches([]);
      setRegexHighlighted(null);
    }
  }, [regexPattern, regexFlags, regexTestString]);

  // ─── Tool Options ─────────────────────────────────────────────────────────────
  const toolOptions = [
    { id: "base64" as DevToolType, label: t.devTools.tools.base64.label, icon: <Binary className="w-4 h-4" />, desc: t.devTools.tools.base64.desc },
    { id: "md5-sha" as DevToolType, label: t.devTools.tools.hash.label, icon: <Hash className="w-4 h-4" />, desc: t.devTools.tools.hash.desc },
    { id: "url-codec" as DevToolType, label: t.devTools.tools.url.label, icon: <Globe className="w-4 h-4" />, desc: t.devTools.tools.url.desc },
    { id: "shader" as DevToolType, label: t.devTools.tools.shader.label, icon: <Sliders className="w-4 h-4" />, desc: t.devTools.tools.shader.desc },
    { id: "json-formatter" as DevToolType, label: t.devTools.tools.json.label, icon: <Braces className="w-4 h-4" />, desc: t.devTools.tools.json.desc },
    { id: "uuid-generator" as DevToolType, label: t.devTools.tools.uuid.label, icon: <KeyRound className="w-4 h-4" />, desc: t.devTools.tools.uuid.desc },
    { id: "code-beautifier" as DevToolType, label: t.devTools.tools.codeBeautifier.label, icon: <Code className="w-4 h-4" />, desc: t.devTools.tools.codeBeautifier.desc },
    { id: "base-converter" as DevToolType, label: t.devTools.tools.baseConverter.label, icon: <Binary className="w-4 h-4" />, desc: t.devTools.tools.baseConverter.desc },
    { id: "timestamp" as DevToolType, label: t.devTools.tools.timestamp.label, icon: <Clock className="w-4 h-4" />, desc: t.devTools.tools.timestamp.desc },
    { id: "image-compress" as DevToolType, label: t.devTools.tools.imageCompress.label, icon: <Image className="w-4 h-4" />, desc: t.devTools.tools.imageCompress.desc },
    { id: "color-picker" as DevToolType, label: t.devTools.tools.colorPicker.label, icon: <Palette className="w-4 h-4" />, desc: t.devTools.tools.colorPicker.desc },
    { id: "text-diff" as DevToolType, label: t.devTools.tools.textDiff.label, icon: <FileDiff className="w-4 h-4" />, desc: t.devTools.tools.textDiff.desc },
    { id: "char-counter" as DevToolType, label: t.devTools.tools.charCounter.label, icon: <FileText className="w-4 h-4" />, desc: t.devTools.tools.charCounter.desc },
    { id: "qr-code" as DevToolType, label: t.devTools.tools.qrCode.label, icon: <QrCode className="w-4 h-4" />, desc: t.devTools.tools.qrCode.desc },
    { id: "regex-tester" as DevToolType, label: t.devTools.tools.regexTester.label, icon: <Regex className="w-4 h-4" />, desc: t.devTools.tools.regexTester.desc },
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

      <div className="flex flex-col gap-6">

        <aside className="w-full">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
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
                  className={`flex items-center gap-2 shrink-0 rounded-xl border text-left px-4 py-2.5 transition-all text-xs font-semibold cursor-pointer ${
                    isActive
                      ? sidebarBorders[settings.themeAccent]
                      : `border-slate-800 bg-slate-900/10 text-slate-400 hover:bg-slate-900/30 hover:text-white ${borderAccents[settings.themeAccent]}`
                  }`}
                >
                  <div className="shrink-0">{tool.icon}</div>
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/10 p-6 sm:p-8 min-w-0" id="devtools-active-stage">

          {/* ─── Base64 ─────────────────────────────────────────────────────────── */}
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

          {/* ─── Hash / MD5 + SHA ───────────────────────────────────────────────── */}
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

              <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-950/40 border border-amber-800/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400">SHA1</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">SHA-1</span>
                  </div>
                  <button
                    onClick={() => displayCopyFeedback(sha1Hash)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    {copiedText === sha1Hash ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs font-mono text-amber-400 break-all select-all">{sha1Hash || t.devTools.tools.hash.calculating}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2 border-b border-slate-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">SHA512</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">SHA-512</span>
                  </div>
                  <button
                    onClick={() => displayCopyFeedback(sha512Hash)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    {copiedText === sha512Hash ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs font-mono text-emerald-400 break-all select-all">{sha512Hash || t.devTools.tools.hash.calculating}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-900/40 rounded-lg p-3">
                <Info className="w-4 h-4 shrink-0 text-slate-400" />
                <span>{t.devTools.tools.hash.note}</span>
              </div>
            </div>
          )}

          {/* ─── URL Codec ──────────────────────────────────────────────────────── */}
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

          {/* ─── Shader ─────────────────────────────────────────────────────────── */}
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

          {/* ─── JSON Formatter ─────────────────────────────────────────────────── */}
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

          {/* ─── UUID Generator ─────────────────────────────────────────────────── */}
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

          {/* ─── Code Beautifier ────────────────────────────────────────────────── */}
          {activeTool === "code-beautifier" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.codeBeautifier.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={5}
                  value={beautifierInput}
                  onChange={(e) => setBeautifierInput(e.target.value)}
                  placeholder={t.devTools.tools.codeBeautifier.placeholder}
                />
              </div>

              {beautifierError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>{beautifierError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-slate-800/60">
                <button
                  onClick={handleBeautifierFormat}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                >
                  {t.devTools.tools.codeBeautifier.format}
                </button>
                <button
                  onClick={handleBeautifierMinify}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-mono cursor-pointer"
                >
                  {t.devTools.tools.codeBeautifier.minify}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.codeBeautifier.output}</dt>
                  {beautifierOutput && (
                    <button
                      onClick={() => displayCopyFeedback(beautifierOutput)}
                      className="text-slate-500 hover:text-white flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                    >
                      {copiedText === beautifierOutput ? <span className="text-emerald-400">{t.devTools.copied}</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="w-full rounded-xl bg-slate-950 border border-slate-850 p-4 min-h-[140px] max-h-[300px] overflow-y-auto font-mono text-xs text-cyan-400 select-all leading-relaxed whitespace-pre-wrap">
                  {beautifierOutput || (
                    <span className="text-slate-600 italic">{t.devTools.tools.codeBeautifier.empty}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Base Converter ─────────────────────────────────────────────────── */}
          {activeTool === "base-converter" && (
            <div className="space-y-6">
              {baseConverterError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>{baseConverterError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">BIN</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={binValue}
                    onChange={(e) => updateFromBin(e.target.value)}
                    placeholder={t.devTools.tools.baseConverter.placeholder}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">OCT</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={octValue}
                    onChange={(e) => updateFromOct(e.target.value)}
                    placeholder={t.devTools.tools.baseConverter.placeholder}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">DEC</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={decValue}
                    onChange={(e) => updateFromDec(e.target.value)}
                    placeholder={t.devTools.tools.baseConverter.placeholder}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">HEX</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={hexValue}
                    onChange={(e) => updateFromHex(e.target.value)}
                    placeholder={t.devTools.tools.baseConverter.placeholder}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Timestamp ──────────────────────────────────────────────────────── */}
          {activeTool === "timestamp" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800/60">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.timestamp.mode}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTsMode("s")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-mono border cursor-pointer ${tsMode === "s" ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"}`}
                  >
                    {t.devTools.tools.timestamp.seconds}
                  </button>
                  <button
                    onClick={() => setTsMode("ms")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-mono border cursor-pointer ${tsMode === "ms" ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"}`}
                  >
                    {t.devTools.tools.timestamp.milliseconds}
                  </button>
                </div>
                <button
                  onClick={handleTsNow}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t.devTools.tools.timestamp.now}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.timestamp.unixLabel}</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 mb-3"
                    value={tsUnixInput}
                    onChange={(e) => setTsUnixInput(e.target.value)}
                    placeholder={t.devTools.tools.timestamp.unixPlaceholder}
                  />
                  <button
                    onClick={handleTsToDate}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer w-full"
                  >
                    {t.devTools.tools.timestamp.toDate}
                  </button>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.timestamp.dateLabel}</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 mb-3"
                    value={tsDateInput}
                    onChange={(e) => setTsDateInput(e.target.value)}
                    placeholder={t.devTools.tools.timestamp.datePlaceholder}
                  />
                  <button
                    onClick={handleTsToUnix}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer w-full"
                  >
                    {t.devTools.tools.timestamp.toUnix}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Image Compress ─────────────────────────────────────────────────── */}
          {activeTool === "image-compress" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.imageCompress.upload}</dt>
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-white file:text-xs file:font-mono file:cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-slate-400 text-xs font-mono uppercase">
                    <span>{t.devTools.tools.imageCompress.quality}</span>
                    <span>{Math.round(imageQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    value={imageQuality * 100}
                    onChange={(e) => setImageQuality(Number(e.target.value) / 100)}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{t.devTools.tools.imageCompress.maxWidth}</dt>
                  <input
                    type="number"
                    className="w-full rounded-lg bg-slate-950 border border-slate-850 p-2 text-sm text-white font-mono"
                    value={imageMaxWidth}
                    onChange={(e) => setImageMaxWidth(Number(e.target.value))}
                    min={100}
                    max={4096}
                  />
                </div>
              </div>

              <button
                onClick={handleImageCompress}
                disabled={!imageOriginal}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
              >
                {t.devTools.tools.imageCompress.compress}
              </button>

              {imageOriginal && imageCompressed && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                      <div className="bg-slate-950 p-2 text-[10px] font-mono text-slate-400 text-center border-b border-slate-800">
                        {t.devTools.tools.imageCompress.original} ({formatFileSize(imageOriginalSize)})
                      </div>
                      <img src={imageOriginal} alt="Original" className="w-full h-auto max-h-48 object-contain" />
                    </div>
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                      <div className="bg-slate-950 p-2 text-[10px] font-mono text-slate-400 text-center border-b border-slate-800">
                        {t.devTools.tools.imageCompress.compressed} ({formatFileSize(imageCompressedSize)})
                      </div>
                      <img src={imageCompressed} alt="Compressed" className="w-full h-auto max-h-48 object-contain" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <div className="text-xs font-mono text-slate-400">
                      {t.devTools.tools.imageCompress.ratio}: <span className="text-emerald-400 font-semibold">
                        {imageOriginalSize > 0 ? Math.round((1 - imageCompressedSize / imageOriginalSize) * 100) : 0}%
                      </span>
                    </div>
                    <button
                      onClick={handleImageDownload}
                      className="bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
                    >
                      {t.devTools.tools.imageCompress.download}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Color Picker ───────────────────────────────────────────────────── */}
          {activeTool === "color-picker" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => updateColorFromHex(e.target.value)}
                    className="w-20 h-20 rounded-xl cursor-pointer border-2 border-slate-800"
                  />
                </div>
                <div className="flex-1">
                  <div className="rounded-xl border border-slate-800 p-4 flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg border border-slate-800"
                      style={{ backgroundColor: colorHex }}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-mono text-white font-semibold">{colorHex.toUpperCase()}</p>
                      <p className="text-xs font-mono text-slate-400">RGB({colorR}, {colorG}, {colorB})</p>
                      <p className="text-xs font-mono text-slate-400">HSL({colorHslH}, {colorHslS}%, {colorHslL}%)</p>
                    </div>
                    <button
                      onClick={() => displayCopyFeedback(colorHex)}
                      className="ml-auto text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedText === colorHex ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">HEX</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={colorHex}
                    onChange={(e) => updateColorFromHex(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">R</dt>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={colorR}
                    onChange={(e) => updateColorFromRgb(Number(e.target.value), colorG, colorB)}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">G</dt>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={colorG}
                    onChange={(e) => updateColorFromRgb(colorR, Number(e.target.value), colorB)}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">B</dt>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={colorB}
                    onChange={(e) => updateColorFromRgb(colorR, colorG, Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Text Diff ──────────────────────────────────────────────────────── */}
          {activeTool === "text-diff" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.textDiff.original}</dt>
                  <textarea
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    rows={6}
                    value={diffOriginal}
                    onChange={(e) => setDiffOriginal(e.target.value)}
                    placeholder={t.devTools.tools.textDiff.originalPlaceholder}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.textDiff.modified}</dt>
                  <textarea
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    rows={6}
                    value={diffModified}
                    onChange={(e) => setDiffModified(e.target.value)}
                    placeholder={t.devTools.tools.textDiff.modifiedPlaceholder}
                  />
                </div>
              </div>

              <button
                onClick={handleTextDiff}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
              >
                {t.devTools.tools.textDiff.compare}
              </button>

              {diffResult && (
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.textDiff.result}</dt>
                  <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[100px] max-h-[300px] overflow-y-auto font-mono text-xs">
                    {diffResult.map((line, i) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 rounded ${
                          line.type === "added"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : line.type === "removed"
                            ? "bg-red-500/15 text-red-400"
                            : "text-slate-300"
                        }`}
                      >
                        <span className="text-slate-600 mr-2 select-none">
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                        </span>
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Char Counter ───────────────────────────────────────────────────── */}
          {activeTool === "char-counter" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.charCounter.input}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={6}
                  value={counterInput}
                  onChange={(e) => setCounterInput(e.target.value)}
                  placeholder={t.devTools.tools.charCounter.placeholder}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t.devTools.tools.charCounter.totalChars, value: counterStats.total, color: "text-cyan-400" },
                  { label: t.devTools.tools.charCounter.noSpaces, value: counterStats.noSpaces, color: "text-violet-400" },
                  { label: t.devTools.tools.charCounter.words, value: counterStats.words, color: "text-amber-400" },
                  { label: t.devTools.tools.charCounter.lines, value: counterStats.lines, color: "text-emerald-400" },
                  { label: t.devTools.tools.charCounter.paragraphs, value: counterStats.paragraphs, color: "text-rose-400" },
                  { label: t.devTools.tools.charCounter.utf8Bytes, value: counterStats.utf8Bytes, color: "text-sky-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center"
                  >
                    <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── QR Code ────────────────────────────────────────────────────────── */}
          {activeTool === "qr-code" && (
            <div className="space-y-6">
              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.qrCode.input}</dt>
                <input
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder={t.devTools.tools.qrCode.placeholder}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-slate-400 text-xs font-mono uppercase">
                  <span>{t.devTools.tools.qrCode.size}</span>
                  <span>{qrSize}px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div
                  ref={qrSvgRef}
                  className="rounded-xl border border-slate-800 bg-white p-4 inline-flex items-center justify-center"
                >
                  {qrInput && (
                    <QRCodeSVG value={qrInput} size={qrSize} />
                  )}
                </div>

                <button
                  onClick={handleQrDownload}
                  disabled={!qrInput}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer flex items-center gap-1.5"
                >
                  {t.devTools.tools.qrCode.download}
                </button>
              </div>
            </div>
          )}

          {/* ─── Regex Tester ───────────────────────────────────────────────────── */}
          {activeTool === "regex-tester" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.regexTester.pattern}</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder={t.devTools.tools.regexTester.patternPlaceholder}
                  />
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.regexTester.flags}</dt>
                  <input
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="g, i, m..."
                  />
                </div>
              </div>

              {regexError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>{regexError}</span>
                </div>
              )}

              <div>
                <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.regexTester.testString}</dt>
                <textarea
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  rows={5}
                  value={regexTestString}
                  onChange={(e) => setRegexTestString(e.target.value)}
                  placeholder={t.devTools.tools.regexTester.testPlaceholder}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400">{t.devTools.tools.regexTester.result}</dt>
                  <span className="text-xs font-mono text-slate-500">
                    {t.devTools.tools.regexTester.matches}: <span className="text-emerald-400">{regexMatches.length}</span>
                  </span>
                </div>
                <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[80px] font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                  {regexHighlighted || (
                    <span className="text-slate-600 italic">{t.devTools.tools.regexTester.empty}</span>
                  )}
                </div>
              </div>

              {regexMatches.length > 0 && (
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{t.devTools.tools.regexTester.matchList}</dt>
                  <div className="space-y-1">
                    {regexMatches.slice(0, 50).map((m, i) => (
                      <div key={i} className="rounded-lg border border-slate-850 bg-slate-950/70 px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-emerald-400 select-all break-all">{m}</span>
                        <button
                          onClick={() => displayCopyFeedback(m)}
                          className="text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          {copiedText === m ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                    {regexMatches.length > 50 && (
                      <p className="text-[10px] text-slate-500 font-mono">... +{regexMatches.length - 50} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
