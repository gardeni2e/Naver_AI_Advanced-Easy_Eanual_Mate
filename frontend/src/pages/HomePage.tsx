import { useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage, toAbsoluteApiUrl } from "../api/client";
import { deleteManual, fetchManuals } from "../api/manuals";
import { searchVideos } from "../api/search";
import { createTts } from "../api/tts";
import { AnalysisLoadingSection } from "../components/AnalysisLoadingSection";
import { HeroSection, type ManualMode } from "../components/HeroSection";
import { Layout } from "../components/Layout";
import { ManualChatSection } from "../components/ManualChatSection";
import { ManualLibrarySection } from "../components/ManualLibrarySection";
import { ManualSearchPanel } from "../components/ManualSearchPanel";
import { OcrUploadPanel } from "../components/OcrUploadPanel";
import { ProductInfoSection } from "../components/ProductInfoSection";
import { RecommendedVideosSection } from "../components/RecommendedVideosSection";
import { ReferenceChunksSection } from "../components/ReferenceChunksSection";
import { UploadPanel } from "../components/UploadPanel";
import { getDisplayManualName } from "../utils/manualDisplay";
import { buildVideoSearchQueryFromManual } from "../utils/videoSearchQuery";
import type {
  ChatResponse,
  FontSizeMode,
  ManualListItem,
  ManualUploadResponse,
  OcrUploadResponse,
  SourceChunk,
  VideoCandidate
} from "../types/api";

export function HomePage() {
  const [manuals, setManuals] = useState<ManualListItem[]>([]);
  const [selectedManualId, setSelectedManualId] = useState("");
  const [selectedMode, setSelectedMode] = useState<ManualMode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SourceChunk[]>([]);
  const [videos, setVideos] = useState<VideoCandidate[]>([]);
  const [fontSize, setFontSize] = useState<FontSizeMode>("normal");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioMessage, setAudioMessage] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [manualStatus, setManualStatus] = useState("");
  const resultsRef = useRef<HTMLDivElement | null>(null);

  async function refreshManuals() {
    const nextManuals = await fetchManuals();
    setManuals(nextManuals);
    if (!selectedManualId && nextManuals.length) {
      setSelectedManualId(nextManuals[0].manual_id);
    }
    return nextManuals;
  }

  useEffect(() => {
    refreshManuals().catch(() => setManuals([]));
  }, []);

  useEffect(() => {
    if (analysisComplete) {
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [analysisComplete]);

  function beginAnalysis() {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setSources([]);
    setAudioUrl("");
    setAudioMessage("");
  }

  function finishAnalysis() {
    setIsAnalyzing(false);
  }

  function handlePdfUploaded(result: ManualUploadResponse, nextVideos: VideoCandidate[]) {
    setSelectedManualId(result.manual_id);
    setVideos(nextVideos);
    setAnswer(`${getDisplayManualName(result.file_name)} 등록 완료\n${result.chunk_count}개 문단으로 질문할 준비가 끝났습니다.`);
    setSources([]);
    setAnalysisComplete(true);
  }

  function handleOcrUploaded(result: OcrUploadResponse) {
    setSelectedManualId(result.manual_id);
    setAnswer(`OCR 텍스트 등록 완료\n${result.chunk_count}개 문단으로 질문할 준비가 끝났습니다.`);
    setSources([]);
    setAnalysisComplete(true);
  }

  function handleAnswered(response: ChatResponse) {
    setAnswer(response.answer);
    setSources(response.sources);
    setAudioUrl("");
    setAudioMessage("");
  }

  async function handleSelectManual(manualId: string) {
    setSelectedManualId(manualId);
    setFontSize("normal");
    const manual = manuals.find((item) => item.manual_id === manualId);
    const displayName = getDisplayManualName(manual?.file_name ?? "");
    setAnswer(displayName ? `${displayName} 문서를 선택했습니다.\n이 매뉴얼을 기준으로 질문할 수 있습니다.` : "");
    setSources([]);
    setAudioUrl("");
    setAudioMessage("");

    const query = buildVideoSearchQueryFromManual(manual);

    if (!query.trim()) {
      setVideos([]);
      return;
    }

    try {
      const nextVideos = await searchVideos(query);
      setVideos(nextVideos);
    } catch {
      setVideos([]);
    }
  }

  async function handleCreateTts() {
    if (!answer.trim()) {
      setAudioMessage("먼저 답변을 생성해 주세요.");
      return;
    }
    setTtsLoading(true);
    try {
      const result = await createTts(answer);
      setAudioUrl(toAbsoluteApiUrl(result.audio_url));
      setAudioMessage(result.message);
    } catch (error) {
      setAudioMessage(getApiErrorMessage(error, "음성 생성에 실패했습니다."));
    } finally {
      setTtsLoading(false);
    }
  }

  async function handleDeleteManual(manualId: string) {
    const target = manuals.find((manual) => manual.manual_id === manualId);
    const ok = window.confirm(
      target
        ? `${getDisplayManualName(target.file_name)}을(를) 삭제할까요?\n업로드 파일과 검색 데이터도 함께 삭제됩니다.`
        : "이 매뉴얼을 삭제할까요?"
    );
    if (!ok) return;
    try {
      await deleteManual(manualId);
      const nextManuals = await fetchManuals();
      setManuals(nextManuals);
      setManualStatus("매뉴얼과 검색 데이터가 삭제되었습니다.");
      if (selectedManualId === manualId) {
        const nextSelectedId = nextManuals[0]?.manual_id ?? "";
        setSelectedManualId(nextSelectedId);
        setAnswer(nextSelectedId ? "다른 매뉴얼을 선택했습니다. 질문을 입력해 주세요." : "");
        setSources([]);
        setVideos([]);
        setAudioUrl("");
        setAudioMessage("");
        if (!nextSelectedId) {
          setAnalysisComplete(false);
        }
      }
    } catch (error) {
      setManualStatus(getApiErrorMessage(error, "매뉴얼 삭제에 실패했습니다."));
    }
  }

  const selectedManual = useMemo(
    () => manuals.find((manual) => manual.manual_id === selectedManualId),
    [manuals, selectedManualId]
  );

  function toggleMode(mode: ManualMode) {
    setSelectedMode((currentMode) => (currentMode === mode ? null : mode));
  }

  return (
    <Layout>
      <main className="mx-auto max-w-[1180px]">
        <HeroSection selectedMode={selectedMode} onSelectMode={toggleMode} />

        <div className="grid gap-6">
          {selectedMode ? (
            <section className="animate-slide-up mb-3 sm:mb-4">
              {selectedMode === "pdf" ? (
                <UploadPanel
                  onUploaded={handlePdfUploaded}
                  onRefreshManuals={refreshManuals}
                  onStart={beginAnalysis}
                  onFinish={finishAnalysis}
                />
              ) : (
                <OcrUploadPanel
                  onUploaded={handleOcrUploaded}
                  onRefreshManuals={refreshManuals}
                  onStart={beginAnalysis}
                  onFinish={finishAnalysis}
                />
              )}
            </section>
          ) : null}

          <ManualSearchPanel onVideos={setVideos} />

          {isAnalyzing ? <AnalysisLoadingSection /> : null}

          {analysisComplete && !isAnalyzing ? (
            <div ref={resultsRef} className="grid scroll-mt-24 gap-8 pt-8 sm:gap-10 sm:pt-10">
              <ManualLibrarySection
                manuals={manuals}
                selectedManualId={selectedManualId}
                status={manualStatus}
                onSelectManual={handleSelectManual}
                onDeleteManual={handleDeleteManual}
              />
              <ProductInfoSection productInfo={selectedManual?.estimated_product} />
              <RecommendedVideosSection videos={videos} />
              <ManualChatSection
                manuals={manuals}
                selectedManualId={selectedManualId}
                answer={answer}
                fontSize={fontSize}
                onFontSize={setFontSize}
                onAnswered={handleAnswered}
                audioUrl={audioUrl}
                audioMessage={audioMessage}
                onCreateTts={handleCreateTts}
                ttsLoading={ttsLoading}
              />
              <ReferenceChunksSection sources={sources} />
            </div>
          ) : null}
        </div>
      </main>
    </Layout>
  );
}
