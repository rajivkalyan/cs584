"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function VoiceCapture({ onTranscriptReady }) {
  const { t, lang } = useLanguage();
  const [voiceLang, setVoiceLang] = useState("bn");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);
  const canvasRef = useRef(null);
  const lastBlobRef = useRef(null);
  const hasReportedRef = useRef(false);
  const liveTranscriptRef = useRef("");
  const liveInterimRef = useRef("");
  const speechRecognitionRef = useRef(null);
  const [hasStoredBlob, setHasStoredBlob] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);

  const speakPrompt = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceLang]);

  const startRecording = useCallback(() => {
    setError("");
    setTranscript("");
    setTranslation("");
    setStatus("");
    setHasStoredBlob(false);
    setSpeechUnavailable(false);
    hasReportedRef.current = false;
    liveTranscriptRef.current = "";
    liveInterimRef.current = "";
    
    // Speak initial prompt in voice language
    const initialPrompt = voiceLang === "bn" 
      ? "আপনার স্বাস্থ্য সমস্যা সম্পর্কে বলুন। রেকর্ডিং শুরু হচ্ছে।"
      : "Please describe your health problem. Recording is starting.";
    setTimeout(() => speakPrompt(initialPrompt), 300);
    
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          const chunks = chunksRef.current;
          const blob = chunks.length > 0 ? new Blob(chunks, { type: recorder.mimeType || "audio/webm" }) : null;
          
          if (blob && blob.size < 1000) {
            setStatus(t("voice.noAudio"));
            setHasStoredBlob(false);
            lastBlobRef.current = null;
            return;
          }
          
          lastBlobRef.current = blob || null;
          setHasStoredBlob(!!blob);

          const finalText = (liveTranscriptRef.current || "").trim();
          const interimText = (liveInterimRef.current || "").trim();
          const browserText = finalText || interimText;
          
          if (browserText) {
            setTranscript(browserText);
            setStatus(t("voice.done"));
            // Speak completion message in voice language
            const doneMessage = voiceLang === "bn" 
              ? "রেকর্ডিং সম্পন্ন হয়েছে। ধন্যবাদ।"
              : "Recording complete. Thank you.";
            setTimeout(() => speakPrompt(doneMessage), 300);
            
            // Don't call onTranscriptReady immediately - wait for user to see transcript & translation
            // onTranscriptReady will be called when user manually proceeds
          } else if (blob) {
            setStatus(t("voice.noSpeechDetected"));
            setTranscript("");
          } else {
            setStatus(t("voice.noAudio"));
          }
        };
        
        recorder.start(200);
        setIsRecording(true);
        setStatus(t("voice.recording"));

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = voiceLang === "bn" ? "bn-BD" : "en-US";
            console.log("=".repeat(60));
            console.log("[STT] Speech Recognition Configuration:");
            console.log("  UI Language:", lang);
            console.log("  Voice Input Language:", voiceLang);
            console.log("  STT Language:", rec.lang);
            console.log("  Browser:", navigator.userAgent.includes("Chrome") ? "Chrome ✅" : navigator.userAgent.includes("Edg") ? "Edge ✅" : "Other ⚠️");
            console.log("  Expected:", voiceLang === "bn" ? "Bangla speech → Bangla text" : "English speech → English text");
            console.log("=".repeat(60));
            rec.onresult = (e) => {
              const prevFinals = liveTranscriptRef.current;
              let newPart = "";
              for (let i = e.resultIndex; i < e.results.length; i++) {
                const result = e.results[i];
                const text = result[0]?.transcript?.trim() || "";
                if (text) newPart += (newPart ? " " : "") + text;
                if (result.isFinal && text) {
                  liveTranscriptRef.current += (liveTranscriptRef.current ? " " : "") + text;
                  console.log("[STT] Final transcript:", liveTranscriptRef.current);
                }
              }
              const fullInterim = prevFinals + (newPart ? " " + newPart : "");
              liveInterimRef.current = fullInterim;
              // Show interim results immediately for better UX
              if (fullInterim.trim()) {
                setTranscript(fullInterim);
                // Check if we're getting the right language output
                const hasBangla = /[\u0980-\u09FF]/.test(fullInterim);
                const hasEnglish = /[a-zA-Z]/.test(fullInterim);
                console.log("[STT] Interim update:", fullInterim.substring(0, 50) + "...");
                console.log("[STT] Contains Bangla chars:", hasBangla, "| Contains English:", hasEnglish);
                if (voiceLang === "bn" && !hasBangla && hasEnglish) {
                  console.warn("⚠️ WARNING: Voice lang is Bangla but STT producing English text!");
                  console.warn("⚠️ This means browser may not support Bangla STT properly");
                  console.warn("⚠️ Try using Chrome browser or add Bangla to browser languages");
                }
              }
            };
            rec.onerror = (e) => {
              console.error("[STT] Error:", e.error);
              if (e.error === "not-allowed" || e.error === "no-speech") setSpeechUnavailable(true);
            };
            rec.start();
            speechRecognitionRef.current = rec;
          } catch (_) {
            setSpeechUnavailable(true);
          }
        } else {
          setSpeechUnavailable(true);
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = { analyser, audioContext };
        drawWaveform(analyser);
      } catch (err) {
        setError(t("voice.errorMic"));
        setStatus("");
      }
    })();
  }, [t, voiceLang, speakPrompt]);

  function drawWaveform(analyser) {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function frame() {
      animationIdRef.current = requestAnimationFrame(frame);
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "rgba(13, 71, 161, 0.25)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0d47a1";
      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2 + height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
    frame();
  }

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    const ac = analyserRef.current;
    if (ac?.audioContext) ac.audioContext.close().catch(() => {});
    analyserRef.current = null;
    
    setIsRecording(false);
  }, []);

  async function uploadAndTranscribe(blob) {
    if (!blob) return;
    setIsTranscribing(true);
    setError("");
    setStatus(t("voice.transcribing"));
    const previousTranscript = (liveTranscriptRef.current || transcript || "").trim();
    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (previousTranscript) {
          setTranscript(previousTranscript);
          setStatus(t("voice.done"));
        } else {
          setError(data.error || t("voice.errorTranscription"));
          setStatus("");
        }
        return;
      }
      const text = (data.text || "").trim();
      const toShow = text || previousTranscript;
      if (toShow) {
        setTranscript(toShow);
        if (onTranscriptReady && !hasReportedRef.current) {
          hasReportedRef.current = true;
          onTranscriptReady(toShow);
        }
      }
      setStatus(t("voice.done"));
    } catch (err) {
      if (previousTranscript) {
        setTranscript(previousTranscript);
        setStatus(t("voice.done"));
      } else {
        setError(t("voice.errorNetwork"));
        setStatus("");
      }
    } finally {
      setIsTranscribing(false);
    }
  }

  const handleImproveWithCloud = useCallback(() => {
    setError("");
    if (lastBlobRef.current) uploadAndTranscribe(lastBlobRef.current);
  }, [t]);

  const handleRetry = useCallback(() => {
    setError("");
    if (lastBlobRef.current) {
      uploadAndTranscribe(lastBlobRef.current);
    }
  }, [t]);

  useEffect(() => {
    if (!transcript || transcript.startsWith("[Demo:")) {
      setTranslation("");
      return;
    }
    
    // Check if transcript contains Bangla characters (Unicode range: \u0980-\u09FF)
    const hasBangla = /[\u0980-\u09FF]/.test(transcript);
    
    if (!hasBangla) {
      // If no Bangla detected, no need to translate
      setTranslation("");
      setTranslationLoading(false);
      return;
    }
    
    let cancelled = false;
    setTranslationLoading(true);
    setTranslation("");
    const url = `/api/translate?text=${encodeURIComponent(transcript)}&from=bn&to=en`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.translated) setTranslation(data.translated);
      })
      .catch(() => {
        if (!cancelled) setTranslation("");
      })
      .finally(() => {
        if (!cancelled) setTranslationLoading(false);
      });
    return () => { cancelled = true; };
  }, [transcript]);

  return (
    <div className="card rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-primary/70 font-medium uppercase tracking-wide">
          {t("voice.waveformLabel")}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary/60 font-medium">
            {lang === "bn" ? "রোগীর ভাষা:" : "Patient's Language:"}
          </span>
          <div className="flex rounded-lg overflow-hidden border border-primary/30">
            <button
              type="button"
              onClick={() => setVoiceLang("bn")}
              disabled={isRecording}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                voiceLang === "bn"
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-primary/10"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang("en")}
              disabled={isRecording}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                voiceLang === "en"
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-primary/10"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-primary/10 min-h-[88px] flex items-center justify-center my-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={320}
          height={88}
          className="max-w-full h-[88px] block"
          aria-hidden
        />
      </div>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        className={`w-full min-h-[140px] rounded-full flex flex-col items-center justify-center gap-2 transition select-none ${
          isRecording
            ? "bg-red-50 border-3 border-red-600 text-red-800"
            : "bg-surface border-3 border-primary text-primary"
        } ${isTranscribing ? "opacity-80 cursor-not-allowed" : ""}`}
        style={{ borderWidth: 3 }}
      >
        <span className="text-5xl" aria-hidden>
          🎤
        </span>
        <span className="text-base font-semibold font-bangla">
          {isRecording
            ? t("voice.recordStop")
            : isTranscribing
              ? t("voice.transcribing")
              : t("voice.recordStart")}
        </span>
      </button>
      <p className="text-center text-sm text-primary/80 min-h-[1.5em] mt-3" aria-live="polite">
        {status}
      </p>
      <p className="text-center text-xs text-primary/60 mt-1">
        {t("voice.browserOnly")}
      </p>
      {hasStoredBlob && transcript && (
        <button
          type="button"
          onClick={handleImproveWithCloud}
          disabled={isTranscribing}
          className="btn btn-ghost mt-2 w-full py-2 text-sm border border-primary/30"
        >
          {isTranscribing ? t("voice.transcribing") : t("voice.improveWithCloud")}
        </button>
      )}
      {hasStoredBlob && !transcript && (status === t("voice.noSpeechDetected") || speechUnavailable) && (
        <>
          {speechUnavailable && (
            <p className="text-sm text-primary/80 mt-2 font-bangla">{t("voice.speechUnavailable")}</p>
          )}
          <button
            type="button"
            onClick={handleImproveWithCloud}
            disabled={isTranscribing}
            className="btn btn-primary mt-2 w-full py-2 text-sm"
          >
            {isTranscribing ? t("voice.transcribing") : t("voice.improveWithCloud")}
          </button>
        </>
      )}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
          <p className="text-sm text-red-800 font-bangla">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="btn btn-primary mt-2 w-full py-2 text-sm"
          >
            {t("voice.retry")}
          </button>
        </div>
      )}
      {transcript && (
        <div className="mt-5 pt-4 border-t-2 border-primary/20">
          <p className="label font-bangla text-primary">{t("voice.transcript")}</p>
          {transcript.startsWith("[Demo:") && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900 font-bangla">{t("voice.demoNotice")}</p>
              <a
                href="/api/transcribe"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs text-primary font-medium hover:underline"
              >
                {t("voice.debugLink")}
              </a>
              <button
                type="button"
                onClick={handleRetry}
                className="btn btn-primary mt-2 w-full py-2 text-sm"
              >
                {t("voice.retry")}
              </button>
            </div>
          )}
          <div className="min-h-[72px] p-4 bg-surface rounded-xl text-base whitespace-pre-wrap break-words font-bangla leading-relaxed">
            {transcript}
          </div>
          {(translationLoading || translation) && (
            <div className="mt-3">
              <p className="label text-primary">{t("voice.translationLabel")}</p>
              <div className="min-h-[48px] p-4 bg-primary/5 rounded-xl text-sm whitespace-pre-wrap break-words leading-relaxed border border-primary/20">
                {translationLoading ? t("voice.translationLoading") : translation}
              </div>
            </div>
          )}
          
          {transcript && !transcript.startsWith("[Demo:") && !hasReportedRef.current && (
            <div className="mt-4 space-y-2">
              {translationLoading && (
                <p className="text-xs text-center text-primary/60">
                  {lang === "bn" ? "অনুবাদ হচ্ছে..." : "Translating..."}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onTranscriptReady) {
                    hasReportedRef.current = true;
                    onTranscriptReady(transcript, translation || "");
                  }
                }}
                disabled={translationLoading}
                className="btn btn-primary w-full py-3.5 text-base font-semibold shadow-lg disabled:opacity-50"
              >
                {translationLoading 
                  ? (lang === "bn" ? "⏳ অপেক্ষা করুন..." : "⏳ Please wait...")
                  : (lang === "bn" ? "এগিয়ে যান →" : "Continue →")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
