import { useState, useRef, useEffect } from 'react';
import { useChatsStore } from '../store/chats';
import { useProjectsStore } from '../store/projects';

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4' },
  { id: 'claude-opus-4-1-20250805', name: 'Opus 4.1' },
  { id: 'claude-opus-4-20250514', name: 'Opus 4' },
];

interface PastedImage {
  id: string;
  dataUrl: string;
  file: File;
}

export default function MessageInput() {
  const [input, setInput] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const { currentChat, sendMessage, isSending } = useChatsStore();
  const { currentProject } = useProjectsStore();
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  useEffect(() => {
    if (currentChat && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentChat]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setPastedImages(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              dataUrl,
              file
            }]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (id: string) => {
    setPastedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pastedImages.length === 0) || !currentChat || isSending) return;

    const message = input.trim();
    const images = pastedImages.map(img => ({
      data: img.dataUrl.split(',')[1], // Remove data:image/xxx;base64, prefix
      media_type: img.file.type
    }));

    setInput('');
    setPastedImages([]);

    // Reset textarea height and blur
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.blur();
    }

    await sendMessage(message, currentProject?.id, selectedModel.id, images, extendedThinking);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        {/* Main Input Container */}
        <div className="relative shadow-lg bg-slate-950 rounded-2xl border border-slate-700/50 focus-within:border-blue-500/50 focus-within:shadow-blue-500/10 transition-all">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={currentChat ? 'Reply to Claude...' : 'Select or create a chat first...'}
            disabled={!currentChat || isSending}
            rows={1}
            className="w-full bg-transparent text-white px-4 pt-4 pb-2 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-500 overflow-hidden"
            style={{ minHeight: '56px', maxHeight: '200px' }}
          />

          {/* Image Previews */}
          {pastedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {pastedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.dataUrl}
                    alt="Pasted"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            {/* Left Side - Extended Thinking Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtendedThinking(!extendedThinking)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  extendedThinking
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'
                }`}
                title="Extended thinking"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {extendedThinking && (
                <span className="text-xs text-blue-400 font-medium">Extended thinking enabled</span>
              )}
            </div>

            {/* Right Side - Model Selector + Send Button */}
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>{selectedModel.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showModelSelector && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          selectedModel.id === model.id
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!currentChat || !input.trim() || isSending}
                className={`p-2 text-white rounded-lg transition-all ${
                  !currentChat || !input.trim() || isSending
                    ? 'bg-slate-800 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-900/30 cursor-pointer'
                }`}
                title="Send message"
              >
                {isSending ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
  );
}
