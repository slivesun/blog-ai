import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { BlogArticle, BlogComment, ActivePath, SystemSettings, UserProfile } from "../../types";
import { Heart, MessageSquare, ArrowLeft, Send, Sparkles, Plus, CheckCircle, ChevronRight, Share2, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { articleApi } from "../../api";
import { transformArticle } from "../../dataTransform";
import {
  clearArticleReturnState,
  readArticleReturnState,
  restoreArticleAnchor,
  saveArticleReturnState
} from "../../navigationState";

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
  const { showMessage } = useToast();
  const navigate = useNavigate();
  const { id: urlArticleId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const editDraftId = searchParams.get('edit');
  const [commentText, setCommentText] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newAbstract, setNewAbstract] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newContent, setNewContent] = useState("");
  const [newCoverImage, setNewCoverImage] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // 编辑草稿：从 sessionStorage 加载草稿数据
  useEffect(() => {
    if (editDraftId && currentPath === "blog-compose") {
      const raw = sessionStorage.getItem('edit_draft');
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          setNewTitle(draft.title || "");
          setNewAbstract(draft.abstract || "");
          setNewContent(draft.content || "");
          setNewCoverImage(draft.coverImage || "");
          setNewCategory(draft.category || "Engineering");
          setEditingDraftId(draft.id);
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
        sessionStorage.removeItem('edit_draft');
      }
    }
  }, [editDraftId, currentPath]);

  const [visibleCount, setVisibleCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [loginToast, setLoginToast] = useState<string | null>(null);
  const restoredBlogReturnRef = useRef(false);

  // 未登录时跳转登录页（带提示）
  const requireLogin = (message: string) => {
    setLoginToast(message);
    localStorage.setItem('login_redirect', window.location.pathname);
    setTimeout(() => {
      setLoginToast(null);
      navigate("/profile");
    }, 2000);
  };

  // 进入详情页前保存列表上下文，直接返回时恢复当前文章所在区域
  const saveBlogReturnState = (articleId: string) => {
    saveArticleReturnState({
      source: "blog",
      articleId,
      visibleCount,
      currentPage,
      hasMore,
      scrollY: window.scrollY,
      createdAt: Date.now(),
    });
    sessionStorage.setItem('detail_return_to', '/blog');
  };

  // 返回列表页后只恢复“从详情直接返回”的上下文
  useEffect(() => {
    if (currentPath === "blog") {
      setIsLoadingMore(false);

      const returnState = readArticleReturnState();
      if (returnState?.source === "blog") {
        const articleIndex = articles.findIndex((article) => article.id === returnState.articleId);
        const nextVisibleCount = Math.max(
          10,
          returnState.visibleCount,
          articleIndex >= 0 ? articleIndex + 1 : 0
        );

        setVisibleCount(nextVisibleCount);
        setCurrentPage(Math.max(returnState.currentPage, Math.ceil(nextVisibleCount / 10)));
        setHasMore(returnState.hasMore);
        restoredBlogReturnRef.current = true;
        clearArticleReturnState();

        return restoreArticleAnchor(
          `blog-article-card-${returnState.articleId}`,
          returnState.scrollY
        );
      }

      if (restoredBlogReturnRef.current) {
        restoredBlogReturnRef.current = false;
        return;
      }

      setVisibleCount(10);
      setHasMore(true);
      setCurrentPage(1);
    }
  }, [currentPath]);

  const activeArticle = articles.find((a) => a.id === (urlArticleId || selectedArticleId));

  // 当进入详情页时，加载完整的文章数据（含评论）
  useEffect(() => {
    const articleId = urlArticleId || selectedArticleId;
    if (currentPath === "blog-detail" && articleId && !detailLoaded) {
      const loadArticleDetail = async () => {
        try {
          const response = await articleApi.getArticle(Number(articleId));
          if (response.success && response.data) {
            const fullArticle = transformArticle(response.data);
            setArticles(prev => prev.map(a => a.id === articleId ? { ...a, ...fullArticle } : a));
          }
        } catch (e) {
          console.error("Failed to load article detail:", e);
        } finally {
          setDetailLoaded(true);
        }
      };
      loadArticleDetail();
    }
    // 重置详情加载状态
    if (currentPath !== "blog-detail") {
      setDetailLoaded(false);
    }
  }, [currentPath, urlArticleId, selectedArticleId, detailLoaded]);

  const handleLike = async (articleId: string) => {
    if (!isLoggedIn) {
      requireLogin(t.blog.detail.loginToLike);
      return;
    }
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

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddComment = async (e: React.FormEvent, articleId: string) => {
    e.preventDefault();
    if (!isLoggedIn) {
      requireLogin(t.blog.detail.loginToLike);
      return;
    }
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      if (onCreateComment) {
        const result = await onCreateComment(articleId, commentText);
        if (result.success) {
          setCommentText("");
        }
      } else {
        // Fallback to local state
        const newComment: BlogComment = {
          id: `comm-user-${Date.now()}`,
          author: profile.name,
          avatar: profile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
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
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const { articleApi } = await import("../../api");
      const draftData = {
        title: newTitle,
        abstract: newAbstract,
        content: newContent,
        category_id: getCategoryId(newCategory),
        is_draft: true,
        cover_image: newCoverImage || undefined,
      };
      let result;
      if (editingDraftId) {
        result = await articleApi.updateArticle(Number(editingDraftId), draftData);
      } else {
        result = await articleApi.createArticle(draftData);
      }
      if (result.success) {
        showMessage(t.blog.draftSaved || "草稿已保存", "success");
        navigate("/profile", { state: { tab: "drafts" } });
      }
    } catch (e) {
      console.error("Failed to save draft:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const { articleApi } = await import("../../api");
      const articleData = {
        title: newTitle,
        abstract: newAbstract,
        content: newContent,
        category_id: getCategoryId(newCategory),
        is_draft: false,
        cover_image: newCoverImage || undefined,
      };

      let result;
      if (editingDraftId) {
        result = await articleApi.updateArticle(Number(editingDraftId), articleData);
      } else if (onCreateArticle) {
        result = await onCreateArticle(articleData);
      }

      if (result && result.success) {
        setSubmitSuccess(true);
        setEditingDraftId(null);
        setTimeout(() => {
          setNewTitle("");
          setNewAbstract("");
          setNewContent("");
          setNewCoverImage("");
          setSubmitSuccess(false);
          navigate("/blog");
        }, 1500);
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
          navigate("/blog");
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await articleApi.getArticles({ page: nextPage, page_size: 10 });
      if (response.success && response.data) {
        const transformed = response.data.articles.map(transformArticle);
        if (transformed.length > 0) {
          setArticles(prev => [...prev, ...transformed]);
          setVisibleCount(prev => prev + 10);
          setCurrentPage(nextPage);
          if (response.data.total_pages && nextPage >= response.data.total_pages) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more articles:", e);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
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
    custom: "bg-slate-600 hover:bg-slate-500 shadow-slate-950/20",
  };

  const getThemeBtnStyle = () => {
    if (settings.themeAccent === "custom" && settings.themeAccentCustom) {
      return { backgroundColor: settings.themeAccentCustom };
    }
    return {};
  };

  if (currentPath === "blog-detail" && activeArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in" id="blog-detail-view">

        <button
          onClick={() => {
            setSelectedArticleId(null);
            const returnTo = sessionStorage.getItem('detail_return_to');
            sessionStorage.removeItem('detail_return_to');
            navigate(returnTo || "/blog");
          }}
          className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t.blog.backToFeed}
        </button>

        {/* 悬浮返回按钮 - 右下角圆形 */}
        <button
          onClick={() => {
            setSelectedArticleId(null);
            const returnTo = sessionStorage.getItem('detail_return_to');
            sessionStorage.removeItem('detail_return_to');
            navigate(returnTo || "/blog");
          }}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-full shadow-lg shadow-black/30 transition-all duration-300 cursor-pointer hover:scale-110"
          title={t.blog.backToFeed}
        >
          <ArrowLeft className="w-5 h-5" />
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white mb-4 break-words">
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

        <article className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-sans space-y-6 font-light text-base mb-12 break-words">
          {activeArticle.content ? (
            activeArticle.content.split("\n\n").map((p, i) => (
              <p key={i} className="break-words whitespace-pre-wrap">
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

          {/* 登录提示 Toast */}
          {loginToast && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 flex items-center gap-3 animate-pulse">
              <span className="text-sm text-amber-300">{loginToast}</span>
              <span className="text-xs text-amber-400/70 font-mono">{t.blog.detail.redirecting}</span>
            </div>
          )}

          {isLoggedIn ? (
            <form onSubmit={(e) => handleAddComment(e, activeArticle.id)} className="mb-8">
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-sans"
                  placeholder={t.blog.detail.postAs.replace("{name}", profile.name)}
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">
                    {t.blog.detail.postAs.replace("{name}", profile.name)}
                  </span>
                  <button
                    style={{ marginTop: "16px", ...getThemeBtnStyle() }}
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all cursor-pointer ${themeBtnColors[settings.themeAccent]} ${(isSubmittingComment || !commentText.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingComment ? "..." : t.blog.detail.broadcast}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8">
              <button
                onClick={() => {
                  localStorage.setItem('login_redirect', window.location.pathname);
                  navigate("/profile");
                }}
                style={getThemeBtnStyle()}
                className={`w-full flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all cursor-pointer ${themeBtnColors[settings.themeAccent]}`}
              >
                <Send className="w-4 h-4" />
                {t.blog.detail.loginToComment}
              </button>
            </div>
          )}

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
          onClick={() => navigate("/blog")}
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
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">{t.blog.fields.coverImage || "Cover Image"}</label>
              <div className="flex items-center gap-3">
                {newCoverImage && (
                  <img src={newCoverImage} alt="cover" className="h-16 w-24 object-cover rounded-lg border border-slate-800" />
                )}
                <button
                  type="button"
                  onClick={() => document.getElementById('cover-upload-input')?.click()}
                  disabled={isUploadingCover}
                  className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingCover ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                  ) : (newCoverImage ? "Change" : "Upload")}
                </button>
                {newCoverImage && (
                  <button
                    type="button"
                    onClick={() => setNewCoverImage("")}
                    className="text-xs text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                <input
                  id="cover-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploadingCover(true);
                    try {
                      const { uploadApi } = await import("../../api");
                      const result = await uploadApi.uploadImage(file);
                      if (result.success && result.data) {
                        setNewCoverImage(result.data.url);
                      } else {
                        showMessage(result.message?.includes("too large") ? t.profile.uploadTooLarge : t.profile.uploadFailed, "error");
                      }
                    } catch (err) {
                      console.error("Cover upload failed:", err);
                      showMessage(t.profile.uploadFailed, "error");
                    } finally {
                      setIsUploadingCover(false);
                    }
                    e.target.value = '';
                  }}
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
                onClick={handleSaveDraft}
                disabled={isSubmitting || !newTitle.trim()}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 cursor-pointer ${isSubmitting || !newTitle.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.blog.draft}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={getThemeBtnStyle()}
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
                    {editingDraftId ? (t.blog.updateBtn || "Update") : t.blog.publishBtn}
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
            onClick={() => navigate("/blog/compose")}
            style={getThemeBtnStyle()}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono text-white transition-all hover:scale-[1.01] cursor-pointer ${themeBtnColors[settings.themeAccent]}`}
          >
            <Plus className="w-4 h-4" />
            {t.blog.publish}
          </button>
        </div>

        {settings.highDensityLayout && (
          <div style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { borderColor: settings.themeAccentCustom + "33" } : undefined} className="rounded-xl border border-indigo-500/20 bg-slate-950/40 p-4 mb-8 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">{t.blog.connectionStatus}</span>
            <Share2 style={settings.themeAccent === "custom" && settings.themeAccentCustom ? { color: settings.themeAccentCustom } : undefined} className="w-4 h-4 text-indigo-400" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {articles.slice(0, visibleCount).map((art) => (
            <div
              key={art.id}
              id={`blog-article-card-${art.id}`}
              onClick={() => {
                saveBlogReturnState(art.id);
                setSelectedArticleId(art.id);
                navigate(`/blog/${art.id}`);
              }}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/15 p-5 hover:border-slate-700 hover:bg-slate-900/30 transition-all cursor-pointer"
            >
              <div>
                <div className="h-44 w-full rounded-lg overflow-hidden mb-4 border border-slate-900">
                  <img
                    src={art.coverImage}
                    alt={art.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">{art.date}
                  <div className="ml-6">
                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${categoryBadges[art.category] || "bg-slate-800 text-slate-300"}`}>
                      {art.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-heading font-semibold text-white mt-1 group-hover:text-blue-200 transition-colors line-clamp-2 break-words">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-2.5 font-light leading-relaxed line-clamp-2 break-words">
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
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 hover:border-slate-700 px-6 py-2.5 text-xs text-slate-400 hover:text-white font-mono transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  {t.blog.loadMore}
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
