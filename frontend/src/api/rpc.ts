import type { FileInfo, Transfer } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

async function rpcCall<T>(method: string, params?: unknown): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(`[${json.error.code}] ${json.error.message}`)
  return json.result as T
}

const mockFiles: FileInfo[] = [
  { id: '06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393', name: 'urlaubsfoto.jpg', size: 3846213, chunk_size: 262144, chunks: 15 },
  { id: 'd397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d', name: 'vorlesung.pdf', size: 348740, chunk_size: 262144, chunks: 2 },
]

const mockTransfers: Transfer[] = [
  { id: '1', name: 'projekt_dokumentation.pdf', direction: 'download', progress: 72, status: 'active', speed: '860 KB/s', eta: 'noch 40 Sek.', peers: 4 },
  { id: '2', name: 'urlaubsvideo.mp4', direction: 'upload', progress: 38, status: 'active', speed: '410 KB/s', eta: 'noch 3 Min.', peers: 2 },
  { id: '3', name: 'musik_album.zip', direction: 'download', progress: 15, status: 'stopped', peers: 0, errorMessage: 'Keine Peers gefunden' },
]

async function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

export const rpc = {
  listFiles: (): Promise<FileInfo[]> =>
    USE_MOCK ? mockDelay(mockFiles) : rpcCall<FileInfo[]>('listFiles'),
  listTransfers: (): Promise<Transfer[]> =>
    USE_MOCK ? mockDelay(mockTransfers) : rpcCall<Transfer[]>('listTransfers'),
}