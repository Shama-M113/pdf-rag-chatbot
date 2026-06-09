'use client'
import { useEffect, useRef } from 'react'
import { Bot, User, BookOpen } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center shrink-0">
        <Bot size={14} className="text-paper" />
      </div>
      <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function Message({ msg, index }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex items-end gap-2 animate-fade-up msg-${Math.min(index, 5)} ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-accent' : 'bg-ink'}`}>
        {isUser
          ? <User size={14} className="text-paper" />
          : <Bot size={14} className="text-paper" />
        }
      </div>

      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Bubble */}
        <div className={`
          px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-ink text-paper rounded-br-sm'
            : 'bg-surface border border-border text-ink rounded-bl-sm'
          }
        `}>
          {msg.content}
        </div>

        {/* Source pages badge */}
        {msg.sourcePages && msg.sourcePages.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <BookOpen size={11} />
            <span>Source: page{msg.sourcePages.length > 1 ? 's' : ''} {msg.sourcePages.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Bot size={24} className="text-muted" />
        </div>
        <div>
          <p className="font-semibold text-sm">No messages yet</p>
          <p className="text-xs text-muted mt-1">Upload a PDF above and start asking questions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
      {messages.map((msg, i) => (
        <Message key={i} msg={msg} index={i} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}