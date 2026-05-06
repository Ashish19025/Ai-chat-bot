"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-gray-950 flex flex-col">
      {/* Background glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-green-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-400/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-full mb-8 font-medium">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
          Powered by Local AI — Your Data, Your Privacy
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 max-w-4xl">
          Your Personal
          <span className="text-green-400"> AI Assistant</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Intelligent conversations with full history. Ask anything, get precise answers,
          and revisit every previous chat — all saved securely to your account.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(user ? "/chat" : "/signup")}
            className="bg-green-500 text-black font-bold px-8 py-4 rounded-xl hover:bg-green-400 transition-all text-base shadow-lg shadow-green-500/20"
          >
            {user ? "Open Chat →" : "Get Started Free →"}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="border border-gray-700 text-white font-medium px-8 py-4 rounded-xl hover:border-green-500 hover:text-green-400 transition-all text-base"
          >
            Sign In
          </button>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
          {[
            {
              icon: "🧠",
              title: "Smart Responses",
              desc: "Context-aware answers powered by a local language model running on your machine.",
            },
            {
              icon: "💾",
              title: "Chat History",
              desc: "Every conversation is saved. Browse, continue, or delete past sessions anytime.",
            },
            {
              icon: "🔐",
              title: "Secure & Private",
              desc: "JWT-based auth, password hashing, and a local AI model — your data never leaves.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/4 border border-white/8 rounded-2xl p-6 text-left hover:border-green-500/30 hover:bg-white/6 transition-all"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
