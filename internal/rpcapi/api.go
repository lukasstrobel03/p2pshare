package rpcapi

import (
	"encoding/json"

	"p2pshare/internal/dht"
	"p2pshare/internal/node"
)

const (
	MethodStatus        = "status"
	MethodPeers         = "peers"
	MethodListFiles     = "listFiles"
	MethodPublish       = "publish"
	MethodDownload      = "download"
	MethodBootstrap     = "bootstrap"
	MethodPublishAsync  = "publishAsync"
	MethodDownloadAsync = "downloadAsync"
	MethodJobStatus     = "jobStatus"
)

type RpcRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type RpcErrorCode int

type RpcError struct {
	Code    RpcErrorCode `json:"code"`
	Message string       `json:"message"`
}

type RpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RpcError       `json:"error,omitempty"`
}

type StatusResult struct {
	ID    dht.ID `json:"id"`
	Peers int    `json:"peers"`
}

type PeersResult []dht.Contact

type ListFilesResult []*ListFilesResultEntry

type ListFilesResultEntry struct {
	ID        dht.ID `json:"id"`
	Name      string `json:"name"`
	Size      int64  `json:"size"`
	ChunkSize int64  `json:"chunk_size"`
	Chunks    int    `json:"chunks"`
}

type PublishParams struct {
	Path string `json:"path"`
}

type PublishResult struct {
	ID       dht.ID         `json:"id"`
	Manifest *node.Manifest `json:"manifest"`
}

type DownloadParams struct {
	ID     dht.ID `json:"id"`
	OutDir string `json:"outdir"`
}

type DownloadResult struct {
	OK     bool   `json:"ok"`
	Output string `json:"output"`
}

type BootstrapParams []dht.Contact

type BootstrapResult struct {
	OK bool `json:"ok"`
}

type JobID string
type JobState string

const (
	JobRunning JobState = "running"
	JobDone    JobState = "done"
	JobError   JobState = "error"
)

type PublishAsyncResult struct {
	JobID JobID `json:"job_id"`
}

type DownloadAsyncResult struct {
	JobID JobID `json:"job_id"`
}

type JobStatusParams struct {
	JobID JobID `json:"job_id"`
}

type JobStatusResult struct {
	State  JobState `json:"state"`
	Done   int      `json:"done"`
	Total  int      `json:"total"`
	Result any      `json:"result,omitempty"`
	Error  string   `json:"error,omitempty"`
}
