import type { BootstrapResult, DownloadResult, FileInfo, NetworkStatus, Peer, PublishResult, Transfer } from './types'

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

const mockStatus: NetworkStatus = {
  id: '06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393',
  peers: 3,
}

const mockPeers: Peer[] = [
  { id: '06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393', addr: '1.1.1.1:2222' },
  { id: 'd397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d', addr: '2.2.2.2:3333' },
  { id: 'c2c3b8feacb50670550e1ef18d96b266b656ed11149df3cf514b9aa6e37f1105', addr: '3.3.3.3:4444' },
]

async function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

async function mockError(message: string, ms = 400): Promise<never> {
  await mockDelay(null, ms)
  throw new Error(message)
}

function mockPublish(path: string): Promise<PublishResult> {
  const name = path.split(/[\\/]/).pop() || path
  const size = 50_000 + Math.floor(Math.random() * 4_950_000)
  const chunk_size = 262144
  const chunkCount = Math.ceil(size / chunk_size)
  const chunks = Array.from({ length: chunkCount }, () => crypto.randomUUID().replace(/-/g, ''))
  const id = crypto.randomUUID().replace(/-/g, '')

  mockFiles.push({ id, name, size, chunk_size, chunks: chunkCount })

  return mockDelay({ id, manifest: { name, size, chunk_size, chunks } }, 800)
}

function mockDownload(id: string, outdir: string): Promise<DownloadResult> {
  const file = mockFiles.find(f => f.id === id)
  if (!file) return mockError('Keine Peers gefunden', 800)
  return mockDelay({ ok: true, output: `${outdir}/${file.name}` }, 800)
}

function mockBootstrap(peer: Peer): Promise<BootstrapResult> {
  if (!mockPeers.some(p => p.id === peer.id)) {
    mockPeers.push(peer)
    mockStatus.peers = mockPeers.length
  }
  return mockDelay({ ok: true }, 800)
}

export const rpc = {
  listFiles: (): Promise<FileInfo[]> =>
    USE_MOCK ? mockDelay(mockFiles) : rpcCall<FileInfo[]>('listFiles'),
  listTransfers: (): Promise<Transfer[]> =>
    USE_MOCK ? mockDelay(mockTransfers) : rpcCall<Transfer[]>('listTransfers'),
  status: (): Promise<NetworkStatus> =>
    USE_MOCK ? mockDelay(mockStatus) : rpcCall<NetworkStatus>('status'),
  peers: (): Promise<Peer[]> =>
    USE_MOCK ? mockDelay(mockPeers) : rpcCall<Peer[]>('peers'),
  publish: (path: string): Promise<PublishResult> =>
    USE_MOCK ? mockPublish(path) : rpcCall<PublishResult>('publish', { path }),
  download: (id: string, outdir: string): Promise<DownloadResult> =>
    USE_MOCK ? mockDownload(id, outdir) : rpcCall<DownloadResult>('download', { id, outdir }),
  bootstrap: (peer: Peer): Promise<BootstrapResult> =>
    USE_MOCK ? mockBootstrap(peer) : rpcCall<BootstrapResult>('bootstrap', [peer]),
}