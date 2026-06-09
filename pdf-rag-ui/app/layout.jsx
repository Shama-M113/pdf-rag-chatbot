import { Sora, JetBrains_Mono } from 'next/font/google'
import '../globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
})

export const metadata = {
  title: 'DocMind — PDF Q&A',
  description: 'Ask questions about any PDF using RAG + LLMs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${jetbrains.variable} font-sans bg-paper text-ink`}>
        {children}
      </body>
    </html>
  )
}
