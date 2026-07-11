export interface FileInfo {
    id: string
    name: string
    size: number
    chunk_size: number
    chunks: number
  }
  export interface Transfer {
    id: string
    name: string
    direction: 'download' | 'upload'
    progress: number // 0-100
    status: 'active' | 'stopped' | 'completed'
    speed?: string        // z.B. "860 KB/s"
    eta?: string           // z.B. "noch 40 Sek."
    peers: number
    errorMessage?: string  // z.B. "Keine Peers gefunden"
  }
  export interface Peer {
    id: string
    addr: string
  }
  export interface NetworkStatus {
    id: string
    peers: number
  }
  export interface Manifest {
    name: string
    size: number
    chunk_size: number
    chunks: string[]
  }
  export interface PublishResult {
    id: string
    manifest: Manifest
  }
  export interface DownloadResult {
    ok: boolean
    output: string
  }
  export interface BootstrapResult {
    ok: boolean
  }