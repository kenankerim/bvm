import { MessageSquare, Phone, Send, X } from 'lucide-react';

/* ============ MESSAGES TAB ============ */

export function MessagesTab({
  conversations, selectedChat, setSelectedChat, chatInput, setChatInput, handleSendMessage,
  chatMessages,
}: {
  conversations: { id: number; name: string; lastMsg: string; time: string; unread: number }[];
  selectedChat: number | null;
  setSelectedChat: (id: number | null) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendMessage: () => void;
  chatMessages: { id: string; from: string; text: string; time: string }[];
}) {
  const activeConv = conversations.find((c) => c.id === selectedChat);

  if (selectedChat !== null && activeConv) {
    return (
      <div className="flex flex-col pt-2 animate-fade-in-up" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
          <button onClick={() => setSelectedChat(null)} className="p-1.5 rounded-full bg-slate-900/85 border border-white/10 backdrop-blur-xl text-slate-200 hover:text-white hover:bg-white/20 transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300">
            {activeConv.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{activeConv.name}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktiv
            </p>
          </div>
          <button className="p-2 rounded-full bg-slate-900/85 border border-white/10 backdrop-blur-xl text-cyan-400 hover:bg-cyan-500/15 transition-all">
            <Phone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-20 pt-3">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs text-slate-400">Hələ mesaj yoxdur. İlk mesajı göndərin!</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.from === 'me'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-slate-900/85 border border-white/10 backdrop-blur-xl text-slate-200 rounded-bl-md'
                }`}>
                  {msg.text}
                  <span className="block text-[9px] text-slate-400 mt-1 text-right">{msg.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-16 left-0 right-0 px-3 z-30">
          <div className="max-w-md mx-auto flex items-center space-x-2 bg-slate-900/85 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-lg shadow-black/10">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return;
                handleSendMessage();
              }}
              placeholder="Mesaj yazın..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center space-x-2 pb-2">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold tracking-tight">Mesajlar</h2>
      </div>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => setSelectedChat(conv.id)}
          className="w-full flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-xl hover:bg-white/[0.15] hover:border-cyan-400/25 transition-all text-left active:scale-[0.98] shadow-lg shadow-black/5"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold border border-white/20">
              {conv.name.slice(0, 2).toUpperCase()}
            </div>
            {conv.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#1C2541]">
                {conv.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white truncate">{conv.name}</p>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{conv.time}</span>
            </div>
            <p className={`text-xs truncate ${conv.unread > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
              {conv.lastMsg}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
