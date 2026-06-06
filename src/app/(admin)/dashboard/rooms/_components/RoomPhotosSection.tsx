'use client'

import { useRef, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import {
  uploadRoomImagesAction,
  deleteImageAction,
  setCoverImageAction,
} from '../actions'
import { INPUT, BTN_PRIMARY, ErrorMessage } from './form-helpers'
import type { ImageRow, PendingFile } from './types'

type Props = {
  roomId: string
  initialImages: ImageRow[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RoomPhotosSection({ roomId, initialImages }: Props) {
  const [images, setImages] = useState<ImageRow[]>(initialImages)
  const [pending, setPending] = useState<PendingFile[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const [isUploading, startUpload] = useTransition()
  const [isCovering, startCover] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1

    setPending((prev) => {
      const newPending: PendingFile[] = files.map((file, idx) => ({
        localId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        sortOrder: maxOrder + 1 + prev.length + idx,
      }))
      return [...prev, ...newPending]
    })

    if (fileRef.current) fileRef.current.value = ''
  }

  function handleRemovePending(localId: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.localId === localId)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.localId !== localId)
    })
    setItemErrors((prev) => {
      const next = { ...prev }
      delete next[localId]
      return next
    })
  }

  function updatePendingAlt(localId: string, altText: string) {
    setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, altText } : p)))
  }

  function updatePendingOrder(localId: string, sortOrder: number) {
    setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, sortOrder } : p)))
  }

  function handleUpload() {
    if (pending.length === 0) return
    setGlobalError(null)
    setItemErrors({})

    const snapshot = [...pending]

    startUpload(async () => {
      const fd = new FormData()
      fd.append('room_id', roomId)
      snapshot.forEach((item, i) => {
        fd.append('files', item.file)
        fd.append(`alt_${i}`, item.altText)
        fd.append(`sort_order_${i}`, String(item.sortOrder))
      })

      const result = await uploadRoomImagesAction(fd)

      if (!result || 'error' in result) {
        setGlobalError(result ? result.error : 'Erro inesperado. Tente novamente.')
        return
      }

      const errors: Record<string, string> = {}
      const successfulImages: ImageRow[] = []
      const failedLocalIds = new Set<string>()

      for (const r of result.results) {
        if (r.success) {
          successfulImages.push(r.image)
        } else {
          const localId = snapshot[r.index]?.localId
          if (localId) {
            errors[localId] = r.error
            failedLocalIds.add(localId)
          }
        }
      }

      if (successfulImages.length > 0) {
        setImages((prev) => [...prev, ...successfulImages])
      }

      snapshot
        .filter((p) => !failedLocalIds.has(p.localId))
        .forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPending((prev) => prev.filter((p) => failedLocalIds.has(p.localId)))

      if (Object.keys(errors).length > 0) {
        setItemErrors(errors)
      }
    })
  }

  function handleSetCover(img: ImageRow) {
    startCover(async () => {
      await setCoverImageAction(img.id, roomId)
      setImages((prev) => prev.map((i) => ({ ...i, is_cover: i.id === img.id })))
    })
  }

  function handleDelete(img: ImageRow) {
    startDelete(async () => {
      await deleteImageAction(img.id, img.storage_path)
      setImages((prev) => prev.filter((i) => i.id !== img.id))
    })
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-4">
      {/* Existing uploaded photos */}
      {sorted.length === 0 && pending.length === 0 ? (
        <p className="text-[13px] text-ocean-400 text-center py-4 bg-ocean-50/50 rounded-xl">
          Nenhuma foto ainda.
        </p>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-3 p-2.5 border border-ocean-100 rounded-xl"
            >
              <Thumbnail url={img.url} alt={img.alt_text} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-ocean-800 font-medium truncate">
                  {img.alt_text || <span className="italic text-ocean-300">sem texto alt</span>}
                </p>
                <p className="text-[10px] text-ocean-300 truncate">{img.url}</p>
              </div>
              {img.is_cover && (
                <span className="text-[9px] font-bold text-white bg-ocean-600 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                  Capa
                </span>
              )}
              <div className="flex items-center gap-2.5 shrink-0">
                {!img.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img)}
                    disabled={isCovering}
                    className="text-[11px] text-ocean-400 hover:text-ocean-700 font-medium transition-colors disabled:opacity-50"
                  >
                    Definir capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  disabled={isDeleting}
                  className="text-[11px] text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Pending files preview + upload */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-ocean-600 uppercase tracking-[0.08em]">
            {pending.length} foto{pending.length > 1 ? 's' : ''} para enviar
          </p>
          {pending.map((item) => (
            <div key={item.localId} className="border border-ocean-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-2.5">
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-ocean-50 border border-ocean-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-ocean-800 font-medium truncate">{item.file.name}</p>
                  <p className="text-[10px] text-ocean-400">{formatSize(item.file.size)}</p>
                </div>
                <input
                  value={item.altText}
                  onChange={(e) => updatePendingAlt(item.localId, e.target.value)}
                  className={cn(INPUT, 'w-28 text-[12px] py-1.5')}
                  placeholder="Texto alt"
                  disabled={isUploading}
                />
                <input
                  type="number"
                  min={0}
                  value={item.sortOrder}
                  onChange={(e) => updatePendingOrder(item.localId, Number(e.target.value))}
                  className={cn(INPUT, 'w-14 text-[12px] py-1.5')}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePending(item.localId)}
                  disabled={isUploading}
                  className="text-ocean-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 text-[13px] font-bold px-1"
                  aria-label="Remover da lista"
                >
                  ✕
                </button>
              </div>
              {itemErrors[item.localId] && (
                <p className="text-[11px] text-red-600 bg-red-50 px-3 py-1.5 border-t border-red-100">
                  {itemErrors[item.localId]}
                </p>
              )}
            </div>
          ))}

          {globalError && <ErrorMessage message={globalError} />}

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className={cn(BTN_PRIMARY, 'w-full')}
          >
            {isUploading
              ? 'Enviando fotos…'
              : `Enviar ${pending.length} foto${pending.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* File picker */}
      <div className="pt-2 border-t border-ocean-100 space-y-2">
        <p className="text-[11px] font-bold text-ocean-800 uppercase tracking-[0.08em]">
          Adicionar fotos
        </p>
        <label
          className={cn(
            'flex items-center justify-center cursor-pointer group',
            isUploading && 'pointer-events-none opacity-40',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="sr-only"
            disabled={isUploading}
          />
          <span className="flex-1 text-center text-[13px] font-semibold py-2.5 px-4 rounded-xl border-2 border-dashed border-ocean-200 text-ocean-500 transition-colors group-hover:border-ocean-400 group-hover:text-ocean-700">
            Selecionar fotos
          </span>
        </label>
        <p className="text-[11px] text-ocean-400 text-center">
          Você pode selecionar várias fotos de uma vez. JPG, PNG ou WebP, máx. 5 MB por foto.
        </p>
      </div>
    </div>
  )
}

function Thumbnail({ url, alt }: { url: string; alt: string | null }) {
  return (
    <div className="w-14 h-10 rounded-lg overflow-hidden bg-ocean-50 border border-ocean-100 shrink-0 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt ?? ''}
        className="w-full h-full object-cover"
        onError={(e) => {
          const el = e.currentTarget
          el.style.display = 'none'
          if (el.parentElement) {
            el.parentElement.innerHTML =
              '<span style="font-size:8px;color:#94a3b8;text-align:center;padding:4px">sem<br>preview</span>'
          }
        }}
      />
    </div>
  )
}
