import React, { useState, useRef, useEffect } from 'react';
import { Slide, ContentBlock, TextBlock as TextBlockType, ImageBlock as ImageBlockType, QuizBlock as QuizBlockType, FunFactBlock as FunFactBlockType, TableBlock as TableBlockType, NotesSummaryBlock as NotesSummaryBlockType, FillBlankBlock as FillBlankBlockType, ShortAnswerBlock as ShortAnswerBlockType, ReflectionBlock as ReflectionBlockType, MatchFollowingBlock as MatchFollowingBlockType } from '../types';
import { Icons } from '../constants';
import { generateSpeech } from '../services/geminiService';
import InteractiveCard from './InteractiveCard';
import LoadingSkeleton from './LoadingSkeleton';

// ============================================
// TEXT BLOCK
// ============================================
const TextBlock: React.FC<{ block: TextBlockType }> = ({ block }) => {
  if (!block.content) return null;

  return (
    <div className="prose prose-lg max-w-none mb-8 prose-headings:font-medium prose-p:text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-700">
      {block.content.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-medium mt-8 mb-4 text-gray-900">{line.replace(/^### /, '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-medium mt-10 mb-5 text-gray-900">{line.replace(/^## /, '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-medium mt-12 mb-6 text-gray-900">{line.replace(/^# /, '')}</h1>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-2 text-gray-700">{line.replace(/^- /, '')}</li>;
        if (line.trim() === '') return <br key={i} />;

        // Handle bold text
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="mb-4 leading-relaxed text-gray-700">
            {parts.map((part, idx) =>
              idx % 2 === 1 ? <strong key={idx} className="text-gray-900 font-medium">{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// ENHANCED IMAGE BLOCK with better loading states
// ============================================
const ImageBlock: React.FC<{ block: ImageBlockType }> = ({ block }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { imageUrl, keywords, caption, position = 'hero' } = block;

  const placeholderUrl = `https://placehold.co/800x450/f3f4f6/6b7280?text=${encodeURIComponent(keywords?.slice(0, 15) || 'Image')}`;

  const isLoading = imageUrl === null;
  const src = imgError ? placeholderUrl : (imageUrl || placeholderUrl);

  // Enhanced loading skeleton with shimmer
  const LoadingSkeleton = ({ height }: { height: string }) => (
    <div className={`w-full ${height} bg-gray-100 rounded-xl overflow-hidden relative animate-pulse`}>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer" />
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  // HERO: Large, centered with enhanced effects
  if (position === 'hero') {
    return (
      <figure className="w-full max-w-3xl mx-auto my-10">
        {isLoading ? (
          <LoadingSkeleton height="h-[280px]" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="relative">
              {!imgLoaded && <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" />}
              <img
                src={src}
                alt={caption || keywords || 'Illustration'}
                className={`w-full h-auto min-h-[200px] max-h-[350px] object-contain rounded-xl transition-all duration-700 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        )}
        {caption && (
          <figcaption className="text-center text-sm text-gray-500 mt-4">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // INTRO: Left-aligned, floating beside text with enhanced styling
  if (position === 'intro') {
    return (
      <figure className="sm:float-left float-none sm:mr-8 mr-0 mb-6 w-full sm:w-[40%] max-w-sm">
        {isLoading ? (
          <LoadingSkeleton height="h-[180px]" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="relative">
              {!imgLoaded && <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" />}
              <img
                src={src}
                alt={caption || keywords || 'Illustration'}
                className={`w-full h-auto min-h-[200px] max-h-[280px] object-contain rounded-xl transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        )}
        {caption && (
          <figcaption className="text-center text-xs text-gray-500 mt-2">{caption}</figcaption>
        )}
      </figure>
    );
  }

  // GRID: For image galleries with staggered animation
  return (
    <figure className="inline-block w-[48%] sm:w-[32%] mx-[0.5%] mb-6 align-top">
      {isLoading ? (
        <LoadingSkeleton height="h-[140px]" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="relative">
            {!imgLoaded && <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" />}
            <img
              src={src}
              alt={caption || keywords || 'Illustration'}
              className={`w-full h-auto min-h-[200px] max-h-[200px] object-contain rounded-xl transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        </div>
      )}
      {caption && (
        <figcaption className="text-center text-xs text-gray-500 mt-2">{caption}</figcaption>
      )}
    </figure>
  );
};

// ============================================
// ENHANCED QUIZ BLOCK with better interactions
// ============================================
const QuizBlock: React.FC<{ block: QuizBlockType; onComplete?: () => void }> = ({ block, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!block.question || !block.options || block.options.length === 0) {
    return (
      <div className="my-8 py-6 border-t border-gray-200">
        <LoadingSkeleton variant="card" height="200px" />
      </div>
    );
  }

  const handleSelect = (idx: number) => {
    if (showExplanation) return;
    
    setSelectedIndex(idx);
    setIsAnimating(true);
    
    setTimeout(() => {
      setShowExplanation(true);
      setIsAnimating(false);
    }, 300);
  };

  // notify parent when this quiz shows explanation (i.e., completed)
  useEffect(() => {
    if (showExplanation && onComplete) {
      try { onComplete(); } catch (e) { /* ignore */ }
    }
  }, [showExplanation, onComplete]);

  return (
    <div className="my-10 py-8 border-t border-gray-200 clear-both bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl px-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Quick Check</p>
        </div>
        <p className="text-xl font-medium mb-6 text-gray-900 leading-relaxed">{block.question}</p>
        <div className="space-y-3">
          {block.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrect = option.isCorrect;

            let btnClass = 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50';
            if (showExplanation) {
              if (isCorrect) btnClass = 'border-green-500 text-green-700 bg-green-50 shadow-green-500/20';
              else if (isSelected) btnClass = 'border-red-500 text-red-700 bg-red-50 shadow-red-500/20';
              else btnClass = 'border-gray-200 text-gray-500 bg-gray-50';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showExplanation}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-300 
                  flex justify-between items-center group relative overflow-hidden
                  ${btnClass}
                  ${isAnimating && isSelected ? 'animate-pulse' : ''}
                  hover:transform hover:scale-[1.02] disabled:hover:scale-100
                  shadow-sm hover:shadow-md
                `}
              >
                <span className="relative z-10">{option.text}</span>
                
                {showExplanation && isCorrect && (
                  <span className="text-green-500 text-lg">✓</span>
                )}
                {showExplanation && isSelected && !isCorrect && (
                  <span className="text-red-500 text-lg">✗</span>
                )}
              </button>
            );
          })}
        </div>
        {showExplanation && block.explanation && (
          <div className="mt-6 p-4 bg-white rounded-xl border-l-4 border-blue-500 shadow-sm">
            <p className="text-gray-700 text-sm leading-relaxed">
              {block.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ENHANCED FUN FACT BLOCK with better styling
// ============================================
const FunFactBlock: React.FC<{ block: FunFactBlockType }> = ({ block }) => {
  if (!block.fact) return null;

  return (
    <div className="my-8 py-6 px-6 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 rounded-r-xl clear-both">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Did you know?</p>
        </div>
        <p className="text-gray-700 leading-relaxed">{block.fact}</p>
      </div>
    </div>
  );
};

// ============================================
// TABLE BLOCK
// ============================================
const TableBlock: React.FC<{ block: TableBlockType }> = ({ block }) => {
  if (!block.markdown) return null;

  const lines = block.markdown.trim().split('\n');
  if (lines.length < 2) return <p className="text-gray-600">{block.markdown}</p>;

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  const bodyRows = lines.slice(2).map(row =>
    row.split('|').map(cell => cell.trim()).filter(c => c)
  );

  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 clear-both shadow-sm">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-600 uppercase bg-gray-50">
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col" className="px-6 py-3 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, i) => (
            <tr key={i} className="bg-white border-t border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-6 py-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// NOTES & SUMMARY BLOCK (Clean design)
// ============================================
const NotesSummaryBlock: React.FC<{ block: NotesSummaryBlockType }> = ({ block }) => {
  if (!block.points || block.points.length === 0) return null;

  return (
    <section className="my-10 py-8 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-3">
        <Icons.BookOpen className="text-blue-500" /> Key Takeaways
      </h3>
      {block.summary && (
        <p className="text-gray-600 mb-6 leading-relaxed border-l-2 border-gray-300 pl-4">
          {block.summary}
        </p>
      )}
      <ul className="space-y-3">
        {block.points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-700">
            <span className="text-blue-500 mt-1">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

// ============================================
// FILL IN THE BLANK BLOCK
// ============================================
const FillBlankBlock: React.FC<{ block: FillBlankBlockType }> = ({ block }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  if (!block.sentence) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 my-4 shadow-sm">
      <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Fill in the Blank</h4>
      <p className="text-lg text-gray-900 mb-4">{block.sentence.replace('___', '______')}</p>
      <div className="flex gap-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Your answer..."
          className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          disabled={showAnswer}
        />
        <button
          onClick={() => setShowAnswer(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          disabled={showAnswer}
        >
          Check
        </button>
      </div>
      {showAnswer && (
        <div className={`mt-4 p-4 rounded-lg ${userAnswer.toLowerCase().trim() === block.answer?.toLowerCase().trim() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-gray-900">
            <strong>Answer:</strong> {block.answer}
          </p>
          {block.explanation && <p className="text-gray-600 text-sm mt-2">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
};

// ============================================
// SHORT ANSWER BLOCK
// ============================================
const ShortAnswerBlock: React.FC<{ block: ShortAnswerBlockType }> = ({ block }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  if (!block.question) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 my-4 shadow-sm">
      <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Short Answer</h4>
      <p className="text-lg text-gray-900 mb-4">{block.question}</p>
      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Write your answer..."
        rows={3}
        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
        disabled={showAnswer}
      />
      <button
        onClick={() => setShowAnswer(true)}
        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        disabled={showAnswer}
      >
        Show Expected Answer
      </button>
      {showAnswer && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-900"><strong>Expected:</strong> {block.expectedAnswer}</p>
          {block.explanation && <p className="text-gray-600 text-sm mt-2">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
};

// ============================================
// REFLECTION BLOCK
// ============================================
const ReflectionBlock: React.FC<{ block: ReflectionBlockType }> = ({ block }) => {
  const [response, setResponse] = useState('');

  if (!block.prompt) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 my-4">
      <h4 className="text-sm font-medium text-purple-600 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Icons.Sparkles /> Reflect
      </h4>
      <p className="text-lg text-gray-900 mb-4">{block.prompt}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Take a moment to think and write your thoughts..."
        rows={4}
        className="w-full bg-white/50 border border-purple-200 rounded-lg px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
      />
    </div>
  );
};

// ============================================
// MATCH THE FOLLOWING BLOCK
// ============================================
const MatchFollowingBlock: React.FC<{ block: MatchFollowingBlockType }> = ({ block }) => {
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [showAnswers, setShowAnswers] = useState(false);

  // Show placeholder if pairs are missing or empty
  if (!block.pairs || block.pairs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 my-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Match the Following</h4>
        <p className="text-gray-500 italic">Match content is loading or unavailable...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 my-4 shadow-sm">
      <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Match the Following</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {block.pairs.map((pair, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-gray-900">
              {idx + 1}. {pair.left}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {block.pairs.map((pair, idx) => (
            <div key={idx} className={`bg-gray-50 p-3 rounded-lg text-gray-900 border ${showAnswers ? 'border-green-500' : 'border-gray-200'}`}>
              {String.fromCharCode(65 + idx)}. {pair.right}
            </div>
          ))}
        </div>
      </div>
      {!showAnswers && (
        <button
          onClick={() => setShowAnswers(true)}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Show Answers
        </button>
      )}
      {showAnswers && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">Correct matches:</p>
          <ul className="mt-2 text-gray-700 text-sm">
            {block.pairs.map((pair, idx) => (
              <li key={idx}>{idx + 1} → {String.fromCharCode(65 + idx)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN SLIDE VIEW
// ============================================
interface SlideViewProps {
  slide: Slide;
  onSlideComplete?: (slideId: string) => void;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const SlideView: React.FC<SlideViewProps> = ({ slide, onSlideComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Use pre-generated audio URL if available
  const preGeneratedAudio = slide.audioUrl;

  // Reset audio state when slide changes
  useEffect(() => {
    // Stop any playing audio
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    setAudioBase64(null);
  }, [slide.id]);

  const getTextForSpeech = () => {
    return slide.blocks
      .filter((b): b is TextBlockType => b.type === 'text')
      .map(b => b.content)
      .join(' ')
      .substring(0, 500);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await decodeAudioData(decode(base64Data), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error", err);
      setIsPlaying(false);
    }
  };

  const toggleAudio = async () => {
    if (isPlaying) {
      // Stop any playing audio
      stopAudio();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
    } else {
      // Use pre-generated audio if available
      if (preGeneratedAudio) {
        try {
          if (!audioElementRef.current) {
            audioElementRef.current = new Audio(preGeneratedAudio);
            audioElementRef.current.onended = () => setIsPlaying(false);
          }
          audioElementRef.current.currentTime = 0;
          await audioElementRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Pre-generated audio playback error", error);
        }
      } else if (!audioBase64) {
        // Fallback to on-demand TTS generation
        setAudioLoading(true);
        try {
          const text = getTextForSpeech();
          const base64 = await generateSpeech(text);
          setAudioBase64(base64);
          await playAudio(base64);
        } catch (error) {
          console.error("TTS Error", error);
        } finally {
          setAudioLoading(false);
        }
      } else {
        await playAudio(audioBase64);
      }
    }
  };

  // Filter valid blocks
  const validBlocks = slide.blocks.filter(block => block && block.type);

  // Track quiz completion within this slide. If all quizzes are completed we notify parent.
  const totalQuizBlocks = validBlocks.filter(b => b.type === 'quiz').length;
  const completedQuizCountRef = useRef(0);
  const [, setQuizzesCompleted] = useState(0);
  const handleQuizComplete = () => {
    completedQuizCountRef.current += 1;
    setQuizzesCompleted(completedQuizCountRef.current);
    if (totalQuizBlocks > 0 && completedQuizCountRef.current >= totalQuizBlocks) {
      try { onSlideComplete && onSlideComplete(slide.id); } catch (e) {}
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {/* Enhanced Header with animations */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-tight leading-tight">
          {slide.title}
        </h1>
        <div className="flex-shrink-0">
          <button
            onClick={toggleAudio}
            disabled={audioLoading}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 group border border-gray-200"
          >
            {audioLoading ? (
              <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
            ) : isPlaying ? (
              <Icons.Pause className="group-hover:scale-110 transition-transform" />
            ) : (
              <Icons.Play className="group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm hidden sm:inline font-medium">
              {audioLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}
            </span>
          </button>
        </div>
      </div>

      {/* Enhanced Content Blocks with staggered animations */}
      <div>
        {validBlocks.map((block, index) => {
          const key = `${slide.id}-${index}`;

          const blockElement = (() => {
            switch (block.type) {
              case 'text':
                return <TextBlock key={key} block={block as TextBlockType} />;
              case 'image':
                return <ImageBlock key={key} block={block as ImageBlockType} />;
              case 'quiz':
                return <QuizBlock key={key} block={block as QuizBlockType} onComplete={handleQuizComplete} />;
              case 'fun_fact':
                return <FunFactBlock key={key} block={block as FunFactBlockType} />;
              case 'table':
                return <TableBlock key={key} block={block as TableBlockType} />;
              case 'notes_summary':
                return <NotesSummaryBlock key={key} block={block as NotesSummaryBlockType} />;
              case 'fill_blank':
                return <FillBlankBlock key={key} block={block as FillBlankBlockType} />;
              case 'short_answer':
                return <ShortAnswerBlock key={key} block={block as ShortAnswerBlockType} />;
              case 'reflection':
                return <ReflectionBlock key={key} block={block as ReflectionBlockType} />;
              case 'match_following':
                return <MatchFollowingBlock key={key} block={block as MatchFollowingBlockType} />;
              default:
                return null;
            }
          })();

          return (
            <div key={key}>
              {blockElement}
            </div>
          );
        })}
        {/* Clear floats from left/right positioned images */}
        <div className="clear-both" />
      </div>
    </div>
  );
};