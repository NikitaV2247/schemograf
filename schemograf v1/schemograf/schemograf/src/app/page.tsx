'use client'

import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/diagram/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-700" />
        <p className="text-[13px] font-medium text-slate-500">Загрузка редактора схем…</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return <Editor />
}
