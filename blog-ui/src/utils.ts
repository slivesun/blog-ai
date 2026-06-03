/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogArticle, AppNotification, SystemNote, UserProfile } from "./types";

// Standard MD5 Implementation in pure TypeScript
export function calculateMD5(string: string): string {
  function RotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function AddUnsigned(lX: number, lY: number) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }

  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }

  function ConvertToWordArray(string: string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function WordToHex(lValue: number) {
    var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }

  function Utf8Encode(string: string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }

  var x = [];
  var k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  string = Utf8Encode(string);
  x = ConvertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = GG(a, b, c, d, x[k + 13], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 2], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 7], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 12], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 1], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 6], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 11], S23, 0xd8a11654);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 5], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 10], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 15], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 4], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 9], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 14], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 3], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 8], S24, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }

  var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
  return temp.toLowerCase();
}

// SHA-256 (Asynchronous fallback) or simple visual placeholder
export async function calculateSHA256(text: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    // Fallback if subtle crypto is not available in iframe sandbox
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_fallback_${Math.abs(hash).toString(16)}`;
  }
}

// Initial Preset Assets & Data
export const INITIAL_ARTICLES: BlogArticle[] = [
  {
    id: "microservices-2024",
    title: "Architecting for Scale: Microservices in 2024",
    abstract: "Deep dives into modern distributed systems, tracing state consistency, high density network flows, and API gateway routing topologies.",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop",
    category: "Engineering",
    author: "Elena Rostova",
    authorRole: "Principal Infrastructure Architect",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    date: "May 24, 2024",
    likes: 142,
    comments: [
      {
        id: "comm-1",
        author: "Marcus Kline",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
        text: "Excellent architectural breakdown! The exploration of saga models in ultra-low latency setups is particularly helpful.",
        date: "May 25, 2024"
      },
      {
        id: "comm-2",
        author: "Jenna Torres",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        text: "Are you planning a follow-up on containerized orchestration policies for multi-region active-active databases?",
        date: "May 26, 2024"
      }
    ]
  },
  {
    id: "precision-minimalism",
    title: "Precision Minimalism in Modern UI",
    abstract: "Why strict visual hierarchies, intentional gray colorways, and precise typographic details outperform complex gradients.",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop",
    category: "Design",
    author: "Marcus Kline",
    authorRole: "Head of Visual Systems",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    date: "June 2, 2024",
    likes: 98,
    comments: [
      {
        id: "comm-3",
        author: "Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
        text: "This article perfectly aligns with why keeping margins structured makes the entire system easier to implement.",
        date: "June 3, 2024"
      }
    ]
  },
  {
    id: "zero-trust-2025",
    title: "Zero-Trust Architectures for 2025",
    abstract: "Revisiting security boundaries inside the service mesh. Implementing granular identity attributes and ephemeral access tokens.",
    coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop",
    category: "Security",
    author: "Jenna Torres",
    authorRole: "SecOps Lead Consultant",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
    date: "July 15, 2024",
    likes: 184,
    comments: []
  }
];

export const INITIAL_NOTES: SystemNote[] = [
  {
    id: "deploy-notes",
    title: "PortalCore Deployment Runbook",
    category: "System Architecture",
    content: `# PortalCore Deployment Guidelines\n\n### Requirements\n- **NodeJS**: Standard 18+ runtime.\n- **Ingress port**: Strict access restricted through port \`3000\` reverse proxy.\n- **Container Environment**: Sandboxed Cloud Containers.\n\n### Command topologics:\n\`\`\`bash\nnpm run build\nnpm run start\n\`\`\`\n\nEnsure client-to-server requests go through proxy endpoints \`/api/*\` to keep keys secure!`,
    date: "2024-06-03",
    tags: ["deploy", "ops", "config"]
  },
  {
    id: "aesthetic-guide",
    title: "Corporate Visual Manifesto",
    category: "Design Philosophy",
    content: `# Visual Principles\n\n1. **No Clutter**: Avoid unrequested telemetry lists, logging screens, or simulated metrics in boundaries unless requested.\n2. **Color Balance**: Neutral off-whites paired with space-grays (\`slate-900\`).\n3. **Typography**: "Inter" for readable UI, matched with "JetBrains Mono" for monospace system codes.`,
    date: "2024-06-02",
    tags: ["design", "spec", "manifesto"]
  },
  {
    id: "db-security",
    title: "Database Ephemeral Mesh Layout",
    category: "Snippets",
    content: `// Sample secure memory key rotation script
export function rotateKey(epoch: number): string {
  const seed = process.env.SYSTEM_MUTATION_SEED || "static_mesh";
  return sha256(seed + epoch.toString());
}`,
    date: "2024-06-01",
    tags: ["security", "db", "auth"]
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Security Update Recommended",
    description: "Multi-layered container access and API proxy controls are fully active. Rotate authorization keys periodically.",
    time: "4h ago",
    type: "security",
    isRead: false
  },
  {
    id: "notif-2",
    title: "Synchronized Cache Active",
    description: "Cloud database synchronization finished with status code 200 (Success). All clients are updated.",
    time: "10h ago",
    type: "sync",
    isRead: false
  },
  {
    id: "notif-3",
    title: "Alex Chen added a comment",
    description: "On Elena's draft: 'Excellent breakdown of database proxy configurations.' Check the comment stream.",
    time: "1d ago",
    type: "interaction",
    isRead: true,
    linkToId: "microservices-2024"
  }
];

export const INITIAL_PROFILE: UserProfile = {
  name: "Alex Chen",
  role: "Lead Systems Architect",
  bio: "Aligning digital signal flow with aesthetic perfection. Author of distributed databases, functional UI design systems, and low-latency microservices.",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
  githubUrl: "github.com/alexchen-systems",
  email: "alex.chen@portalcore.systems"
};
