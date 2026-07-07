import { useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { searchManuals, searchVideos } from "../api/search";
import type { LinkCandidate, VideoCandidate } from "../types/api";
import { BrandLogo } from "./BrandLogo";

interface ManualSearchPanelProps {
  onVideos: (videos: VideoCandidate[]) => void;
}

export function ManualSearchPanel({ onVideos }: ManualSearchPanelProps) {
  const [product, setProduct] = useState("");
  const [links, setLinks] = useState<LinkCandidate[]>([]);
  const [status, setStatus] = useState("제품명만 입력하면 관련 공식 매뉴얼 후보를 찾아드립니다.");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!product.trim()) {
      setStatus("제품명 또는 모델명을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const [manuals, videos] = await Promise.all([searchManuals(product), searchVideos(product)]);
      setLinks(manuals);
      onVideos(videos);
      setStatus("후보 링크를 찾았습니다. PDF를 내려받은 뒤 업로드해 주세요.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "검색에 실패했습니다. 제품명을 조금 더 자세히 입력해 주세요."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info text-accent">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <div>
          <p className="text-sm font-bold text-accent">Manual Search</p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-black">
            매뉴얼이 없다면?
            <BrandLogo brand="gemini" variant="inline" />
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">제품명만 입력하면 관련 공식 매뉴얼 후보를 찾아드립니다.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={product}
          onChange={(event) => setProduct(event.target.value)}
          placeholder="예: Line6 PodGO wireless"
          className="field h-12 min-w-0"
        />
        <button type="button" onClick={handleSearch} disabled={loading} className="btn-primary h-12 sm:min-w-28">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          찾기
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{status}</p>

      {links.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="quiet-link-card flex items-center gap-3 p-4 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{link.title}</span>
                <span className="mt-1 block line-clamp-2 text-muted">{link.reason}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
