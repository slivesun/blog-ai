import React, { useState } from "react";
import { Shield, Sparkles, BookOpen, HeartHandshake, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const documentations = [
    {
      key: "system",
      title: t.footer.docs.system.title,
      content: t.footer.docs.system.content
    },
    {
      key: "privacy",
      title: t.footer.docs.privacy.title,
      content: t.footer.docs.privacy.content
    },
    {
      key: "terms",
      title: t.footer.docs.terms.title,
      content: t.footer.docs.terms.content
    },
    {
      key: "support",
      title: t.footer.docs.support.title,
      content: t.footer.docs.support.content
    }
  ];

  const handleOpenDoc = (key: string) => {
    setActiveModal(key);
  };

  const getDocContent = () => {
    return documentations.find((d) => d.key === activeModal)?.content || "";
  };

  const getDocTitle = () => {
    return documentations.find((d) => d.key === activeModal)?.title || "";
  };

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 py-10" id="footer-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          
          <div className="text-center md:text-left">
            <span className="font-heading font-semibold text-slate-400">{t.footer.brand}</span>
            <p className="mt-1 text-xs text-slate-500">
              {t.footer.copyright.replace("{year}", new Date().getFullYear().toString())}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2" id="footer-document-links">
            <button
              onClick={() => handleOpenDoc("privacy")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              {t.footer.privacyPolicy}
            </button>
            <button
              onClick={() => handleOpenDoc("terms")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              {t.footer.termsOfService}
            </button>
            <button
              onClick={() => handleOpenDoc("system")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              {t.footer.documentation}
            </button>
            <button
              onClick={() => handleOpenDoc("support")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-slate-500" />
              {t.footer.support}
            </button>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in animate-duration-150">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-semibold text-white tracking-tight">{getDocTitle()}</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed font-sans mb-5 font-light">
              {getDocContent()}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
              >
                {t.footer.acknowledge}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}