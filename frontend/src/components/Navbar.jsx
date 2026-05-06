import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-10 p-6 flex justify-between items-center backdrop-blur-md  bg-green-500/10">
      <h1 className="text-2xl font-bold text-shadow-black">SaaS Ai</h1>
      <div className="space-x-6">
        <Link href="/" className="hover:text-green-400 font-bold">Home</Link>
        <Link href="/" className="hover:text-green-400 font-bold">Services</Link>
        <Link href="/" className="hover:text-green-400 font-bold">About</Link>
        <Link href="/login" className="border px-4 py-2 rounded-2xl hover:bg-green-600 hover:text-black transition font-bold">Login</Link>
        <Link href="/signup" className="border px-4 py-2 rounded-2xl hover:bg-green-600 hover:text-black transition font-bold">Sign In</Link>
      </div>
    </nav>
  );
}
