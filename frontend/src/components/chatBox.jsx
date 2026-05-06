import MessageBubble from "./MessageBubble";

export default function ChatBox({ messages = [], loading = false }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-6 overflow-y-auto">
      {messages.map((msg, i) => (
        <MessageBubble key={`${msg.role}-${i}`} role={msg.role} content={msg.content} />
      ))}
      {loading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-700 text-white flex-shrink-0">
            🤖
          </div>
          <div className="bg-gray-800 border border-gray-700/60 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-green-400 rounded-full typing-dot inline-block"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
