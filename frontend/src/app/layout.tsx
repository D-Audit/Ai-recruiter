import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400","500","600","700","800","800"],
  variable: "--font-body",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Umurava AI",
  description: "AI-powered talent screening platform. Screen hundreds of candidates in seconds with Gemini AI.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${sora.variable}`}>
      <head>
        <meta name="theme-color" content="#06101f" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* ── Theme init (runs before paint to avoid flash) ── */}
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

        {/*
          ── Google Identity Services script — loaded here in layout so it is
             ready the moment the login/register page renders.
             Without this, the button has to wait for the script to download
             (~150 KB) every time the user lands on /login or /register.
             Loading it here means it downloads once in the background while
             the user is still looking at any other page.
        ──────────────────────────────────────────────────────────────────── */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          id="google-gsi-script"
          src="https://accounts.google.com/gsi/client"
          async
          defer
        />
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