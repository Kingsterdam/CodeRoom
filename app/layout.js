import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "../context/RoomContext";
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
        <RoomProvider>{children}</RoomProvider>
      </body>
    </html>
  );
}
