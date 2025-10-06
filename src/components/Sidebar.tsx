import { useEffect, useState, memo } from 'react';
import { useProjectsStore } from '../store/projects';
import { useChatsStore } from '../store/chats';
import ChatHistory from './ChatHistory';
import type { Chat } from '../lib/types';

const ChatItem = memo(({ chat, isActive, onSelect, onDelete }: {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}) => (
  <div className="relative group">
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-lg mb-1.5 text-sm transition-colors duration-150 cursor-pointer border ${
        isActive
          ? 'bg-blue-600/20 text-white border-blue-500/30'
          : 'text-slate-300 hover:bg-slate-700/40 hover:text-white border-transparent'
      }`}
    >
      <span className="flex items-center gap-2 pr-6">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="truncate">{chat.title}</span>
      </span>
    </button>
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await onDelete();
        } catch (err) {
          console.error('Delete failed:', err);
        }
      }}
      className="absolute right-2 top-2.5 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
      title="Delete chat"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
));

ChatItem.displayName = 'ChatItem';

export default function Sidebar() {
  const { projects, currentProject, loadProjects, selectProject, createProject, deleteProject } = useProjectsStore();
  const { chats, currentChat, loadChats, selectChat, createChat, deleteChat } = useChatsStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  useEffect(() => {
    loadProjects();
    loadChats();
  }, []);

  useEffect(() => {
    loadChats(currentProject?.id);
  }, [currentProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showChatHistory) {
        setShowChatHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChatHistory]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName);
    setNewProjectName('');
    setShowNewProject(false);
  };

  const handleNewChat = async () => {
    // If there's a current chat with messages, reload the chats list to reflect any title changes
    if (currentChat) {
      await loadChats(currentProject?.id);
    }

    // Create and select new chat
    const chat = await createChat(currentProject?.id);
    await selectChat(chat);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 flex flex-col h-full shrink-0 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Claude Lite
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI Chat Client</p>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-blue-900/30 transition-all duration-200 transform cursor-pointer"
        >
          <span className="flex items-center justify-start gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </span>
        </button>
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</h2>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-1.5 transition-all cursor-pointer"
              title="New Project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showNewProject && (
            <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                onBlur={() => !newProjectName && setShowNewProject(false)}
                placeholder="Project name"
                className="w-full px-3 py-2 bg-slate-800 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Unassigned (no project) */}
          <button
            onClick={() => selectProject(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-1.5 text-sm transition-colors duration-150 cursor-pointer border ${
              !currentProject
                ? 'bg-blue-600/20 text-white border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-700/40 hover:text-white border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Unassigned
            </span>
          </button>

          {/* Project List */}
          {projects.map((project) => (
            <div key={project.id} className="relative group">
              <button
                onClick={() => selectProject(project)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1.5 text-sm transition-colors duration-150 cursor-pointer border ${
                  currentProject?.id === project.id
                    ? 'bg-blue-600/20 text-white border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/40 hover:text-white border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate">{project.name}</span>
                </span>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await deleteProject(project.id);
                  } catch (err) {
                    console.error('Delete failed:', err);
                  }
                }}
                className="absolute right-2 top-2.5 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                title="Delete project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Chats List */}
        <div className="px-4 py-2 mt-4 border-t border-slate-700/50 pt-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowChatHistory(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Chats
              </h2>
            </button>
          </div>
          {chats.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">No chats yet</p>
          ) : (
            chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={currentChat?.id === chat.id}
                onSelect={() => selectChat(chat)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat History Modal */}
      <ChatHistory isOpen={showChatHistory} onClose={() => setShowChatHistory(false)} />
    </div>
  );
}
