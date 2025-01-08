import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "../context/RoomContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { LoaderProvider } from '../context/loadingContext'; // Import the LoaderContext
import { LoaderContextConsumer } from '../components/loaderContextConsumer';

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 transition-colors`}
      >
        <ErrorBoundary>
          <LoaderProvider>
            <ThemeProvider>
              <RoomProvider>
                <LoaderContextConsumer />
                {children}
              </RoomProvider>
            </ThemeProvider>
          </LoaderProvider>
        </ErrorBoundary>
      </body>
    </html >
  );
}