'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export default function UploadZone({ onUploaded }) {
  const [state, setState] = useState('idle') // idle | dragging | uploading | done | error
  const [fileName, setFileName] = useState('')
  const [chunks, setChunks] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      setState('error')
      return
    }

    setState('uploading')
    setFileName(file.name)
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setChunks(data.chunks_indexed)
      setState('done')
      onUploaded(file.name)
    } catch (e) {
      setError(e.message || 'Upload failed. Is the FastAPI server running?')
      setState('error')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setState('idle')
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="w-full">
      {state === 'done' ? (
        <div className="flex items-center gap-3 bg-ink text-paper rounded-2xl px-5 py-4 animate-fade-up">
          <CheckCircle size={20} className="text-accent shrink-0" />
          <div>
            <p className="font-medium text-sm">{fileName}</p>
            <p className="text-xs text-muted mt-0.5">{chunks} chunks indexed — ready to answer questions</p>
          </div>
          <button
            onClick={() => { setState('idle'); setFileName(''); onUploaded(null) }}
            className="ml-auto text-xs text-muted hover:text-paper transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setState('dragging') }}
          onDragLeave={() => setState('idle')}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
            ${state === 'dragging' ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border hover:border-accent/50 hover:bg-surface/50'}
            ${state === 'error' ? 'border-red-400 bg-red-50' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {state === 'uploading' ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-accent animate-spin" />
              <div>
                <p className="font-medium text-sm">Indexing {fileName}</p>
                <p className="text-xs text-muted mt-1">Chunking → Embedding → Storing in FAISS...</p>
              </div>
            </div>
          ) : state === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle size={28} className="text-red-500" />
              <div>
                <p className="font-medium text-sm text-red-600">{error}</p>
                <p className="text-xs text-muted mt-1">Click to try again</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${state === 'dragging' ? 'bg-accent text-paper' : 'bg-surface text-muted'}`}>
                {state === 'dragging' ? <FileText size={22} /> : <Upload size={22} />}
              </div>
              <div>
                <p className="font-semibold text-sm">Drop your PDF here</p>
                <p className="text-xs text-muted mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
