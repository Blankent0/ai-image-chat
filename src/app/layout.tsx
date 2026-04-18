import type { Metadata } from "next";
import { Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const notoSerif = Noto_Serif_SC({
    subsets: ["latin"],
    weight: ["400", "600", "700"],
    variable: "--font-serif",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Atelier · 3D 风格化工作台",
    description: "为室内设计师打造的 AI 风格化工具",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN" className={`${inter.variable} ${notoSerif.variable}`}>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
