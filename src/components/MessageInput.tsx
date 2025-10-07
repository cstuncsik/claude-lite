import { useState, useRef, useEffect } from 'react';
import { useChatsStore } from '../store/chats';
import { useProjectsStore } from '../store/projects';

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4' },
  { id: 'claude-opus-4-1-20250805', name: 'Opus 4.1' },
  { id: 'claude-opus-4-20250514', name: 'Opus 4' },
];

interface AttachedFile {
  id: string;
  dataUrl: string;
  file: File;
  type: 'image' | 'document' | 'text';
  textContent?: string;
}

export default function MessageInput() {
  const [input, setInput] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const { currentChat, sendMessage, isSending } = useChatsStore();
  const { currentProject } = useProjectsStore();
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isImageFile = (file: File) => file.type.startsWith('image/');
  const isDocumentFile = (file: File) => {
    // API only supports PDF for document type
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };
  const isTextFile = (file: File) => {
    const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'text/html', 'application/json'];
    const textExtensions = ['.txt', '.md', '.csv', '.html', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.py', '.java', '.c', '.cpp', '.rs', '.go'];
    return textTypes.includes(file.type) || textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          addFile(file);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => addFile(file));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFile = (file: File) => {
    // Check if image
    if (isImageFile(file)) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          dataUrl,
          file,
          type: 'image'
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Check if document (PDF only)
    else if (isDocumentFile(file)) {
      if (file.size > 32 * 1024 * 1024) {
        alert('PDF must be under 32MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          dataUrl,
          file,
          type: 'document'
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Check if text file
    else if (isTextFile(file)) {
      if (file.size > 1 * 1024 * 1024) {
        alert('Text file must be under 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        // Create a data URL for preview (not sent to API)
        const blob = new Blob([textContent], { type: 'text/plain' });
        const dataUrl = URL.createObjectURL(blob);
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          dataUrl,
          file,
          type: 'text',
          textContent
        }]);
      };
      reader.readAsText(file);
    } else {
      alert('Unsupported file type. Supported: Images (JPEG, PNG, GIF, WebP), PDF documents, and text files (TXT, MD, CSV, HTML, JSON, code files)');
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || !currentChat || isSending) return;

    let messageContent = input.trim();

    // Add text file contents to message
    const textFiles = attachedFiles.filter(f => f.type === 'text');
    if (textFiles.length > 0) {
      const textFilesContent = textFiles
        .map(f => `\n\n---\nFile: ${f.file.name}\n\`\`\`\n${f.textContent}\n\`\`\``)
        .join('\n');
      messageContent = messageContent + textFilesContent;
    }

    const images = attachedFiles
      .filter(f => f.type === 'image')
      .map(f => ({
        data: f.dataUrl.split(',')[1],
        media_type: f.file.type
      }));

    const documents = attachedFiles
      .filter(f => f.type === 'document')
      .map(f => ({
        data: f.dataUrl.split(',')[1],
        media_type: f.file.type,
        name: f.file.name
      }));

    setInput('');
    setAttachedFiles([]);

    // Reset textarea height and blur
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.blur();
    }

    await sendMessage(messageContent, currentProject?.id, selectedModel.id, images, extendedThinking, documents);
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

          {/* File Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  {file.type === 'image' ? (
                    <img
                      src={file.dataUrl}
                      alt="Attached"
                      className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                    />
                  ) : file.type === 'text' ? (
                    <div className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border border-green-600/50 bg-green-900/20 p-2">
                      <svg className="w-8 h-8 text-green-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-green-400 text-center truncate w-full">
                        {file.file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 p-2">
                      <svg className="w-8 h-8 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-slate-400 text-center truncate w-full">
                        {file.file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
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
            {/* Left Side - Attach File + Extended Thinking Toggle */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.md,.csv,.html,.json,.js,.ts,.tsx,.jsx,.css,.py,.java,.c,.cpp,.rs,.go"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!currentChat || isSending}
                className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
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
