import { useState } from 'react';
import { useChatsStore } from '../store/chats';
import { useProjectsStore } from '../store/projects';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistory({ isOpen, onClose }: ChatHistoryProps) {
  const { chats, selectChat } = useChatsStore();
  const { projects } = useProjectsStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = async (chat: any) => {
    await selectChat(chat);
    onClose();
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Unassigned';
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white">Your chat history</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your chats..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-slate-400 mb-3">
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''} with Claude
          </div>

          {filteredChats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                        {chat.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(chat.updated_at)}</span>
                        <span>•</span>
                        <span>{getProjectName(chat.project_id)}</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500 text-center">
          Press <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
