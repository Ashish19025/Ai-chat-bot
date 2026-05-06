import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "SaaS AI Chatbot",
  description: "AI powered chatbot with full conversation history",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
