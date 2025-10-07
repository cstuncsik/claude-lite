import { useEffect, useRef } from 'react';
import { useChatsStore } from '../store/chats';
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';
import MessageInput from './MessageInput';
import 'highlight.js/styles/github-dark.css';

export default function ChatView() {
  const { currentChat, messages, streamingContent, isThinking, isSending } = useChatsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    // Highlight code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [messages, streamingContent]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-3">
            Welcome to Claude Lite
          </h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Start a conversation by creating a new chat or selecting an existing one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid grid-rows-[1fr_auto] min-h-full overflow-y-auto">
      {/* Messages Container */}
      <div className="px-6 pt-6 pb-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`rounded-2xl px-5 py-3 w-full ${
                  message.role === 'user'
                    ? 'bg-blue-600/35 text-white border border-blue-400/80'
                    : 'bg-slate-800/80 backdrop-blur text-slate-100 border border-slate-700/50 shadow-lg'
                }`}
              >
                {message.role === 'user' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-500/30">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">You</span>
                    {message.model && (
                      <span className="text-xs text-blue-400/60 ml-auto font-mono">
                        {message.model.replace('claude-', '').replace('-20250929', '').replace('-20250514', '').replace('-20250805', '')}
                      </span>
                    )}
                    {(message.extended_thinking === true || message.extended_thinking === 1) && (
                      <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Extended thinking
                      </span>
                    )}
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Claude</span>
                  </div>
                )}

                {/* Display images if present */}
                {message.images && (() => {
                  try {
                    const images = typeof message.images === 'string'
                      ? JSON.parse(message.images)
                      : message.images;
                    if (Array.isArray(images) && images.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {images.map((image: any, idx: number) => (
                            <img
                              key={idx}
                              src={`data:${image.media_type};base64,${image.data}`}
                              alt="Attached"
                              className="max-w-xs max-h-64 object-contain rounded-lg border border-slate-600"
                            />
                          ))}
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error('Failed to parse images:', e);
                  }
                  return null;
                })()}

                {/* Display documents if present */}
                {message.documents && (() => {
                  try {
                    const documents = typeof message.documents === 'string'
                      ? JSON.parse(message.documents)
                      : message.documents;
                    if (Array.isArray(documents) && documents.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {documents.map((doc: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-600"
                            >
                              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-slate-300">{doc.name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error('Failed to parse documents:', e);
                  }
                  return null;
                })()}
                <div className={`prose prose-invert max-w-none ${message.role === 'user' ? 'prose-p:text-white prose-headings:text-white prose-strong:text-white' : ''}`}>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        return inline ? (
                          <code className="bg-slate-900/80 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-slate-900/90 rounded-xl p-4 overflow-x-auto border border-slate-700/50 my-4">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-4 last:mb-0 leading-7 text-[15px]">{children}</p>;
                      },
                      h1({ children }) {
                        return <h1 className="text-xl font-bold mb-3 mt-6">{children}</h1>;
                      },
                      h2({ children }) {
                        return <h2 className="text-lg font-bold mb-3 mt-5">{children}</h2>;
                      },
                      h3({ children }) {
                        return <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>;
                      },
                      ul({ children }) {
                        return <ul className="space-y-2 my-4 ml-4">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="space-y-2 my-4 ml-4">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-7">{children}</li>;
                      },
                      strong({ children }) {
                        return <strong className="font-semibold text-white">{children}</strong>;
                      },
                      blockquote({ children }) {
                        return <blockquote className="border-l-4 border-violet-500 pl-4 italic my-4 text-slate-300">{children}</blockquote>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message or waiting for response */}
          {(isSending || streamingContent) && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-full rounded-2xl px-5 py-3 bg-slate-800/80 backdrop-blur text-slate-100 border border-slate-700/50 shadow-lg">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                  <svg className="w-5 h-5 text-violet-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Claude</span>
                  <span className="text-xs text-slate-500">{isThinking ? 'thinking...' : 'typing...'}</span>
                </div>
                {streamingContent ? (
                  <>
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p({ children }) {
                            return <p className="mb-4 last:mb-0 leading-7 text-[15px]">{children}</p>;
                          },
                          h1({ children }) {
                            return <h1 className="text-xl font-bold mb-3 mt-6">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-lg font-bold mb-3 mt-5">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>;
                          },
                          ul({ children }) {
                            return <ul className="space-y-2 my-4 ml-4">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="space-y-2 my-4 ml-4">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="leading-7">{children}</li>;
                          },
                          strong({ children }) {
                            return <strong className="font-semibold text-white">{children}</strong>;
                          },
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-1 rounded-sm" />
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="bg-linear-to-b from-slate-950 to-slate-900 px-6 py-4 sticky bottom-0">
        <MessageInput />
      </div>
    </div>
  );
}
