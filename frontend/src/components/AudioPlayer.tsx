import { Loader2, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  message: string;
  onCreate: () => void;
  loading: boolean;
}

export function AudioPlayer({ audioUrl, message, onCreate, loading }: AudioPlayerProps) {
  return (
    <div className="soft-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onCreate} disabled={loading} className="btn-secondary h-10 text-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          음성으로 듣기
        </button>
        {message ? <span className="text-sm leading-6 text-muted">{message}</span> : null}
      </div>
      {audioUrl ? <audio className="mt-3 w-full" src={audioUrl} controls /> : null}
    </div>
  );
}
