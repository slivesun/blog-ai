import React, { useState } from "react";
import { BlogArticle, BlogComment, ActivePath, SystemSettings, UserProfile } from "../../types";
import { Heart, MessageSquare, ArrowLeft, Send, Sparkles, Plus, CheckCircle, ChevronRight, Share2, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface BlogViewProps {
  articles: BlogArticle[];
  setArticles: React.Dispatch<React.SetStateAction<BlogArticle[]>>;
  currentPath: ActivePath;
  setPath: (path: ActivePath) => void;
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string | null) => void;
  isLoggedIn: boolean;
  settings: SystemSettings;
  profile: UserProfile;
  onCreateArticle?: (data: any) => Promise<any>;
  onUpdateArticle?: (id: number, data: any) => Promise<any>;
  onDeleteArticle?: (id: string) => Promise<any>;
  onLikeArticle?: (id: string) => Promise<any>;
  onCreateComment?: (articleId: string, content: string, parentId?: number) => Promise<any>;
}

export default function BlogView({
  articles,
  setArticles,
  currentPath,
  setPath,
  selectedArticleId,
  setSelectedArticleId,
  isLoggedIn,
  settings,
  profile,
  onCreateArticle,
  onUpdateArticle,
  onDeleteArticle,
  onLikeArticle,
  onCreateComment,
}: BlogViewProps) {
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState("");
  
  const [newTitle, setNewTitle] = useState("");
  const [newAbstract, setNewAbstract] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newContent, setNewContent] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visibleCount, setVisibleCount] = useState(3);
  const [hasMore, setHasMore] = useState(true);

  const activeArticle = articles.find((a) => a.id === selectedArticleId);

  const handleLike = async (articleId: string) => {
    if (onLikeArticle) {
      await onLikeArticle(articleId);
    } else {
      // Fallback to local state
      setArticles((prev) =>
        prev.map((art) => {
          if (art.id === articleId) {
            return { ...art, likes: art.likes + 1 };
          }
          return art;
        })
      );
    }
  };

  const handleAddComment = async (e: React.FormEvent, articleId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (onCreateComment) {
      const result = await onCreateComment(articleId, commentText);
      if (result.success) {
        setCommentText("");
      }
    } else {
      // Fallback to local state
      const newComment: BlogComment = {
        id: `comm-user-${Date.now()}`,
        author: isLoggedIn ? profile.name : "Anonymous Security Node",
        avatar: isLoggedIn ? profile.avatarUrl : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
        text: commentText,
        date: "Today"
      };

      setArticles((prev) =>
        prev.map((art) => {
          if (art.id === articleId) {
            return {
              ...art,
              comments: [...art.comments, newComment]
            };
          }
          return art;
        })
      );
      setCommentText("");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      if (onCreateArticle) {
        const result = await onCreateArticle({
          title: newTitle,
          abstract: newAbstract,
          content: newContent,
          category_id: getCategoryId(newCategory),
          is_draft: false,
        });
        
        if (result.success) {
          setSubmitSuccess(true);
          setTimeout(() => {
            setNewTitle("");
            setNewAbstract("");
            setNewContent("");
            setSubmitSuccess(false);
            setPath("blog");
          }, 1500);
        }
      } else {
        // Fallback to local state
        const coverUrls: Record<string, string> = {
          Engineering: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
          Design: "https://images.unsplash.com/photo-1541462608141-2a13ee16fa48?w=800&auto=format&fit=crop",
          Security: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop",
          Systems: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop"
        };

        const newArticle: BlogArticle = {
          id: `post-${Date.now()}`,
          title: newTitle,
          abstract: newAbstract || "No summary provided by the system creator.",
          content: newContent,
          category: newCategory,
          author: profile.name,
          authorRole: profile.role,
          authorAvatar: profile.avatarUrl,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          coverImage: coverUrls[newCategory] || coverUrls.Engineering,
          likes: 0,
          comments: [],
          isUserPublished: true
        };

        setArticles((prev) => [newArticle, ...prev]);
        setSubmitSuccess(true);
        
        setTimeout(() => {
          setNewTitle("");
          setNewAbstract("");
          setNewContent("");
          setSubmitSuccess(false);
          setPath("blog");
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((c) => c + 3);
    if (visibleCount >= articles.length) {
      setHasMore(false);
    }
  };

  // Helper function to get category ID
  const getCategoryId = (categoryName: string): number => {
    const categoryMap: Record<string, number> = {
      "Engineering": 1,
      "Design": 2,
      "Security": 3,
      "Systems": 4
    };
    return categoryMap[categoryName] || 1;
  };

  const categoryBadges: Record<string, string> = {
    Engineering: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    Design: "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20",
    Security: "bg-red-500/10 text-red-400 border border-red-500/20",
    Systems: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  };

  const themeBtnColors = {
    cyan: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/20",
    violet: "bg-violet-600 hover:bg-violet-500 shadow-violet-950/20",
    amber: "bg-amber-600 hover:bg-amber-500 shadow-amber-950/20",
    emerald: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20",
  };

  if (currentPath === "blog-detail" && activeArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="blog-detail-view">
        
        <button
          onClick={() => {
            setPath("blog");
            setSelectedArticleId(null);
          }}
          className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t.blog.backToFeed}
        </button>

        <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden mb-8 border border-slate-800">
          <img
            src={activeArticle.coverImage}
            alt={activeArticle.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className={`rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${categoryBadges[activeArticle.category] || "bg-slate-800 text-slate-300"}`}>
              {activeArticle.category}
            </span>
          </div>
        </div>

        <div className="mb-8 pb-8 border-b border-slate-800">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white mb-4">
            {activeArticle.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-4">
            <div className="flex items-center gap-2">
              <img
                src={activeArticle.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop"}
                alt={activeArticle.author}
                className="h-6 w-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="font-semibold text-white">{activeArticle.author}</span>
            </div>
            <span className="text-slate-600 font-mono">/</span>
            <span className="font-mono text-xs">{activeArticle.authorRole}</span>
            <span className="text-slate-600 font-mono">/</span>
            <span className="font-mono text-xs">{activeArticle.date}</span>
          </div>
        </div>

        <article className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-sans space-y-6 font-light text-base mb-12">
          {activeArticle.content ? (
            activeArticle.content.split("\n\n").map((p, i) => (
              <p key={i}>
                {p}
              </p>
            ))
          ) : (
            <>
              <p>
                In the context of modern distributed workloads, keeping data coherent demands a deep understanding of physical grid limits and routing nodes. High deployment speed often risks data consistency, rendering single microservice nodes susceptible to telemetry timeouts.
              </p>
              <p>
                To avoid failures, modern orchestrators utilize container mesh frameworks which separate incoming client tokens from data pipelines. By enforcing single port ingress proxies (specifically port 3000), external metrics requests are isolated, which keeps API keys concealed from untrusted clients.
              </p>
              <p>
                As systems grow, simple state triggers can be managed locally in browser persistence blocks (such as client-side localStorage), providing robust fallback options during network events. Maintaining structured boundaries ensures developers get maximum clarity.
              </p>
            </>
          )}
        </article>

        <div className="flex items-center justify-between border-t border-b border-slate-800 py-4 mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleLike(activeArticle.id)}
              className="group flex items-center gap-2.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform text-red-500 fill-current" />
              <span className="text-sm font-mono">{t.blog.detail.likes.replace("{count}", activeArticle.likes.toString())}</span>
            </button>
            <div className="flex items-center gap-2 text-slate-400">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-mono">{t.blog.detail.commentsCount.replace("{count}", activeArticle.comments.length.toString())}</span>
            </div>
          </div>
          
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            ID: {activeArticle.id}
          </span>
        </div>

        <div id="comments-section" className="mb-12">
          <h3 className="text-lg font-heading font-bold text-white mb-6">{t.blog.detail.comments}</h3>
          
          <form onSubmit={(e) => handleAddComment(e, activeArticle.id)} className="mb-8">
            <div className="space-y-3">
              <textarea
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
                placeholder={isLoggedIn ? t.blog.detail.postAs.replace("{name}", profile.name) : t.blog.detail.anonymous}
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">
                  {isLoggedIn ? t.blog.detail.postAs.replace("{name}", profile.name) : t.blog.detail.anonymous}
                </span>
                <button
                  type="submit"
                  className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all cursor-pointer ${themeBtnColors[settings.themeAccent]}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {t.blog.detail.broadcast}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {activeArticle.comments.length === 0 ? (
              <div className="text-center rounded-xl border border-dashed border-slate-800 p-8 text-slate-500">
                <span className="text-xs font-mono">{t.blog.detail.empty}</span>
              </div>
            ) : (
              activeArticle.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="h-8 w-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{comment.author}</span>
                        <span className="text-[10px] font-mono text-slate-500">{comment.date}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 font-sans leading-relaxed font-light">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    );
  }

  if (currentPath === "blog-compose") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="blog-compose-view">
        
        <button
          onClick={() => setPath("blog")}
          className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t.blog.cancel}
        </button>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-3">{t.blog.composeTitle}</h1>
        <p className="text-sm text-slate-400 font-sans mb-8">
          {t.blog.composeSubtitle}
        </p>

        {submitSuccess ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center animate-pulse">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span className="text-sm font-semibold text-white">{t.blog.composeSuccess}</span>
            <p className="text-xs text-slate-400 mt-1">{t.blog.composeSuccessMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleCreatePost} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">{t.blog.fields.title}</label>
              <input
                type="text"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-slate-700"
                placeholder={t.blog.fields.placeholder.title}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">{t.blog.fields.category}</label>
                <select
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-slate-700"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Engineering">{t.blog.categories.engineering}</option>
                  <option value="Design">{t.blog.categories.design}</option>
                  <option value="Security">{t.blog.categories.security}</option>
                  <option value="Systems">{t.blog.categories.systems}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">{t.blog.fields.abstract}</label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-slate-700"
                  placeholder={t.blog.fields.placeholder.abstract}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">{t.blog.fields.content}</label>
              <textarea
                required
                rows={8}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-sans"
                placeholder={t.blog.fields.placeholder.content}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPath("blog")}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
              >
                {t.blog.draft}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer ${themeBtnColors[settings.themeAccent]} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.blog.publishBtn}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 animate-fade-in" id="blog-feed-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white">
              {t.blog.title}
            </h1>
            <p className="text-slate-400 font-sans text-xs mt-1">
              {t.blog.subtitle}
            </p>
          </div>

          <button
            onClick={() => setPath("blog-compose")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-mono text-white transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.blog.publish}
          </button>
        </div>

        {settings.highDensityLayout && (
          <div className="rounded-xl border border-indigo-500/20 bg-slate-950/40 p-4 mb-8 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">{t.blog.connectionStatus}</span>
            <Share2 className="w-4 h-4 text-indigo-400" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {articles.slice(0, visibleCount).map((art) => (
            <div
              key={art.id}
              onClick={() => {
                setSelectedArticleId(art.id);
                setPath("blog-detail");
              }}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/15 p-5 hover:border-slate-700 hover:bg-slate-900/30 transition-all cursor-pointer"
            >
              <div>
                <div className="relative h-44 w-full rounded-lg overflow-hidden mb-4 border border-slate-900">
                  <img
                    src={art.coverImage}
                    alt={art.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${categoryBadges[art.category] || "bg-slate-800 text-slate-300"}`}>
                      {art.category}
                    </span>
                  </div>
                </div>

                <span className="font-mono text-[9px] text-slate-500">{art.date}</span>
                <h3 className="text-lg font-heading font-semibold text-white mt-1 group-hover:text-blue-200 transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-2.5 font-light leading-relaxed">
                  {art.abstract}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-850/60 pt-4 mt-6">
                <span className="text-[11px] text-slate-400 font-medium">{art.author}</span>
                
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500/70" />
                    {art.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {art.comments.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 hover:border-slate-700 px-6 py-2.5 text-xs text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
            >
              {t.blog.loadMore}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}