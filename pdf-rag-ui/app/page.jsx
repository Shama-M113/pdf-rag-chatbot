'use client'
import { useState } from 'react'
import { Send, Zap } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import ChatWindow from '../components/ChatWindow'

const EXAMPLE_QUESTIONS = [
  'What is the main topic of this document?',
  'Summarize the key points',
  'What conclusions does it draw?',
]

export default function Home() {
  const [pdfName, setPdfName] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function sendMessage(question) {
    const q = question || input.trim()
    if (!q || !pdfName || isLoading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sourcePages: data.source_pages || [],
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message}`,
        sourcePages: [],
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="grain min-h-screen flex flex-col items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 2rem)', maxHeight: '860px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none">DocMind</h1>
              <p className="text-xs text-muted mt-0.5">RAG-powered PDF Q&amp;A</p>
            </div>
          </div>
          {pdfName && (
            <div className="text-xs text-muted bg-surface border border-border px-3 py-1.5 rounded-full truncate max-w-[200px]">
              {pdfName}
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="flex-1 bg-paper border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">

          {/* Upload zone */}
          <div className="p-4 border-b border-border">
            <UploadZone onUploaded={setPdfName} />
          </div>

          {/* Chat */}
          <ChatWindow messages={messages} isLoading={isLoading} />

          {/* Example questions — show only when PDF loaded and no messages yet */}
          {pdfName && messages.length === 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-surface border border-border text-ink rounded-full px-3 py-1.5 hover:border-accent/50 hover:bg-accent/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="p-4 border-t border-border">
            <div className={`flex items-end gap-2 bg-surface border rounded-2xl px-4 py-3 transition-all ${pdfName ? 'border-border focus-within:border-accent/60' : 'opacity-50 border-border'}`}>
              <textarea
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={!pdfName || isLoading}
                placeholder={pdfName ? 'Ask anything about your PDF...' : 'Upload a PDF to start chatting'}
                className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed text-ink placeholder:text-muted font-sans"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || !pdfName || isLoading}
                className="w-8 h-8 rounded-xl bg-ink text-paper flex items-center justify-center shrink-0 hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-center text-xs text-muted mt-2">
              Powered by LangChain · FAISS · Hugging Face · FastAPI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
