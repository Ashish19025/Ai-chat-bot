"use client";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover"
      >
        <source src="/ai.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-green-400 drop-shadow-lg">
          Introducing 
             the
          Future of AI
        </h1>
        <p className="text-gray-300 max-w-xl mt-4 text-lg">
          SaaS Application High Performance AI
        </p>
        <div className="mt-6 space-x-4">
          <button className="bg-green-500 text-black px-6 py-3 rounded hover:bg-green-600 font-bold shadow-lg" 
           onClick={() => window.location.href = "/login"}>
            Try it 
          </button>
          <button className="border border-gray-300 text-white px-6 py-3 rounded hover:bg-white hover:text-black transition">
            More Details
          </button>
        </div>
      </div>
      <div className="">
        <h1 className="bg-white">hello</h1>
      </div>
    </section>
  );
}
