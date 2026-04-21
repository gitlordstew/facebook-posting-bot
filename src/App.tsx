import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  RotateCw, 
  Search, 
  Facebook, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Send,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLatestAINews, generateFacebookPost, AIUpdate, GeneratedPost } from './lib/gemini';

export default function App() {
  const [news, setNews] = useState<AIUpdate[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'informative' | 'minimalist'>('informative');
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const updates = await fetchLatestAINews();
      setNews(updates);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleGenerate = async () => {
    const topic = customTopic || selectedTopic;
    if (!topic) return;

    setGeneratingPost(true);
    try {
      const result = await generateFacebookPost(topic, tone);
      setPost(result);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleCopy = () => {
    if (post) {
      const fullContent = `${post.content}\n\n${post.hashtags.join(' ')}`;
      navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#1877F2] p-2 rounded-lg shadow-sm">
              <Share2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight text-slate-900 leading-none mb-1">AI Post Architect</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Social Intelligence Engine</p>
            </div>
          </div>
          <button 
            onClick={loadNews}
            disabled={loadingNews}
            className="p-2 text-slate-400 hover:text-[#1877F2] hover:bg-slate-50 rounded-full transition-all disabled:opacity-50"
            title="Refresh AI News Feed"
          >
            <RotateCw className={`w-5 h-5 ${loadingNews ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: News Source */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif italic text-lg text-slate-700 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-slate-400" /> Latest AI Flash
            </h2>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingNews ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 animate-pulse h-32" />
              ))
            ) : news.length > 0 ? (
              news.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedTopic(item.title);
                    setCustomTopic('');
                  }}
                  className={`group bg-white p-4 rounded-xl border transition-all cursor-pointer hover:border-[#1877F2] hover:shadow-lg ${
                    selectedTopic === item.title ? 'border-[#1877F2] ring-2 ring-[#1877F2] ring-opacity-20 shadow-md scale-[1.02]' : 'border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      item.importance === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                      item.importance === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {item.importance}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-colors ${selectedTopic === item.title ? 'text-[#1877F2]' : 'text-slate-300 group-hover:text-[#1877F2]'}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 leading-tight group-hover:text-[#1877F2] transition-colors">{item.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <Newspaper className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No recent news found. Try refreshing or use a custom topic.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 border-dashed group-within:border-[#1877F2] transition-colors">
              <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1 uppercase tracking-widest">
                <Search className="w-3 h-3" /> Manual override
              </p>
              <textarea 
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopic('');
                }}
                placeholder="Paste news content or link here..."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#1877F2] focus:border-transparent transition-all outline-none min-h-[120px] resize-none shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Center/Right Column: Generator & Preview */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-black/[0.02]">
            <div className="flex flex-col md:flex-row gap-8 items-stretch md:items-end">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tone Calibration</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['informative', 'enthusiastic', 'professional', 'minimalist'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          tone === t 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-500 text-xs">
                  {selectedTopic ? `Analyzing: "${selectedTopic}"` : customTopic ? 'Analyzing custom content...' : 'Select a topic to begin Architecting.'}
                </div>
              </div>
              
              <button
                disabled={(!selectedTopic && !customTopic) || generatingPost}
                onClick={handleGenerate}
                className="md:w-64 bg-[#1877F2] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#166fe5] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 group"
              >
                {generatingPost ? (
                  <RotateCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
                    Architect Post
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <AnimatePresence mode="wait">
            {post ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-serif italic text-lg text-slate-700 flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-[#1877F2]" /> Visual Mockup
                  </h3>
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-sm font-bold shadow-sm transition-all active:scale-95 ${
                      copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Content'}
                  </button>
                </div>

                {/* FB Mockup */}
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-w-[550px] mx-auto transition-all">
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                        <Facebook className="text-[#1877F2] w-7 h-7 mt-1 ml-0.5" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[14px] text-slate-900 border-b border-transparent hover:border-slate-400 cursor-pointer">AI Insights Central</span>
                        <div className="bg-[#1877F2] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          <Check className="text-white w-2.5 h-2.5" />
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-500 flex items-center gap-1 font-medium italic">
                        Just moments ago · <Search className="w-3 h-3" />
                      </p>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                      <MoreHorizontal className="text-slate-500 w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="px-4 pb-4">
                    <p className="text-[15px] leading-relaxed text-slate-800 font-sans tracking-tight whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {post.hashtags.map((tag, idx) => (
                        <span key={idx} className="text-[#1877F2] text-[14px] font-medium hover:underline cursor-pointer tracking-tight">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Image Placeholder */}
                  <div className="relative group aspect-square md:aspect-video bg-slate-50 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 via-white to-slate-200 border-t border-b border-slate-100">
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 max-w-sm transform hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-center gap-2 mb-3">
                         <Sparkles className="w-4 h-4 text-amber-400" />
                         <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Creative Director Suggestion</p>
                      </div>
                      <p className="text-sm italic text-slate-700 leading-relaxed font-serif">
                        "{post.suggestedImagePrompt}"
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 animate-bounce">
                      <div className="bg-white/80 p-2 rounded-full shadow-lg border border-white">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>

                  {/* FB Actions */}
                  <div className="px-4 py-2">
                     <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                       <div className="flex items-center gap-1.5">
                         <div className="flex -space-x-1.5">
                           <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center border-2 border-white">
                             <ThumbsUp className="text-white w-2.5 h-2.5" />
                           </div>
                           <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                             <Sparkles className="text-white w-2.5 h-2.5" />
                           </div>
                         </div>
                         <span className="text-[13px] text-slate-500 font-medium hover:underline cursor-pointer">You, Andrej Karpathy, and 1.2k others</span>
                       </div>
                       <div className="flex gap-3">
                        <span className="text-[13px] text-slate-500 hover:underline cursor-pointer">84 comments</span>
                        <span className="text-[13px] text-slate-500 hover:underline cursor-pointer">213 shares</span>
                       </div>
                     </div>
                     <div className="flex items-center justify-around py-1 gap-1">
                       <button className="flex-1 flex items-center justify-center gap-2 text-slate-600 font-bold text-sm py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                         <ThumbsUp className="w-5 h-5" /> Like
                       </button>
                       <button className="flex-1 flex items-center justify-center gap-2 text-slate-600 font-bold text-sm py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                         <MessageSquare className="w-5 h-5" /> Comment
                       </button>
                       <button className="flex-1 flex items-center justify-center gap-2 text-slate-600 font-bold text-sm py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                         <Send className="w-5 h-5 translate-x-0.5" /> Share
                       </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-brand-fb/10 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl rotate-3">
                    <Sparkles className="w-20 h-20 text-slate-100 rotate-12" />
                  </div>
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="font-serif italic text-2xl text-slate-800">Ready for Creation</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Select a breakthrough from the left or paste your own to generate your architectural social post.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1 space-y-5">
             <div className="flex items-center gap-2 opacity-50">
                <Share2 className="w-5 h-5" />
                <span className="font-serif italic font-bold">Architect V1.0</span>
             </div>
             <p className="text-xs text-slate-400 font-mono uppercase tracking-widest leading-loose">
               Constructing narratives for the post-AGI epoch.
             </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-800">Advanced Parameters</h4>
            <ul className="text-sm text-slate-500 space-y-3 font-medium">
              <li className="flex items-center gap-3 group cursor-pointer hover:text-[#1877F2] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" /> 
                Grounded Knowledge Search
              </li>
              <li className="flex items-center gap-3 group cursor-pointer hover:text-[#1877F2] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" /> 
                Semantic Content Synthesis
              </li>
              <li className="flex items-center gap-3 group cursor-pointer hover:text-[#1877F2] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" /> 
                Visual Prompting Engine
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="h-full bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                   <RotateCw className="text-white/20 w-8 h-8" />
                </div>
              </div>
              <div className="relative z-10 max-w-sm space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#1877F2] mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1877F2] animate-pulse" />
                    Intelligence Verified
                  </div>
                  <h4 className="text-2xl font-serif italic mb-3 leading-tight">Mastering the AI Narrative</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    By distilling complex research into social-first summaries, we bridge the gap between hard science and broad engagement.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center gap-8">
                   <div>
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Compute Mode</p>
                     <p className="text-sm font-mono text-[#1877F2]">GEMINI_3_FLASH</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Latency</p>
                     <p className="text-sm font-mono tracking-tighter">ULTRA_LOW</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              © 2026 AI Post Architect · Professional Grade Synthesis
            </p>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
