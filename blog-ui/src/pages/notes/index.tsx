import React, { useState, useEffect } from "react";
import { SystemNote, SystemSettings } from "../../types";
import { INITIAL_NOTES } from "../../utils";
import { useLanguage } from "../../context/LanguageContext";
import {
  FileText,
  Search,
  Trash2,
  Save,
  Eye,
  Edit2,
  Tags,
  CheckCircle,
  HelpCircle,
  Loader2
} from "lucide-react";

interface NotesViewProps {
  notes: SystemNote[];
  setNotes: React.Dispatch<React.SetStateAction<SystemNote[]>>;
  settings: SystemSettings;
  onCreateNote?: (data: { title: string; content: string; category?: string; tags?: string }) => Promise<any>;
  onUpdateNote?: (id: string, data: Partial<{ title: string; content: string; category: string; tags: string }>) => Promise<any>;
  onDeleteNote?: (id: string) => Promise<any>;
}

export default function NotesView({ 
  notes, 
  setNotes, 
  settings,
  onCreateNote,
  onUpdateNote,
  onDeleteNote
}: NotesViewProps) {
  const { t } = useLanguage();
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(t.notes.categories.all);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");

  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(t.notes.categories.architecture);
  const [editContent, setEditContent] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditCategory(activeNote.category);
      setEditContent(activeNote.content);
      setEditTagsInput(activeNote.tags.join(", "));
      setSaveSuccess(false);
    } else {
      setEditTitle("");
      setEditCategory(t.notes.categories.general);
      setEditContent("");
      setEditTagsInput("");
    }
  }, [activeNoteId, activeNote]);

  const handleCreateNote = async () => {
    const newNote: SystemNote = {
      id: `note-${Date.now()}`,
      title: "Untitled System Specification",
      category: t.notes.categories.general,
      content: `# New Operational Standard\n\n- Composing markdown standards is fully supported.\n- Save configuration tags below to filter later.`,
      date: new Date().toISOString().split("T")[0],
      tags: ["new", "draft"]
    };

    if (onCreateNote) {
      const result = await onCreateNote({
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags.join(", ")
      });
      
      if (result.success && result.note) {
        // The parent component will update the notes list
        setActiveNoteId(result.note.id);
      } else {
        // Fallback to local state
        setNotes((prev) => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
      }
    } else {
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
    setEditorTab("edit");
  };

  const handleSaveNote = async () => {
    if (!activeNoteId) return;

    const tagsArray = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSaving(true);
    try {
      if (onUpdateNote) {
        const result = await onUpdateNote(activeNoteId, {
          title: editTitle,
          content: editContent,
          category: editCategory,
          tags: tagsArray.join(", ")
        });
        
        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } else {
        // Fallback to local state
        setNotes((prev) =>
          prev.map((n) => {
            if (n.id === activeNoteId) {
              return {
                ...n,
                title: editTitle,
                category: editCategory,
                content: editContent,
                tags: tagsArray
              };
            }
            return n;
          })
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (onDeleteNote) {
      const result = await onDeleteNote(id);
      if (!result.success) {
        // Fallback to local state
        const filtered = notes.filter((n) => n.id !== id);
        setNotes(filtered);
        
        if (filtered.length > 0) {
          setActiveNoteId(filtered[0].id);
        } else {
          setActiveNoteId("");
        }
      }
    } else {
      // Fallback to local state
      const filtered = notes.filter((n) => n.id !== id);
      setNotes(filtered);
      
      if (filtered.length > 0) {
        setActiveNoteId(filtered[0].id);
      } else {
        setActiveNoteId("");
      }
    }
  };

  const renderMarkdownHTML = (md: string) => {
    if (!md) return "<p class='text-slate-500 italic'>No content loaded inside markdown interpreter.</p>";
    
    let html = md;
    
    html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white mb-4 border-b border-slate-800 pb-2 font-heading">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mb-3 mt-6 font-heading">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-4 font-mono">$1</h3>');

    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');

    html = html.replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 bg-slate-950 rounded font-mono text-cyan-400 text-xs border border-slate-800">$1</code>');

    html = html.replace(/```bash([\s\S]*?)```/gim, '<pre class="bg-slate-950 font-mono text-xs p-4 rounded-xl text-emerald-400 border border-slate-850 my-4 block overflow-x-auto whitespace-pre leading-normal">$1</pre>');
    html = html.replace(/```javascript([\s\S]*?)```/gim, '<pre class="bg-slate-950 font-mono text-xs p-4 rounded-xl text-yellow-400 border border-slate-850 my-4 block overflow-x-auto whitespace-pre leading-normal">$1</pre>');
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-950 font-mono text-xs p-4 rounded-xl text-slate-300 border border-slate-850 my-4 block overflow-x-auto whitespace-pre leading-normal">$1</pre>');

    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-300">$1</li>');

    html = html.split('\n\n').join('</p><p class="mb-4 leading-relaxed font-sans text-sm text-slate-300 font-light">');
    html = '<p class="mb-4 leading-relaxed font-sans text-sm text-slate-300 font-light">' + html + '</p>';

    return html;
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === t.notes.categories.all || n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [t.notes.categories.all, t.notes.categories.architecture, t.notes.categories.design, t.notes.categories.snippets, t.notes.categories.general];

  const themeAccentColors = {
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    violet: "bg-violet-600 hover:bg-violet-500",
    amber: "bg-amber-600 hover:bg-amber-500",
    emerald: "bg-emerald-600 hover:bg-emerald-500"
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="notes-main-workspace">
      
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white">
            {t.notes.title}
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1 max-w-xl font-light">
            {t.notes.subtitle}
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-mono font-semibold text-white transition-all cursor-pointer ${themeAccentColors[settings.themeAccent]}`}
        >
          <Edit2 className="w-4 h-4" />
          {t.notes.create}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8" id="notes-stage-grids">
        
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          
          <div className="relative">
            <Search className="absolute top-3 left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder={t.notes.search}
              className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-2 pl-2">{t.notes.filter}</span>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-800 text-white border border-slate-750"
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 max-h-[350px] lg:max-h-[500px] overflow-y-auto" id="notes-sidebar-items">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1 pl-2">{t.notes.items}</span>
            {filteredNotes.length === 0 ? (
              <div className="text-center rounded-xl border border-dashed border-slate-850 p-6 text-slate-600">
                <span className="text-xs font-mono">{t.notes.noDocuments}</span>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`group relative rounded-xl border p-4 cursor-pointer text-left transition-all ${
                      isActive
                        ? "bg-slate-900/60 border-slate-750 shadow-md"
                        : "bg-slate-900/10 border-slate-850 hover:bg-slate-900/30 hover:border-slate-750"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span className="text-[10px] font-mono text-slate-500">{note.category}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-slate-600 hover:text-red-400 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-xs font-semibold text-white tracking-tight leading-tight group-hover:text-white mb-2">
                      {note.title}
                    </h3>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-900/40">
                      <span className="text-[9px] font-mono text-slate-600">{note.date}</span>
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded bg-slate-950 px-1 py-0.5 text-[8px] font-mono text-slate-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/10 p-5 sm:p-7 min-w-0 flex flex-col justify-between" id="notes-editor-panel">
          {activeNote ? (
            <div className="space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                  <button
                    onClick={() => setEditorTab("edit")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors ${
                      editorTab === "edit"
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t.notes.editor.edit}
                  </button>
                  <button
                    onClick={() => setEditorTab("preview")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors ${
                      editorTab === "preview"
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t.notes.editor.preview}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 animate-pulse">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t.notes.editor.saved}
                    </span>
                  )}
                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4.5 py-2 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-slate-400" />
                        {t.notes.editor.save}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {editorTab === "edit" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.notes.editor.title}</label>
                      <input
                        type="text"
                        className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700 font-semibold"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setSaveSuccess(false);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.notes.editor.category}</label>
                      <select
                        className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-white focus:outline-none focus:border-slate-700"
                        value={editCategory}
                        onChange={(e) => {
                          setEditCategory(e.target.value);
                          setSaveSuccess(false);
                        }}
                      >
                        <option value={t.notes.categories.architecture}>{t.notes.categories.architecture}</option>
                        <option value={t.notes.categories.design}>{t.notes.categories.design}</option>
                        <option value={t.notes.categories.snippets}>{t.notes.categories.snippets}</option>
                        <option value={t.notes.categories.general}>{t.notes.categories.general}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5 text-slate-600" />
                      {t.notes.editor.tags}
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono"
                      placeholder={t.notes.editor.tagsPlaceholder}
                      value={editTagsInput}
                      onChange={(e) => setEditTagsInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">{t.notes.editor.content}</label>
                    <textarea
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-white placeholder-slate-700 focus:outline-none focus:border-slate-750 leading-relaxed"
                      rows={14}
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        setSaveSuccess(false);
                      }}
                      placeholder={t.notes.editor.contentPlaceholder}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-6 min-h-[300px]">
                  <div
                    className="markdown-body select-text text-left prose-sm prose"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownHTML(editContent) }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center rounded-2xl border border-dashed border-slate-800 py-20 text-slate-500">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <span className="text-sm font-semibold text-slate-400">{t.notes.noActive}</span>
              <p className="text-xs text-slate-500 mt-1">{t.notes.selectInit}</p>
              <button
                onClick={handleCreateNote}
                className="mt-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-mono cursor-pointer"
              >
                {t.notes.createNote}
              </button>
            </div>
          )}

          {activeNote && (
            <div className="mt-6 flex gap-2 items-start text-[11px] text-slate-500 border-t border-slate-900/60 pt-4">
              <HelpCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <span className="font-light">
                {t.notes.tips}
              </span>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}