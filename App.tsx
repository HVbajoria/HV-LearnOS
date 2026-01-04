import React, { useState, useEffect, useRef } from 'react';
import { Course, Module, Slide, ViewState, ChatMessage, CurriculumData, LearningPreferences, LearningMode, Article, ArticleSection, Presentation, PresentationSlide } from './types';
import {
  generateCurriculum,
  generateModuleContent,
  generateConsultantReply,
  generateChatResponse,
  refineCurriculum,
  adjustCurriculum,
  generateTTSForModule,
  ConsultantResult,
  LIVE_VOICE_ENABLED,
  generateArticle,
  generatePresentation,
  fetchArticleImages,
  fetchPresentationImages,
  selectImagesForModule
} from './services/geminiService';
import { Icons } from './constants';
import { SlideView } from './components/SlideView';
import { ChatWidget } from './components/ChatWidget';
import { useGeminiLive } from './hooks/useGeminiLive';
import { CURATED_TOPICS, CuratedTopic } from './data/curatedTopics';

function App() {
  // View state
  const [view, setView] = useState<ViewState>('HOME');
  const [topic, setTopic] = useState('');

  // Chat/Clarification mode
  const [isChatMode, setIsChatMode] = useState(true);
  const [clarificationMessages, setClarificationMessages] = useState<ChatMessage[]>([]);
  const [isConsulting, setIsConsulting] = useState(false);

  // Save custom instructions for future queries (default unchecked)
  const [saveCustomInstructions, setSaveCustomInstructions] = useState(false);

  // Curriculum state (new - for two-phase flow)
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [isRefiningCurriculum, setIsRefiningCurriculum] = useState(false);
  const [refinementMessages, setRefinementMessages] = useState<ChatMessage[]>([]);
  const [adjustPrompt, setAdjustPrompt] = useState('');

  // Course state
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [history, setHistory] = useState<Course[]>([]);

  // Learning mode selection
  const [learningMode, setLearningMode] = useState<LearningMode>('curriculum');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  // Article mode state
  const [article, setArticle] = useState<Article | null>(null);

  // Presentation mode state
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activePresentationSlide, setActivePresentationSlide] = useState(0);

  // Navigation
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isGeneratingModule, setIsGeneratingModule] = useState(false);
  // Track completion state for slides (keyed by moduleIndex-slideId to avoid id collisions)
  const [completedSlides, setCompletedSlides] = useState<Record<string, boolean>>({});

  // On-demand image selection tracking
  const [imagesSelectedForModule, setImagesSelectedForModule] = useState<boolean[]>([]);

  // UI Panels State
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [showCurriculumSidebar, setShowCurriculumSidebar] = useState(true);
  const [showChatPane, setShowChatPane] = useState(false);
  const [curriculumSidebarWidth, setCurriculumSidebarWidth] = useState(280);
  const [chatPaneWidth, setChatPaneWidth] = useState(350);

  // Inline chat state for LEARNING view
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice and chat states
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Voice chat for Learning View - with full slide context
  const currentSlideForVoice = course?.modules[activeModuleIndex]?.slides[activeSlideIndex];
  const slideContentForVoice = currentSlideForVoice?.blocks
    ?.filter((b: any) => ['text', 'fun_fact', 'notes_summary'].includes(b.type))
    ?.map((b: any) => {
      if (b.type === 'text') return b.content;
      if (b.type === 'fun_fact') return `Fun fact: ${b.fact}`;
      if (b.type === 'notes_summary') return b.summary || b.points?.join('. ');
      return '';
    })
    ?.join('\n\n') || '';

  const learningVoice = useGeminiLive({
    onMessage: (msg) => {
      setChatMessages(prev => [...prev, { role: msg.role, text: msg.text, timestamp: Date.now() }]);
    },
    initialContext: course ? `[CONTEXT: You are a friendly, enthusiastic AI tutor. The student is learning about "${course.topic}".\n\nCURRENT SLIDE: "${currentSlideForVoice?.title || 'Introduction'}"\n\nSLIDE CONTENT:\n${slideContentForVoice}\n\nYOUR TASK: Start with an engaging, brief greeting that shows excitement about what they're exploring. Something like "Oh cool, you're looking at [topic]! That's fascinating because..." - make them feel curious and engaged. Then be ready to answer any questions they have. Keep all responses conversational and brief since this is voice chat.]` : undefined
  });

  // Build conversation context for consultant voice
  const conversationContextForVoice = clarificationMessages
    .map(m => `${m.role === 'user' ? 'User' : 'Consultant'}: ${m.text}`)
    .join('\n');

  // Voice chat for Consultant View - with exploration context and function calling
  const consultantVoice = useGeminiLive({
    onMessage: (msg) => {
      setClarificationMessages(prev => [...prev, { role: msg.role, text: msg.text, timestamp: Date.now() }]);
    },
    // Called when model invokes the request_curriculum_generation function
    onGenerateCurriculum: () => {
      console.log('🎯 Curriculum generation requested via function call');
      // Stop voice chat and trigger curriculum generation
      consultantVoice.stop();
      setTimeout(() => {
        if (!isLoading && clarificationMessages.length >= 2) {
          handleGenerateFromChat();
        }
      }, 500);
    },
    initialContext: conversationContextForVoice
      ? `[CONTEXT: You are a friendly learning consultant continuing a conversation about what the user wants to learn.\n\nCONVERSATION SO FAR:\n${conversationContextForVoice}\n\nYOUR TASK: Continue this natural conversation to help the user clarify what they want to learn. When you feel you have enough information, offer to create a personalized curriculum. If the user agrees (says yes, sure, ok, go ahead, create it, etc.), call the request_curriculum_generation function. Keep responses conversational and brief since this is voice chat.]`
      : `[CONTEXT: You are a friendly learning consultant. Start by warmly greeting the user and asking what they'd like to learn about today. Ask follow-up questions to understand:\n- What topic interests them\n- Their current knowledge level\n- What they want to achieve\n\nWhen you feel you have enough information, offer to create a personalized curriculum. ONLY call the request_curriculum_generation function when the user explicitly agrees or asks you to create it. Keep responses conversational and brief since this is voice chat.]`
  });

  const clarificationEndRef = useRef<HTMLDivElement>(null);
  const refinementEndRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Learning preferences state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferences, setPreferences] = useState<LearningPreferences>({
    knowledgeLevel: 'intermediate',
    preferredDepth: 'standard',
    customInstructions: ''
  });

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('omni_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); }
      catch (e) { console.error("Failed to parse history", e); }
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('omni_preferences');
    if (savedPrefs) {
      try { setPreferences(JSON.parse(savedPrefs)); }
      catch (e) { console.error("Failed to parse preferences", e); }
    }
  }, []);

  // Scroll to top when view, module, or slide changes
  useEffect(() => {
    // Scroll both window and content container to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [view, activeModuleIndex, activeSlideIndex]);

  // Auto-start voice for presentation mode with slide context
  useEffect(() => {
    if (view === 'PRESENTATION' && presentation && LIVE_VOICE_ENABLED) {
      const currentSlide = presentation.slides[activePresentationSlide];
      if (currentSlide) {
        // Start voice with slide context after a brief delay
        setTimeout(() => {
          // Note: The voice chat will pick up the presentation context from props
          // For now just auto-start it
          // learningVoice.start() would be called if we had the hook at this level
        }, 800);
      }
    }
  }, [view, presentation, activePresentationSlide]);

  // On-demand TTS generation when switching modules
  useEffect(() => {
    if (course && view === 'LEARNING') {
      const module = course.modules[activeModuleIndex];
      if (module && module.isLoaded && !module.ttsGenerated) {
        generateModuleTTS(course, activeModuleIndex);
      }
    }
  }, [activeModuleIndex, course, view]);

  // Save preferences when changed
  const updatePreferences = (newPrefs: Partial<LearningPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('omni_preferences', JSON.stringify(updated));
  };

  // Auto-scroll clarification chat
  useEffect(() => {
    if (view === 'CLARIFICATION') {
      clarificationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clarificationMessages, view]);

  // Auto-scroll refinement chat
  useEffect(() => {
    if (view === 'CURRICULUM_REVIEW') {
      refinementEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [refinementMessages, view]);

  // Auto-scroll chat messages in learning view
  useEffect(() => {
    if (view === 'LEARNING' && showChatPane) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, isChatLoading, currentTranscript, view, showChatPane]);

  const saveToHistory = (c: Course) => {
    const newHistory = [c, ...history.filter(h => h.id !== c.id)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('omni_history', JSON.stringify(newHistory));
  };

  // ============================================
  // INITIAL FLOW
  // ============================================

  const handleInitialSubmit = async () => {
    if (!topic.trim()) return;

    // Chat mode for ALL learning modes - go to CLARIFICATION first
    if (isChatMode) {
      setView('CLARIFICATION');
      const initialMsg: ChatMessage = { role: 'user', text: topic, timestamp: Date.now() };
      setClarificationMessages([initialMsg]);

      if (LIVE_VOICE_ENABLED) {
        setTimeout(() => consultantVoice.start(), 500);
      } else {
        setIsConsulting(true);
        try {
          const result = await generateConsultantReply([], topic, true);
          setClarificationMessages(prev => [...prev, {
            role: 'model',
            text: result.text,
            timestamp: Date.now()
          }]);

          if (result.shouldGenerateCurriculum) {
            await handleGenerateFromChat(result.curriculumContext);
          }
        } catch (e) { console.error(e); }
        finally { setIsConsulting(false); }
      }
      return;
    }

    // Direct mode - generate based on learning mode
    if (learningMode === 'article') {
      setIsLoading(true);
      setLoadingText('Generating article...');
      try {
        const articleData = await generateArticle(topic);

        // Open view immediately with sections (no images yet)
        const newArticle = {
          id: `article-${Date.now()}`,
          topic,
          title: articleData.title,
          overview: articleData.overview,
          sections: articleData.sections.map(s => ({
            ...s,
            imageUrl: null  // Images will load in background
          })),
          createdAt: Date.now()
        };
        setArticle(newArticle);
        setView('ARTICLE');
        setIsLoading(false);
        setLoadingText('');

        // Load images in background, update article as they arrive
        fetchArticleImages(articleData.sections).then(imageMap => {
          setArticle(prev => prev ? {
            ...prev,
            sections: prev.sections.map(s => ({
              ...s,
              imageUrl: imageMap[s.id] || null
            }))
          } : null);
        });
      } catch (e) {
        console.error('Article generation error:', e);
        setIsLoading(false);
        setLoadingText('');
      }
    } else if (learningMode === 'presentation') {
      setIsLoading(true);
      setLoadingText('Creating presentation...');
      try {
        const presData = await generatePresentation(topic);

        // Open view immediately with slides (no images yet)
        const newPresentation = {
          id: `pres-${Date.now()}`,
          topic,
          title: presData.title,
          totalSlides: presData.totalSlides || presData.slides.length,
          slides: presData.slides.map(s => ({
            ...s,
            imageUrls: []  // Images will load in background
          })),
          createdAt: Date.now()
        };
        setPresentation(newPresentation);
        setActivePresentationSlide(0);
        setView('PRESENTATION');
        setIsLoading(false);
        setLoadingText('');

        // Load images in background, update presentation as they arrive
        fetchPresentationImages(presData.slides).then(imageMap => {
          setPresentation(prev => prev ? {
            ...prev,
            slides: prev.slides.map(s => ({
              ...s,
              imageUrls: imageMap[s.id] || []
            }))
          } : null);
        });
      } catch (e) {
        console.error('Presentation generation error:', e);
        setIsLoading(false);
        setLoadingText('');
      }
    } else {
      // Curriculum mode (direct)
      await handleGenerateCurriculumOnly(topic, "", true);
    }
  };

  const handleClarificationSend = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setClarificationMessages(prev => [...prev, userMsg]);
    setIsConsulting(true);

    try {
      const apiHistory = clarificationMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Note: Not using streaming for JSON responses
      const result = await generateConsultantReply(apiHistory, text, false);

      // Add AI response
      setClarificationMessages(prev => [...prev, {
        role: 'model',
        text: result.text,
        timestamp: Date.now()
      }]);

      // If AI confirms we should generate, do it now
      if (result.shouldGenerateCurriculum) {
        setIsConsulting(false);
        await handleGenerateFromChat(result.curriculumContext);
      }
    } catch (e) { console.error(e); }
    finally { setIsConsulting(false); }
  };

  // ============================================
  // CURRICULUM GENERATION (Phase 1 - Structure Only)
  // ============================================

  const handleGenerateCurriculumOnly = async (topicStr: string, context: string, usePreferences = false) => {
    setIsLoading(true);
    setLoadingText('Designing your learning path...');

    try {
      // Pass preferences only when using Quick Generate mode (not chat mode)
      const curriculumData = await generateCurriculum(
        topicStr,
        context,
        usePreferences ? preferences : undefined
      );
      setCurriculum(curriculumData);
      setRefinementMessages([]);
      setView('CURRICULUM_REVIEW');

      // Clear custom instructions after generation if not saving
      if (!saveCustomInstructions) {
        updatePreferences({ customInstructions: '' });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate curriculum. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFromChat = async (context?: { topic: string; interests?: string[]; knowledgeLevel?: string; goals?: string }) => {
    // Stop voice chat when generating content
    consultantVoice.stop();

    // Build context string from consultant's extracted info + conversation
    let contextStr = clarificationMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    if (context) {
      const structuredContext = [
        `TOPIC: ${context.topic || topic}`,
        context.interests?.length ? `INTERESTS: ${context.interests.join(', ')}` : '',
        context.knowledgeLevel ? `LEVEL: ${context.knowledgeLevel}` : '',
        context.goals ? `GOALS: ${context.goals}` : ''
      ].filter(Boolean).join('\n');

      contextStr = structuredContext + '\n\n--- CONVERSATION ---\n' + contextStr;
    }

    const topicToUse = context?.topic || topic;


    // Generate based on learning mode
    if (learningMode === 'article') {
      setIsLoading(true);
      setLoadingText('Generating article...');
      try {
        const articleData = await generateArticle(topicToUse, contextStr);

        // Open view immediately with sections (no images yet)
        setArticle({
          id: `article-${Date.now()}`,
          topic: topicToUse,
          title: articleData.title,
          overview: articleData.overview,
          sections: articleData.sections.map(s => ({
            ...s,
            imageUrl: null
          })),
          createdAt: Date.now()
        });
        setView('ARTICLE');
        setIsLoading(false);
        setLoadingText('');

        // Load images in background
        fetchArticleImages(articleData.sections).then(imageMap => {
          setArticle(prev => prev ? {
            ...prev,
            sections: prev.sections.map(s => ({
              ...s,
              imageUrl: imageMap[s.id] || null
            }))
          } : null);
        });
      } catch (e) {
        console.error('Article generation error:', e);
        setIsLoading(false);
        setLoadingText('');
      }
    } else if (learningMode === 'presentation') {
      setIsLoading(true);
      setLoadingText('Creating presentation...');
      try {
        const presData = await generatePresentation(topicToUse, contextStr);

        // Open view immediately with slides (no images yet)
        setPresentation({
          id: `pres-${Date.now()}`,
          topic: topicToUse,
          title: presData.title,
          totalSlides: presData.totalSlides || presData.slides.length,
          slides: presData.slides.map(s => ({
            ...s,
            imageUrls: []
          })),
          createdAt: Date.now()
        });
        setActivePresentationSlide(0);
        setView('PRESENTATION');
        setIsLoading(false);
        setLoadingText('');

        // Load images in background
        fetchPresentationImages(presData.slides).then(imageMap => {
          setPresentation(prev => prev ? {
            ...prev,
            slides: prev.slides.map(s => ({
              ...s,
              imageUrls: imageMap[s.id] || []
            }))
          } : null);
        });
      } catch (e) {
        console.error('Presentation generation error:', e);
        setIsLoading(false);
        setLoadingText('');
      }
    } else {
      // Curriculum mode (default)
      await handleGenerateCurriculumOnly(topicToUse, contextStr);
    }
  };

  // ============================================
  // CURRICULUM REFINEMENT (Chat Mode)
  // ============================================

  const handleRefinementSend = async (text: string) => {
    if (!curriculum) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setRefinementMessages(prev => [...prev, userMsg]);
    setIsRefiningCurriculum(true);

    try {
      const result = await refineCurriculum(curriculum, text);
      setCurriculum(result.curriculum);
      setRefinementMessages(prev => [...prev, {
        role: 'model',
        text: result.response,
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
      setRefinementMessages(prev => [...prev, {
        role: 'model',
        text: "Sorry, I had trouble making those changes. Please try again.",
        timestamp: Date.now()
      }]);
    }
    finally { setIsRefiningCurriculum(false); }
  };

  // ============================================
  // CURRICULUM ADJUSTMENT (Direct Mode)
  // ============================================

  const handleAdjustCurriculum = async () => {
    if (!curriculum || !adjustPrompt.trim()) return;

    setIsRefiningCurriculum(true);

    try {
      const adjusted = await adjustCurriculum(curriculum, adjustPrompt);
      setCurriculum(adjusted);
      setAdjustPrompt('');
    } catch (e) {
      console.error(e);
      alert("Failed to adjust curriculum. Please try again.");
    }
    finally { setIsRefiningCurriculum(false); }
  };

  // ============================================
  // TTS GENERATION (Background Audio)
  // ============================================

  const generateModuleTTS = async (courseData: Course, moduleIndex: number) => {
    const module = courseData.modules[moduleIndex];
    if (!module || module.ttsGenerated || !module.isLoaded) return;

    console.log(`🔊 Starting TTS generation for Module ${moduleIndex + 1}: ${module.title}`);

    try {
      const audioUrls = await generateTTSForModule(module.slides);

      // Update course with audio URLs
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;

        const updatedModules = prevCourse.modules.map((m, idx) => {
          if (idx !== moduleIndex) return m;

          const updatedSlides = m.slides.map((slide, sIdx) => ({
            ...slide,
            audioUrl: audioUrls[sIdx] || undefined
          }));

          return { ...m, slides: updatedSlides, ttsGenerated: true };
        });

        return { ...prevCourse, modules: updatedModules };
      });

    } catch (error) {
      console.error(`TTS generation failed for module ${moduleIndex}:`, error);
    }
  };

  // ============================================
  // CONTENT GENERATION (Phase 2 - Full Course)
  // ============================================

  const handleGenerateExperience = async () => {
    if (!curriculum) return;

    setIsLoading(true);
    setLoadingText('Generating your learning experience...');

    try {
      // Create course structure from curriculum
      const newCourse: Course = {
        id: crypto.randomUUID(),
        topic: topic,
        title: curriculum.title,
        description: curriculum.description,
        modules: curriculum.modules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          slides: m.slides.map(s => ({ id: s.id, title: s.title, blocks: [] })),
          isLoaded: false
        })),
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      setCourse(newCourse);
      setLoadingText('Generating first module...');

      // Create a ref to track the current course state for callbacks
      let currentCourse = newCourse;


      // Generate Module 1 content (skip auto image selection - will be on-demand)
      const module1 = newCourse.modules[0];
      const module1Content = await generateModuleContent(
        newCourse.title,
        module1.title,
        module1.description,
        module1.slides.map(s => s.title),
        "",
        undefined,  // No callback needed
        true        // skipImageSelection - images loaded on-demand
      );

      // Update course with Module 1 content (images will be null initially)
      const updatedCourse: Course = {
        ...newCourse,
        modules: newCourse.modules.map((m, idx) =>
          idx === 0
            ? { ...m, slides: module1Content.slides as unknown as Slide[], isLoaded: true }
            : m
        )
      };

      currentCourse = updatedCourse;
      setCourse(updatedCourse);
      saveToHistory(updatedCourse);
      setActiveModuleIndex(0);
      setActiveSlideIndex(0);

      // Initialize image selection tracking for all modules
      const initialImageTracking = new Array(updatedCourse.modules.length).fill(false);
      initialImageTracking[0] = true; // Mark module 1 as in-progress
      setImagesSelectedForModule(initialImageTracking);

      // Switch to LEARNING view immediately
      setView('LEARNING');
      setIsLoading(false);

      // Trigger on-demand image selection for Module 1 immediately
      // Use the local updatedCourse reference to avoid stale state issues
      const handleModule1ImageReady = (slideIdx: number, blockIdx: number, imageUrl: string) => {
        setCourse(prevCourse => {
          if (!prevCourse) return prevCourse;
          const updatedModules = prevCourse.modules.map((mod, modIdx) => {
            if (modIdx !== 0) return mod;
            const updatedSlides = mod.slides.map((slide, sIdx) => {
              if (sIdx !== slideIdx) return slide;
              const updatedBlocks = slide.blocks.map((block, bIdx) => {
                if (bIdx !== blockIdx || block.type !== 'image') return block;
                return { ...block, imageUrl };
              });
              return { ...slide, blocks: updatedBlocks };
            });
            return { ...mod, slides: updatedSlides };
          });
          return { ...prevCourse, modules: updatedModules };
        });
      };

      // Start image selection immediately using the generated slides data
      selectImagesForModule(module1Content.slides as any, handleModule1ImageReady);

      // Generate remaining modules in background (with skipImageSelection)
      generateRemainingModules(updatedCourse, 1);

      // Generate TTS for Module 1 in background (don't await)
      generateModuleTTS(updatedCourse, 0);

    } catch (error) {
      console.error(error);
      alert("Failed to generate course content. Please try again.");
      setIsLoading(false);
    }
  };

  const generateRemainingModules = async (currentCourse: Course, startIndex: number) => {
    let updatedCourse = currentCourse;

    for (let i = startIndex; i < currentCourse.modules.length; i++) {
      const module = currentCourse.modules[i];
      if (module.isLoaded) continue;

      const previousContext = currentCourse.modules
        .slice(0, i)
        .map(m => `Module "${m.title}": ${m.slides.map(s => s.title).join(', ')}`)
        .join('\n');

      try {
        console.log(`\n🔄 Background: Generating module ${i + 1}/${currentCourse.modules.length}...`);

        // Rate limiting: wait 5s between modules to respect API limits
        if (i > startIndex) {
          console.log('   ⏳ Waiting 5s before next module...');
          await new Promise(r => setTimeout(r, 5000));
        }

        const moduleContent = await generateModuleContent(
          currentCourse.title,
          module.title,
          module.description,
          module.slides.map(s => s.title),
          previousContext,
          undefined,  // No callback needed
          true        // skipImageSelection - images loaded on-demand when user navigates
        );

        // Merge slides: use structure from moduleContent but preserve imageUrls from state
        setCourse(prevCourse => {
          if (!prevCourse) return prevCourse;

          const currentSlides = prevCourse.modules[i]?.slides || [];

          // Merge: keep imageUrls from current state if they exist
          const mergedSlides = moduleContent.slides.map((newSlide, sIdx) => {
            const currentSlide = currentSlides[sIdx];
            if (!currentSlide) return newSlide;

            // Merge blocks, preserving imageUrls that were loaded
            const mergedBlocks = newSlide.blocks.map((newBlock, bIdx) => {
              const currentBlock = currentSlide.blocks?.[bIdx];
              if (newBlock.type === 'image' && currentBlock?.type === 'image') {
                // Preserve imageUrl if already loaded (not null)
                return currentBlock.imageUrl ? currentBlock : newBlock;
              }
              return newBlock;
            });

            return { ...newSlide, blocks: mergedBlocks };
          });

          return {
            ...prevCourse,
            modules: prevCourse.modules.map((m, idx) =>
              idx === i
                ? { ...m, slides: mergedSlides as unknown as Slide[], isLoaded: true }
                : m
            )
          };
        });

        // Update local reference for next iteration
        updatedCourse = {
          ...updatedCourse,
          modules: updatedCourse.modules.map((m, idx) =>
            idx === i
              ? { ...m, slides: moduleContent.slides as unknown as Slide[], isLoaded: true }
              : m
          )
        };

        saveToHistory(updatedCourse);

      } catch (error) {
        console.error(`Failed to generate module ${i + 1}:`, error);
      }
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const loadModuleIfNeeded = async (moduleIndex: number) => {
    if (!course) return;
    const module = course.modules[moduleIndex];

    if (!module.isLoaded) {
      setIsGeneratingModule(true);

      const previousContext = course.modules
        .slice(0, moduleIndex)
        .filter(m => m.isLoaded)
        .map(m => `Module "${m.title}": ${m.slides.map(s => s.title).join(', ')}`)
        .join('\n');

      try {
        const moduleContent = await generateModuleContent(
          course.title,
          module.title,
          module.description,
          module.slides.map(s => s.title),
          previousContext,
          undefined,  // No callback needed
          true        // skipImageSelection - images loaded on-demand when user navigates
        );

        const updatedCourse: Course = {
          ...course,
          modules: course.modules.map((m, idx) =>
            idx === moduleIndex
              ? { ...m, slides: moduleContent.slides, isLoaded: true }
              : m
          )
        };

        setCourse(updatedCourse);
        saveToHistory(updatedCourse);
      } catch (error) {
        console.error("Failed to load module:", error);
        alert("Failed to load module content.");
      } finally {
        setIsGeneratingModule(false);
      }
    }
  };

  const navigateSlide = async (direction: 'next' | 'prev') => {
    if (!course) return;
    // If moving forward, mark current slide as completed (use module-prefixed key)
    if (direction === 'next') {
      try {
        const currId = course.modules[activeModuleIndex].slides[activeSlideIndex].id;
        const key = `${activeModuleIndex}-${currId}`;
        setCompletedSlides(prev => ({ ...prev, [key]: true }));
      } catch (e) { /* ignore */ }
    }

    let newMod = activeModuleIndex;
    let newSlide = activeSlideIndex;
    const currentModule = course.modules[newMod];

    if (direction === 'next') {
      if (newSlide < currentModule.slides.length - 1) {
        newSlide++;
      } else if (newMod < course.modules.length - 1) {
        newMod++;
        newSlide = 0;
        await loadModuleIfNeeded(newMod);
      } else {
        return;
      }
    } else {
      if (newSlide > 0) {
        newSlide--;
      } else if (newMod > 0) {
        newMod--;
        newSlide = course.modules[newMod].slides.length - 1;
      } else {
        return;
      }
    }

    setActiveModuleIndex(newMod);
    setActiveSlideIndex(newSlide);

    // Trigger on-demand image selection if we moved to a new module
    if (newMod !== activeModuleIndex) {
      triggerImageSelectionForModule(newMod);
    }
  };

  /**
   * Trigger on-demand image selection for a module.
   * Called when user navigates to a module that hasn't had images selected yet.
   */
  const triggerImageSelectionForModule = async (moduleIndex: number) => {
    if (!course) return;

    // Check if already selected
    if (imagesSelectedForModule[moduleIndex]) {
      console.log(`📷 Module ${moduleIndex + 1} images already selected`);
      return;
    }

    const module = course.modules[moduleIndex];
    if (!module || !module.isLoaded) {
      console.log(`📷 Module ${moduleIndex + 1} not loaded yet, skipping image selection`);
      return;
    }

    console.log(`\n📷 Triggering on-demand image selection for Module ${moduleIndex + 1}: "${module.title}"`);

    // Mark as in-progress immediately to prevent duplicate calls
    setImagesSelectedForModule(prev => {
      const updated = [...prev];
      updated[moduleIndex] = true;
      return updated;
    });

    // Create callback to update course state as images are selected
    const handleImageReady = (slideIdx: number, blockIdx: number, imageUrl: string) => {
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;

        const updatedModules = prevCourse.modules.map((mod, modIdx) => {
          if (modIdx !== moduleIndex) return mod;

          const updatedSlides = mod.slides.map((slide, sIdx) => {
            if (sIdx !== slideIdx) return slide;

            const updatedBlocks = slide.blocks.map((block, bIdx) => {
              if (bIdx !== blockIdx || block.type !== 'image') return block;
              return { ...block, imageUrl };
            });

            return { ...slide, blocks: updatedBlocks };
          });

          return { ...mod, slides: updatedSlides };
        });

        return { ...prevCourse, modules: updatedModules };
      });
    };

    // Trigger the image selection
    await selectImagesForModule(module.slides as any, handleImageReady);
  };

  const jumpToSlide = async (modIdx: number, slideIdx: number) => {
    await loadModuleIfNeeded(modIdx);
    setActiveModuleIndex(modIdx);
    setActiveSlideIndex(slideIdx);

    // Trigger on-demand image selection for this module
    triggerImageSelectionForModule(modIdx);
  };

  const loadFromHistory = (item: Course) => {
    setCourse(item);
    setActiveModuleIndex(0);
    setActiveSlideIndex(0);
    const hasContent = item.modules.some(m => m.isLoaded);
    setView(hasContent ? 'LEARNING' : 'PLANNER');
  };

  // ============================================
  // VIEWS
  // ============================================

  // HOME VIEW - Modern Minimalistic Design
  if (view === 'HOME') {
    const deleteFromHistory = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('omni_history', JSON.stringify(newHistory));
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Clean Header */}
        <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="https://d8it4huxumps7.cloudfront.net/uploads/images/unstop/branding-guidelines/logos/blue/Unstop-Logo-Blue-Medium.png" alt="V" className="w-13 h-9 ml-[-6px]" />
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                <img src="https://d8it4huxumps7.cloudfront.net/files/695ab459af53f_screenshot_2026_01_05_at_12_10_44_am.png" alt="H" className="w-5 h-5"   />
              </div>          
            <span className="font-medium text-gray-900">HV LearnOS</span>
            </div>
            {history.length > 0 && (
              <button 
                onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                History ({history.length})
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center space-y-10">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight leading-tight">
                Learn anything
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                AI-powered learning experiences tailored for you
              </p>
            </div>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInitialSubmit()}
                  placeholder="What would you like to learn today?"
                  className="w-full px-6 py-4 text-base text-gray-900 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all shadow-sm"
                />
                <button
                  onClick={handleInitialSubmit}
                  disabled={isLoading || !topic.trim()}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Start'
                  )}
                </button>
              </div>
              
              {/* Mode Selection */}
              <div className="flex items-center justify-center gap-3 mt-8">
                {[
                  { value: 'curriculum', label: 'Course', icon: '📚' },
                  { value: 'article', label: 'Article', icon: '📄' },
                  { value: 'presentation', label: 'Slides', icon: '🎬' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setLearningMode(mode.value as LearningMode)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      learningMode === mode.value
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span className="mr-2">{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Chat Toggle */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <span className={`text-sm font-medium ${!isChatMode ? 'text-gray-900' : 'text-gray-500'}`}>Quick</span>
                <button
                  onClick={() => setIsChatMode(!isChatMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isChatMode ? 'bg-gray-900' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    isChatMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className={`text-sm font-medium ${isChatMode ? 'text-gray-900' : 'text-gray-500'}`}>Guided</span>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                  <span className="text-gray-700 font-medium">{loadingText}</span>
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          {showHistorySidebar && history.length > 0 && (
            <div className="fixed top-20 right-6 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-40 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Continue Learning</h3>
                <button onClick={() => setShowHistorySidebar(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      loadFromHistory(item);
                      setShowHistorySidebar(false);
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                  >
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.title || item.topic}</div>
                      <div className="text-xs text-gray-500">{item.modules?.length || 0} modules</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icons.ArrowRight className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFromHistory(item.id, e);
                        }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded"
                      >
                        <Icons.X className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Curated Topics */}
          {CURATED_TOPICS.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-normal text-gray-900 text-center mb-12">Popular topics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CURATED_TOPICS.map((curatedTopic) => (
                  <button
                    key={curatedTopic.id}
                    onClick={() => {
                      setCurriculum(curatedTopic.curriculum);
                      setRefinementMessages([]);
                      setView('CURRICULUM_REVIEW');
                    }}
                    className="group p-6 bg-white hover:bg-gray-50 rounded-2xl transition-all text-left border border-gray-200 hover:shadow-sm"
                  >
                    {curatedTopic.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={curatedTopic.imageUrl} 
                          alt={curatedTopic.title}
                          className="w-12 h-12 object-contain mx-auto"
                        />
                      </div>
                    )}
                    {!curatedTopic.imageUrl && (
                      <div className="text-2xl mb-4 text-center">{curatedTopic.title.split(' ')[0] === 'Machine' ? '🤖' : curatedTopic.title.split(' ')[0] === 'Quantum' ? '⚛️' : curatedTopic.title.split(' ')[0] === 'Climate' ? '🌍' : '📊'}</div>
                    )}
                    <h3 className="font-medium text-gray-900 mb-2 text-center">{curatedTopic.title}</h3>
                    <p className="text-sm text-gray-600 text-center">{curatedTopic.tagline}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-normal text-gray-900 mb-6">Continue learning</h2>
              <div className="space-y-3">
                {history.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl transition-colors text-left border border-gray-200"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{item.title || item.topic}</div>
                      <div className="text-sm text-gray-500">{item.modules?.length || 0} modules</div>
                    </div>
                    <Icons.ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // CLARIFICATION VIEW - Modern Chat Interface
  if (view === 'CLARIFICATION') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('HOME')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              {/* {(isConsulting || isLoading) && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-medium">AI is thinking...</span>
                </div>
              )} */}
              <span className="font-medium text-gray-900">Learning Assistant</span>
            </div>
            <button
              onClick={handleGenerateFromChat}
              disabled={isLoading || clarificationMessages.length < 2}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {isLoading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {clarificationMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {(isConsulting || isLoading) && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                  <span className="text-gray-700 font-medium">{loadingText}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 sticky bottom-6">
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-3 bg-white text-gray-500 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
                placeholder="Type your response... Or maybe just speak it out loud 😉"
                disabled={isLoading || isConsulting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading && !isConsulting) {
                    handleClarificationSend(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Type your response"]') as HTMLInputElement;
                  if (input?.value.trim() && !isLoading && !isConsulting) {
                    handleClarificationSend(input.value);
                    input.value = '';
                  }
                }}
                disabled={isLoading || isConsulting}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CURRICULUM_REVIEW VIEW - Modern Review Interface
  if (view === 'CURRICULUM_REVIEW' && curriculum) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('HOME')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerateExperience}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? 'Generating...' : 'Start Learning'}
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-4 leading-tight">{curriculum.title}</h1>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">{curriculum.overview}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {curriculum.modules.map((module, idx) => (
              <div key={module.id} className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-2 font-medium">Module {idx + 1}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{module.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{module.description}</p>
                <div className="space-y-2">
                  {module.slides.map((slide) => (
                    <div key={slide.id} className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {slide.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                <span className="text-gray-700 font-medium">{loadingText}</span>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // LEARNING VIEW - Modern Learning Interface
  if (view === 'LEARNING' && course) {
    const currentModule = course.modules[activeModuleIndex];
    const currentSlide = currentModule.slides[activeSlideIndex];
    const isFirst = activeModuleIndex === 0 && activeSlideIndex === 0;
    const isLast = activeModuleIndex === course.modules.length - 1 &&
                   activeSlideIndex === currentModule.slides.length - 1;

    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white h-screen flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <button
              onClick={() => setView('HOME')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Exit
            </button>
            <h2 className="font-medium text-gray-900 truncate">{course.title}</h2>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {course.modules.map((mod, modIdx) => {
              const completedCount = mod.slides.filter(s => !!completedSlides[`${modIdx}-${s.id}`]).length;
              return (
                <div key={mod.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Module {modIdx + 1}</div>
                    <div className="text-xs text-gray-500">{completedCount}/{mod.slides.length} completed</div>
                  </div>
                  <div className="text-sm text-gray-700 mb-3 font-medium">{mod.title}</div>
                  <div className="space-y-1">
                    {mod.slides.map((slide, slideIdx) => (
                      <button
                        key={slide.id}
                        onClick={() => jumpToSlide(modIdx, slideIdx)}
                        disabled={!mod.isLoaded}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          modIdx === activeModuleIndex && slideIdx === activeSlideIndex
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        } disabled:opacity-50 flex items-center justify-between`}
                      >
                        <span className="truncate">{slide.title}</span>
                        {completedSlides[`${modIdx}-${slide.id}`] && (
                          <span className="text-green-500 ml-2">
                            <Icons.Check className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning View with Chat */}
        <div className="flex-1 flex flex-col h-screen">
          <header className="border-b border-gray-200 px-8 py-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Module {activeModuleIndex + 1} • {currentSlide?.title}
              </div>
              <button
                onClick={() => setShowChatPane(!showChatPane)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 transition-colors text-sm font-medium"
              >
                Ask AI
              </button>
            </div>
          </header>

          <main ref={contentScrollRef} className="flex-1 p-8 bg-white overflow-y-auto">
            {isGeneratingModule ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading module...</p>
                </div>
              </div>
            ) : currentSlide && currentSlide.blocks.length > 0 ? (
              <SlideView slide={currentSlide} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No content available for this slide.</p>
              </div>
            )}
          </main>

          <footer className="border-t border-gray-200 px-8 py-4 bg-white">
            <div className="flex items-center justify-between">
              <button
                disabled={isFirst}
                onClick={() => navigateSlide('prev')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors"
              >
                <Icons.ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={isLast}
                onClick={() => navigateSlide('next')}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-colors font-medium"
              >
                Next <Icons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </div>

        {/* Chat Pane */}
        {showChatPane && (
          <div className="w-80 border-l border-gray-200 bg-white h-screen flex flex-col">
            {/* Chat Header with Status */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="text-blue-500">🤖</span>
                  AI Assistant
                </h3>
                <button onClick={() => setShowChatPane(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
              {/* Status indicators */}
              {(isChatLoading || isTyping || isListening || currentTranscript) && (
                <div className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-2 flex items-center gap-2">
                  {isListening && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-medium">🎤 Listening to your voice...</span>
                    </>
                  )}
                  {currentTranscript && !isListening && (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="font-medium">🤔 Processing your speech...</span>
                    </>
                  )}
                  {/* {(isChatLoading || isTyping) && !isListening && !currentTranscript && (
                    <>
                      <div className="flex items-center gap-1 mr-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-medium">AI is thinking...</span>
                    </>
                  )} */}
                </div>
              )}
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  <div className="mb-2">💬</div>
                  <p>Ask me anything about this topic!</p>
                  <p className="text-xs mt-1">You can type or speak</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Live transcript display */}
              {currentTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-blue-50 text-blue-800 border-2 border-dashed border-blue-300 flex items-center gap-2">
                    <span className="text-blue-500 animate-pulse">🎤</span>
                    <span className="italic">"{currentTranscript}..."</span>
                  </div>
                </div>
              )}
              
              {/* Typing indicator */}
              {(isTyping || isChatLoading) && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </div>
            
            {/* Input Area */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!chatInput.trim() || isChatLoading || isListening) return;
              
              const userMessage = chatInput;
              setChatMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: Date.now() }]);
              setChatInput('');
              setIsChatLoading(true);
              setIsTyping(true);
              
              try {
                const history = chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
                const contextPrompt = `Context: Topic is "${course.topic}", current slide is "${currentSlide?.title}". `;
                const response = await generateChatResponse(history, contextPrompt + userMessage);
                
                setTimeout(() => {
                  setChatMessages(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
                  setIsTyping(false);
                }, 1000); // Simulate typing delay
              } catch (err) {
                console.error('Chat error:', err);
                setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I had trouble responding. Please try again.", timestamp: Date.now() }]);
                setIsTyping(false);
              } finally {
                setIsChatLoading(false);
              }
            }} className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder={isListening ? "Listening..." : "Ask a question..."} 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50" 
                  disabled={isListening || isChatLoading}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      setIsListening(false);
                      setCurrentTranscript('');
                    } else {
                      setIsListening(true);
                      // Simulate voice capture
                      setTimeout(() => {
                        setCurrentTranscript("What is quantum computing?");
                        setIsListening(false);
                        setTimeout(() => {
                          setChatInput("What is quantum computing?");
                          setCurrentTranscript('');
                        }, 1000);
                      }, 2000);
                    }
                  }}
                  className={`rounded-xl px-3 py-2 transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/25' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-blue-600'
                  }`}
                  disabled={isChatLoading}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <Icons.Stop className="w-4 h-4" /> : <Icons.Mic className="w-4 h-4" />}
                </button>
                <button 
                  type="submit" 
                  disabled={isChatLoading || isListening || !chatInput.trim()} 
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-3 py-2 disabled:opacity-50 transition-colors"
                >
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ARTICLE VIEW - Long-form content
  if (view === 'ARTICLE' && article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('HOME')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="font-medium text-gray-900">Article</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-normal text-gray-900 leading-tight">{article.title}</h1>
              <p className="text-lg text-gray-600 leading-relaxed">{article.overview}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              {article.sections.map((section) => (
                <div key={section.id} className="mb-8">
                  {section.imageUrl && (
                    <div className="mb-6">
                      <img 
                        src={section.imageUrl} 
                        alt={section.title}
                        className="w-full max-w-2xl mx-auto rounded-xl shadow-sm"
                      />
                    </div>
                  )}
                  <div className="text-gray-900 leading-relaxed text-lg">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // PRESENTATION VIEW - Slide-based presentation
  if (view === 'PRESENTATION' && presentation) {
    const currentSlide = presentation.slides[activePresentationSlide];
    const isFirstSlide = activePresentationSlide === 0;
    const isLastSlide = activePresentationSlide === presentation.slides.length - 1;

    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <header className="border-b border-gray-700 px-8 py-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('HOME')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Exit
            </button>
            <div className="text-sm text-gray-400">
              {activePresentationSlide + 1} / {presentation.totalSlides}
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {currentSlide && (
              <div className="text-center space-y-8">
                {currentSlide.imageUrls?.[0] && (
                  <div className="mb-8">
                    <img 
                      src={currentSlide.imageUrls[0]} 
                      alt={currentSlide.title}
                      className="w-full max-w-2xl mx-auto rounded-xl shadow-lg"
                    />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-normal mb-8">{currentSlide.title}</h1>
                <div className="space-y-4 text-left max-w-3xl mx-auto">
                  {currentSlide.points.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-4 text-xl text-gray-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-3 flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-gray-700 px-8 py-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              disabled={isFirstSlide}
              onClick={() => setActivePresentationSlide(prev => Math.max(0, prev - 1))}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Icons.ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              disabled={isLastSlide}
              onClick={() => setActivePresentationSlide(prev => Math.min(presentation.slides.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-colors font-medium"
            >
              Next <Icons.ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

export default App;