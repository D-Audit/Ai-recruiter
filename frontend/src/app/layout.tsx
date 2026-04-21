import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400","500","600","700","800","900"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Umurava AI ",
  description: "AI-powered talent screening platform. Screen hundreds of candidates in seconds with Gemini AI.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="theme-color" content="#06101f" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark') { document.documentElement.classList.add('dark'); }
              else if (t === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) { document.documentElement.classList.add('dark'); }
              } else { document.documentElement.classList.remove('dark'); }
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-body, 'Inter', system-ui)",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: "500",
                letterSpacing: "-0.1px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}