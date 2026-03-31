"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { medicalHistoryQuestions } from "@/lib/questionnaire";

export default function GuidedIntake({ onComplete }) {
  const { t, lang } = useLanguage();
  const [voiceLang, setVoiceLang] = useState("bn");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const recognizedTextRef = useRef("");

  const questions = medicalHistoryQuestions[lang] || medicalHistoryQuestions.en;
  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const speakQuestion = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceLang]);

  const startRecording = useCallback(async () => {
    setStatus(t("voice.recording"));
    setCurrentTranscript("");
    recognizedTextRef.current = "";
    
    // Speak recording start message in voice language
    const recordingMsg = voiceLang === "bn" 
      ? "রেকর্ডিং শুরু হচ্ছে। আপনার উত্তর বলুন।"
      : "Recording started. Please answer the question.";
    setTimeout(() => speakQuestion(recordingMsg), 200);
    
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
        const text = recognizedTextRef.current.trim() || currentTranscript.trim();
        if (text) {
          setCurrentTranscript(text);
          setStatus(t("voice.done"));
        // Speak completion message in voice language
        const doneMsg = voiceLang === "bn" 
          ? "উত্তর পাওয়া গেছে। ধন্যবাদ।"
          : "Answer received. Thank you.";
        setTimeout(() => speakQuestion(doneMsg), 200);
        } else {
          setStatus(t("voice.noSpeechDetected"));
        }
      };
      
      recorder.start(200);
      setIsRecording(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = voiceLang === "bn" ? "bn-BD" : "en-US";
          console.log("=".repeat(60));
          console.log("[Guided STT] Configuration:");
          console.log("  UI Language:", lang);
          console.log("  Voice Input Language:", voiceLang);
          console.log("  STT Language:", rec.lang);
          console.log("  Question:", currentStep + 1, "of", questions.length);
          console.log("  Expected:", voiceLang === "bn" ? "Bangla speech → Bangla text" : "English speech → English text");
          console.log("=".repeat(60));
          rec.onresult = (e) => {
            let fullText = "";
            let finalText = "";
            for (let i = 0; i < e.results.length; i++) {
              const result = e.results[i];
              const text = result[0]?.transcript?.trim() || "";
              if (text) {
                fullText += (fullText ? " " : "") + text;
                if (result.isFinal) {
                  finalText += (finalText ? " " : "") + text;
                  recognizedTextRef.current += (recognizedTextRef.current ? " " : "") + text;
                }
              }
            }
            // Show interim results immediately for better UX
            if (fullText.trim()) {
              setCurrentTranscript(fullText);
              // Check language of output
              const hasBangla = /[\u0980-\u09FF]/.test(fullText);
              const hasEnglish = /[a-zA-Z]/.test(fullText);
              console.log("[Guided STT] Heard:", fullText.substring(0, 40) + "...");
              console.log("[Guided STT] Bangla:", hasBangla, "| English:", hasEnglish);
              if (voiceLang === "bn" && !hasBangla && hasEnglish) {
                console.warn("⚠️ WARNING: Voice lang is Bangla but STT producing English text!");
                console.warn("⚠️ Browser may not support Bangla STT - try Chrome");
              }
            }
          };
          rec.start();
          speechRecognitionRef.current = rec;
        } catch (_) {}
      }
    } catch (err) {
      setStatus(t("voice.errorMic"));
    }
  }, [voiceLang, t, speakQuestion, currentStep, questions.length, lang]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const handleNext = useCallback(() => {
    const answer = currentTranscript.trim();
    if (!answer) return;
    
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
      },
    ];
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      setIsProcessing(true);
      const fullTranscript = newAnswers
        .map((a) => `${a.question}\n${a.answer}`)
        .join("\n\n");
      onComplete(fullTranscript, newAnswers);
    } else {
      setCurrentStep(currentStep + 1);
      setCurrentTranscript("");
      setStatus("");
      setTimeout(() => {
        const nextQ = questions[currentStep + 1];
        if (nextQ) speakQuestion(nextQ.text);
      }, 500);
    }
  }, [currentTranscript, answers, currentQuestion, currentStep, isLastQuestion, questions, onComplete, speakQuestion]);

  const handleSkip = useCallback(async () => {
    if (isLastQuestion) {
      setIsProcessing(true);
      const fullTranscript = answers
        .map((a) => `${a.question}\n${a.answer}`)
        .join("\n\n");
      
      // Check if translation needed
      const hasBangla = answers.some(a => /[\u0980-\u09FF]/.test(a.answer || ""));
      let translation = "";
      
      if (hasBangla) {
        console.log("[Guided] Translating on skip...");
        setTranslationLoading(true);
        try {
          const res = await fetch(`/api/translate?text=${encodeURIComponent(fullTranscript)}&from=bn&to=en`);
          const data = await res.json();
          translation = data?.translated || "";
        } catch (err) {
          console.error("[Guided] Translation failed:", err);
        } finally {
          setTranslationLoading(false);
        }
      }
      
      onComplete(fullTranscript, newAnswers, translation);
    } else {
      setCurrentStep(currentStep + 1);
      setCurrentTranscript("");
      setStatus("");
      setTimeout(() => {
        const nextQ = questions[currentStep + 1];
        if (nextQ) speakQuestion(nextQ.text);
      }, 500);
    }
  }, [currentTranscript, answers, currentQuestion, currentStep, isLastQuestion, questions, onComplete, speakQuestion, voiceLang]);

  const handleReplay = useCallback(() => {
    speakQuestion(currentQuestion.text);
  }, [currentQuestion, speakQuestion]);

  // Auto-speak first question on mount
  useEffect(() => {
    if (currentStep === 0 && currentQuestion) {
      const welcomeMsg = voiceLang === "bn"
        ? "স্বাগতম। আমি আপনাকে কিছু প্রশ্ন করব। প্রথম প্রশ্ন:"
        : "Welcome. I will ask you some questions. First question:";
      setTimeout(() => {
        speakQuestion(welcomeMsg);
        setTimeout(() => speakQuestion(currentQuestion.text), 2000);
      }, 500);
    }
  }, []); // Only on mount

  return (
    <div className="space-y-6">
      <div className="card rounded-xl bg-blue-50 border-2 border-blue-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🗣️</span>
            <p className="text-sm font-semibold text-blue-900">
              {lang === "bn" ? "রোগীর ভাষা নির্বাচন করুন:" : "Select Patient's Language:"}
            </p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-blue-400">
            <button
              type="button"
              onClick={() => setVoiceLang("bn")}
              disabled={isRecording}
              className={`px-4 py-2 text-sm font-semibold transition ${
                voiceLang === "bn"
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-blue-100"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang("en")}
              disabled={isRecording}
              className={`px-4 py-2 text-sm font-semibold transition ${
                voiceLang === "en"
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-blue-100"
              }`}
            >
              English
            </button>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          {lang === "bn" 
            ? "রোগী যে ভাষায় কথা বলবেন সেটি নির্বাচন করুন। প্রশ্ন এই ভাষায় উচ্চারিত হবে।"
            : "Select the language the patient will speak. Questions will be spoken in this language."}
        </p>
      </div>

      <div className="card rounded-xl bg-primary/5 border-primary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            Question {currentStep + 1} / {questions.length}
          </p>
          <button
            type="button"
            onClick={handleReplay}
            className="text-xs text-primary font-medium hover:underline"
            disabled={isProcessing}
          >
            🔊 {lang === "bn" ? "আবার শুনুন" : "Replay"}
          </button>
        </div>
        <h3 className="text-lg font-bold text-primary font-bangla mb-2">
          {currentQuestion.text}
        </h3>
        <p className="text-sm text-primary/80 font-bangla">
          {currentQuestion.prompt}
        </p>
      </div>

      <div className="card rounded-xl">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-full min-h-[120px] rounded-full flex flex-col items-center justify-center gap-2 transition ${
            isRecording
              ? "bg-red-50 border-3 border-red-600 text-red-800"
              : "bg-surface border-3 border-primary text-primary"
          }`}
          style={{ borderWidth: 3 }}
        >
          <span className="text-5xl" aria-hidden>🎤</span>
          <span className="text-base font-semibold font-bangla">
            {isRecording ? t("voice.recordStop") : t("voice.recordStart")}
          </span>
        </button>
        
        {status && (
          <p className="text-center text-sm text-primary/80 mt-3" aria-live="polite">
            {status}
          </p>
        )}

        {currentTranscript && (
          <div className="mt-4 p-4 bg-surface rounded-xl">
            <p className="text-xs text-primary/70 mb-2 font-semibold">
              {lang === "bn" ? "আপনার উত্তর:" : "Your answer:"}
            </p>
            <p className="text-sm text-primary font-bangla whitespace-pre-wrap">
              {currentTranscript}
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentTranscript.trim() || isProcessing}
            className="btn btn-primary flex-1"
          >
            {isProcessing
              ? t("common.loading")
              : isLastQuestion
                ? (lang === "bn" ? "সম্পূর্ণ করুন" : "Complete")
                : (lang === "bn" ? "পরবর্তী" : "Next")}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isProcessing}
            className="btn btn-ghost"
          >
            {lang === "bn" ? "এড়িয়ে যান" : "Skip"}
          </button>
        </div>
      </div>

      <div className="text-center">
        {answers.map((a, idx) => (
          <span key={idx} className="inline-block w-2 h-2 rounded-full bg-primary/30 mx-0.5" />
        ))}
        {Array.from({ length: questions.length - answers.length }).map((_, idx) => (
          <span key={idx + answers.length} className="inline-block w-2 h-2 rounded-full bg-primary/10 mx-0.5" />
        ))}
      </div>
    </div>
  );
}
