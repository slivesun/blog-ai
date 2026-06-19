export const ARTICLE_RETURN_STATE_KEY = "article_detail_return_state";
const LEGACY_BLOG_SCROLL_KEY = "blog_scroll_y";
const DETAIL_RETURN_TO_KEY = "detail_return_to";

export type ArticleReturnState =
  | {
      source: "blog";
      articleId: string;
      visibleCount: number;
      currentPage: number;
      hasMore: boolean;
      scrollY: number;
      createdAt: number;
    }
  | {
      source: "profile";
      articleId: string;
      activeTab: "published";
      scrollY: number;
      createdAt: number;
    };

export function saveArticleReturnState(state: ArticleReturnState) {
  sessionStorage.setItem(ARTICLE_RETURN_STATE_KEY, JSON.stringify(state));
}

export function readArticleReturnState(): ArticleReturnState | null {
  const raw = sessionStorage.getItem(ARTICLE_RETURN_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ArticleReturnState;
    if (!parsed.articleId || !parsed.source) return null;
    return parsed;
  } catch {
    clearArticleReturnState();
    return null;
  }
}

export function clearArticleReturnState() {
  sessionStorage.removeItem(ARTICLE_RETURN_STATE_KEY);
  sessionStorage.removeItem(LEGACY_BLOG_SCROLL_KEY);
  sessionStorage.removeItem(DETAIL_RETURN_TO_KEY);
}

export function restoreArticleAnchor(elementId: string, fallbackY?: number) {
  const restore = () => {
    requestAnimationFrame(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest" });
        return;
      }

      if (typeof fallbackY === "number") {
        window.scrollTo(0, fallbackY);
      }
    });
  };

  restore();
  const firstTimer = window.setTimeout(restore, 120);
  const secondTimer = window.setTimeout(restore, 360);

  return () => {
    window.clearTimeout(firstTimer);
    window.clearTimeout(secondTimer);
  };
}
