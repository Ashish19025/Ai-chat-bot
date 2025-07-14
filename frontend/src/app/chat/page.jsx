"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function ChatPage() {
  const { user, token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch chat history
    fetch("http://localhost:3001/api/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((history) => {
        const allMessages = history.flatMap((chat) => chat.messages);
        setMessages(allMessages.reverse());
      })
      .catch((err) => console.error("History error:", err));
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { role: "user", content: input };
  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  setLoading(true);

  try {
    console.log("🔵 Sending message:", userMsg.content);

    const res = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMsg.content }),
    });

    if (!res.ok) {
      const errorResponse = await res.json();
      console.error("🔴 API error response:", errorResponse);
      throw new Error(errorResponse.error || "Something went wrong");
    }

    const data = await res.json();
    console.log("🟢 Bot reply:", data);

    if (!data.reply) {
      throw new Error("No reply received from backend.");
    }

    const botMsg = { role: "assistant", content: data.reply };
    setMessages((prev) => [...prev, botMsg]);
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    alert("Chat failed: " + err.message);
  } finally {
    setLoading(false);
  }
};
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-500 text-black">
      {/* Header */}
      <div className=" shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-blue-600">🧠 AI Chatbot</h1>
        <div className="text-sm">
          {user?.email}{" "}
          <button
            onClick={logout}
            className="ml-4 text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 flex flex-col ">
     {messages.map((msg, i) => (
     <div
      key={i}
      className={`max-w-md p-2 rounded-lg ${
        msg.role === "user"
          ? "bg-blue-500 text-black self-end ml-auto"
          : "bg-gray-200 text-gray-800 self-start mr-auto shadow-md"
      }`}
    >
      {msg.content}
     </div>
     ))}
     <div ref={messagesEndRef} />
    </div>


      {/* Input */}
      <div className="bg-white p-4 flex items-center gap-2 border-t">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 border rounded p-2 resize-none h-12 text-amber-950"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
