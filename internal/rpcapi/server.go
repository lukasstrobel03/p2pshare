package rpcapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"path/filepath"
	"sync"

	"p2pshare/internal/node"
)

// Server exposes JSON-RPC 2.0 over HTTP for standalone GUI invocation.
type Server struct {
	node *node.Node
	jobs *jobStore
}

type jobEntry struct {
	mu     sync.Mutex
	state  JobState
	done   int
	total  int
	result any
	errMsg string
}

func (e *jobEntry) progress(done, total int) {
	e.mu.Lock()
	e.done, e.total = done, total
	e.mu.Unlock()
}

func (e *jobEntry) finish(result any, err error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if err != nil {
		e.state = JobError
		e.errMsg = err.Error()
		return
	}
	e.state = JobDone
	e.result = result
}

func (e *jobEntry) snapshot() *JobStatusResult {
	e.mu.Lock()
	defer e.mu.Unlock()
	return &JobStatusResult{State: e.state, Done: e.done, Total: e.total, Result: e.result, Error: e.errMsg}
}

type jobStore struct {
	mu   sync.Mutex
	jobs map[JobID]*jobEntry
}

func newJobStore() *jobStore { return &jobStore{jobs: make(map[JobID]*jobEntry)} }

func (js *jobStore) create() (JobID, *jobEntry) {
	id := JobID(randomJobID())
	e := &jobEntry{state: JobRunning}
	js.mu.Lock()
	js.jobs[id] = e
	js.mu.Unlock()
	return id, e
}

func (js *jobStore) get(id JobID) (*jobEntry, bool) {
	js.mu.Lock()
	defer js.mu.Unlock()
	e, ok := js.jobs[id]
	return e, ok
}

func randomJobID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

const (
	rpcParseError     RpcErrorCode = -32700
	rpcMethodNotFound RpcErrorCode = -32601
	rpcInvalidParams  RpcErrorCode = -32602
	rpcInternalError  RpcErrorCode = -32603
	rpcServerError    RpcErrorCode = -32000
)

var rpcErrorMap = map[RpcErrorCode]string{
	rpcParseError:     "Parse Error",
	rpcMethodNotFound: "Method Not Found",
	rpcInvalidParams:  "Invalid Params",
	rpcInternalError:  "Internal Error",
	rpcServerError:    "Server Error",
}

func newRpcError(code RpcErrorCode, msg string) *RpcError {
	e := &RpcError{Code: code, Message: rpcErrorMap[code]}
	if msg != "" {
		e.Message += ": " + msg
	}
	return e
}

func New(n *node.Node) *Server { return &Server{node: n, jobs: newJobStore()} }

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "POST Only", http.StatusMethodNotAllowed)
		return
	}

	var req RpcRequest
	resp := &RpcResponse{JSONRPC: "2.0"}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		resp.Error = newRpcError(rpcParseError, err.Error())
		writeJSON(w, resp)
		return
	}

	resp.ID = req.ID
	result, err := s.dispatch(r.Context(), req.Method, req.Params)
	if err != nil {
		resp.Error = err
	} else {
		rb, err := json.Marshal(result)
		if err != nil {
			resp.Error = newRpcError(rpcInternalError, err.Error())
		} else {
			resp.Result = rb
		}
	}
	writeJSON(w, resp)
}

func (s *Server) dispatch(ctx context.Context, method string, params json.RawMessage) (any, *RpcError) {
	switch method {
	case MethodStatus:
		return &StatusResult{
			ID:    s.node.MyID(),
			Peers: len(s.node.Peers()),
		}, nil

	case MethodPeers:
		return PeersResult(s.node.Peers()), nil

	case MethodListFiles:
		var result ListFilesResult
		for id, m := range s.node.Manifests() {
			result = append(result, &ListFilesResultEntry{
				ID:        id,
				Name:      m.Name,
				Size:      m.Size,
				ChunkSize: m.ChunkSize,
				Chunks:    len(m.Chunks),
			})
		}
		if len(result) == 0 {
			result = ListFilesResult{}
		}
		return result, nil

	case MethodPublish:
		var p PublishParams
		if err := json.Unmarshal(params, &p); err != nil || p.Path == "" {
			return nil, newRpcError(rpcInvalidParams, "need {path}")
		}
		fh, m, err := s.node.Publish(p.Path, nil)
		if err != nil {
			return nil, newRpcError(rpcServerError, err.Error())
		}
		return &PublishResult{ID: fh, Manifest: m}, nil

	case MethodDownload:
		var p DownloadParams
		if err := json.Unmarshal(params, &p); err != nil {
			return nil, newRpcError(rpcInvalidParams, "need {id, outdir}")
		}
		filename, err := s.node.Download(ctx, p.ID, p.OutDir, nil)
		if err != nil {
			return nil, newRpcError(rpcServerError, err.Error())
		}
		return &DownloadResult{OK: true, Output: filepath.Join(p.OutDir, filename)}, nil

	case MethodPublishAsync:
		var p PublishParams
		if err := json.Unmarshal(params, &p); err != nil || p.Path == "" {
			return nil, newRpcError(rpcInvalidParams, "need {path}")
		}
		jobID, entry := s.jobs.create()
		go func() {
			fh, m, err := s.node.Publish(p.Path, entry.progress)
			if err != nil {
				entry.finish(nil, err)
				return
			}
			entry.finish(&PublishResult{ID: fh, Manifest: m}, nil)
		}()
		return &PublishAsyncResult{JobID: jobID}, nil

	case MethodDownloadAsync:
		var p DownloadParams
		if err := json.Unmarshal(params, &p); err != nil {
			return nil, newRpcError(rpcInvalidParams, "need {id, outdir}")
		}
		jobID, entry := s.jobs.create()
		go func() {
			filename, err := s.node.Download(context.Background(), p.ID, p.OutDir, entry.progress)
			if err != nil {
				entry.finish(nil, err)
				return
			}
			entry.finish(&DownloadResult{OK: true, Output: filepath.Join(p.OutDir, filename)}, nil)
		}()
		return &DownloadAsyncResult{JobID: jobID}, nil

	case MethodJobStatus:
		var p JobStatusParams
		if err := json.Unmarshal(params, &p); err != nil || p.JobID == "" {
			return nil, newRpcError(rpcInvalidParams, "need {job_id}")
		}
		entry, ok := s.jobs.get(p.JobID)
		if !ok {
			return nil, newRpcError(rpcInvalidParams, "unknown job_id")
		}
		return entry.snapshot(), nil

	case MethodBootstrap:
		var p BootstrapParams
		if err := json.Unmarshal(params, &p); err != nil {
			return nil, newRpcError(rpcInvalidParams, "need [{id, addr}]")
		}
		ok := s.node.Bootstrap(ctx, p) > 0
		return &BootstrapResult{OK: ok}, nil
	default:
		return nil, newRpcError(rpcMethodNotFound, "")
	}
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
