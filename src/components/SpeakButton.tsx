import { Volume2 } from "lucide-react";
import { speakSpanish, isSpeechSupported } from "@/lib/speak";

interface Props {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-[13px]",
  md: "h-9 w-9 text-base",
  lg: "h-12 w-12 text-lg",
};

export function SpeakButton({ text, size = "md", className = "", label }: Props) {
  if (!isSpeechSupported()) return null;
  return (
    <button
      type="button"
      aria-label={label ?? `Listen to ${text} in Spanish`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        speakSpanish(text);
      }}
      className={`inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft transition hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95 ${sizeMap[size]} ${className}`}
    >
      <Volume2 className="h-1/2 w-1/2" />
    </button>
  );
}
