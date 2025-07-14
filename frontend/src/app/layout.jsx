import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata = {
  title: "SaaS Chatbot",
  description: "LLM chat with auth",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
