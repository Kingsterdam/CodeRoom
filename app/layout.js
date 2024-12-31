import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "../context/RoomContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CodeRoom",
  description: "Backend By Amit Mishra",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider>
            <RoomProvider>
              {children}
            </RoomProvider>
          </ThemeProvider>
        </ErrorBoundary>


      </body>
    </html>
  );
}
