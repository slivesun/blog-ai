export type Language = "en" | "zh";

export type TranslationKeys = {
  header: {
    overview: string;
    blog: string;
    devTools: string;
    notes: string;
    journeyMapOn: string;
    journeyMapOff: string;
    logout: string;
    login: string;
    systemSettings: string;
  };
  footer: {
    privacyPolicy: string;
    termsOfService: string;
    documentation: string;
    support: string;
    acknowledge: string;
    copyright: string;
    brand: string;
    docs: {
      system: {
        title: string;
        content: string;
      };
      privacy: {
        title: string;
        content: string;
      };
      terms: {
        title: string;
        content: string;
      };
      support: {
        title: string;
        content: string;
      };
    };
  };
  home: {
    prototypeConnections: string;
    heroTitle: string;
    heroSubtitle: string;
    cards: {
      blog: {
        title: string;
        desc: string;
        action: string;
        badge: string;
      };
      devTools: {
        title: string;
        desc: string;
        action: string;
        badge: string;
      };
      notes: {
        title: string;
        desc: string;
        action: string;
        badge: string;
      };
    };
    journeyMap: {
      title: string;
      subtitle: string;
      entry: {
        title: string;
        desc: string;
        jump: string;
      };
      blog: {
        title: string;
        desc: string;
        jump: string;
      };
      dev: {
        title: string;
        desc: string;
        jump: string;
      };
      notes: {
        title: string;
        desc: string;
        jump: string;
      };
    };
    specs: {
      title: string;
      react: string;
      proxy: string;
      storage: string;
    };
  };
  blog: {
    title: string;
    subtitle: string;
    publish: string;
    loadMore: string;
    composeTitle: string;
    composeSubtitle: string;
    composeSuccess: string;
    composeSuccessMsg: string;
    draft: string;
    cancel: string;
    backToFeed: string;
    fields: {
      title: string;
      category: string;
      abstract: string;
      content: string;
      placeholder: {
        title: string;
        abstract: string;
        content: string;
      };
    };
    publishBtn: string;
    detail: {
      comments: string;
      postAs: string;
      anonymous: string;
      broadcast: string;
      empty: string;
      likes: string;
      commentsCount: string;
      loginToComment: string;
      loginToLike: string;
      redirecting: string;
    };
    categories: {
      engineering: string;
      design: string;
      security: string;
      systems: string;
    };
    connectionStatus: string;
  };
  devTools: {
    title: string;
    subtitle: string;
    tools: {
      base64: {
        label: string;
        desc: string;
        input: string;
        output: string;
        encode: string;
        decode: string;
        swap: string;
        placeholder: string;
        empty: string;
        copy: string;
      };
      hash: {
        label: string;
        desc: string;
        input: string;
        md5: string;
        sha256: string;
        calculating: string;
        shaCalculating: string;
        note: string;
      };
      url: {
        label: string;
        desc: string;
        input: string;
        output: string;
        encode: string;
        decode: string;
        placeholder: string;
        empty: string;
        copy: string;
      };
      shader: {
        label: string;
        desc: string;
        speed: string;
        density: string;
        presets: string;
        code: string;
        preview: string;
      };
      json: {
        label: string;
        desc: string;
        input: string;
        output: string;
        format: string;
        minify: string;
        indent: string;
        placeholder: string;
        empty: string;
        copy: string;
      };
      uuid: {
        label: string;
        desc: string;
        quantity: string;
        regenerate: string;
        copyAll: string;
        copySuccess: string;
      };
      codeBeautifier: {
        label: string;
        desc: string;
        input: string;
        output: string;
        format: string;
        minify: string;
        placeholder: string;
        empty: string;
        copy: string;
      };
      baseConverter: {
        label: string;
        desc: string;
        binary: string;
        octal: string;
        decimal: string;
        hex: string;
        placeholder: string;
      };
      timestamp: {
        label: string;
        desc: string;
        unixLabel: string;
        dateLabel: string;
        getCurrent: string;
        seconds: string;
        milliseconds: string;
        placeholder: string;
      };
      imageCompress: {
        label: string;
        desc: string;
        upload: string;
        quality: string;
        maxWidth: string;
        original: string;
        compressed: string;
        download: string;
        noImage: string;
      };
      colorPicker: {
        label: string;
        desc: string;
        hex: string;
        rgb: string;
        hsl: string;
        preview: string;
        copyHex: string;
        copyRgb: string;
        copyHsl: string;
      };
      textDiff: {
        label: string;
        desc: string;
        original: string;
        modified: string;
        compare: string;
        noDiff: string;
        added: string;
        removed: string;
      };
      charCounter: {
        label: string;
        desc: string;
        chars: string;
        charsNoSpace: string;
        words: string;
        lines: string;
        paragraphs: string;
        bytes: string;
        placeholder: string;
      };
      qrCode: {
        label: string;
        desc: string;
        input: string;
        placeholder: string;
        size: string;
        download: string;
      };
      regexTester: {
        label: string;
        desc: string;
        pattern: string;
        flags: string;
        testString: string;
        matches: string;
        noMatch: string;
        matchCount: string;
      };
    };
    copied: string;
    console: string;
  };
  notes: {
    title: string;
    subtitle: string;
    create: string;
    search: string;
    filter: string;
    items: string;
    noDocuments: string;
    noActive: string;
    selectInit: string;
    createNote: string;
    editor: {
      edit: string;
      preview: string;
      save: string;
      saved: string;
      title: string;
      category: string;
      tags: string;
      content: string;
      tagsPlaceholder: string;
      contentPlaceholder: string;
    };
    tips: string;
    categories: {
      all: string;
      architecture: string;
      design: string;
      snippets: string;
      general: string;
    };
  };
  profile: {
    auth: {
      title: string;
      subtitle: string;
      username: string;
      email: string;
      password: string;
      loginBtn: string;
      registerBtn: string;
      authenticating: string;
      creating: string;
      noAccount: string;
      backToLogin: string;
      bypass: string;
      note: string;
      registerSuccess: string;
    };
    title: string;
    published: string;
    drafts: string;
    logout: string;
    noPublished: string;
    publishNew: string;
    noDrafts: string;
    edit: string;
    cancel: string;
    read: string;
    instantPublish: string;
    created: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    markRead: string;
    clear: string;
    noAlerts: string;
    inspect: string;
    category: string;
    types: {
      security: string;
      sync: string;
      interaction: string;
      system: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    theme: {
      title: string;
      subtitle: string;
      cyan: string;
      violet: string;
      amber: string;
      emerald: string;
    };
    skin: {
      title: string;
      dark: string;
      light: string;
      success: string;
    };
    switches: {
      title: string;
      notifications: {
        title: string;
        desc: string;
      };
      comments: {
        title: string;
        desc: string;
      };
      density: {
        title: string;
        desc: string;
      };
    };
    reset: {
      title: string;
      desc: string;
      button: string;
    };
    info: string;
    success: {
      notifyAllow: string;
      notifyDisable: string;
      commentsAllow: string;
      commentsDisable: string;
      densityHigh: string;
      densityStandard: string;
      theme: string;
      reset: string;
    };
  };
  common: {
    categories: {
      engineering: string;
      design: string;
      security: string;
      systems: string;
    };
  };
};

export type Translations = TranslationKeys;

import { translations as enTranslations } from "./en";
import { translations as zhTranslations } from "./zh";

export const translations: Record<Language, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

export function getTranslation(language: Language): Translations {
  return translations[language];
}