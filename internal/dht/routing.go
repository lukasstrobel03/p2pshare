package dht

import (
	"sort"
	"sync"
)

// PingFunc 由 Kademlia 注入，用于探测桶中最旧节点是否存活。
type PingFunc func(Contact) bool

// RoutingTable 是按 XOR 距离最高有效位分桶的 k-bucket 路由表。
type RoutingTable struct {
	self    ID
	k       int
	mu      sync.Mutex
	buckets [256][]Contact // 索引 = 与 self 的 XOR 距离前导零位数
	ping    PingFunc
}

func NewRoutingTable(self ID, k int) *RoutingTable {
	return &RoutingTable{self: self, k: k}
}

func (rt *RoutingTable) SetPing(p PingFunc) { rt.ping = p }

func bucketIndex(self, other ID) int {
	lz := self.Xor(other).LeadingZeros()
	if lz >= 256 {
		return 255
	}
	return lz
}

// Update 把一个 contact 加入路由表，实现 Kademlia 的 LRU + 存活探测策略。
func (rt *RoutingTable) Update(c Contact) {
	if c.ID == rt.self || c.ID.IsZero() || c.Addr == "" {
		return
	}
	idx := bucketIndex(rt.self, c.ID)

	rt.mu.Lock()
	b := rt.buckets[idx]
	// 已存在：移动到队尾（最近活跃）。
	for i := range b {
		if b[i].ID == c.ID {
			b = append(append(b[:i:i], b[i+1:]...), c)
			rt.buckets[idx] = b
			rt.mu.Unlock()
			return
		}
	}
	// 有空位：直接追加。
	if len(b) < rt.k {
		rt.buckets[idx] = append(b, c)
		rt.mu.Unlock()
		return
	}
	// 桶满：探测最旧节点（队首），存活则保留旧节点，否则用新节点替换。
	oldest := b[0]
	rt.mu.Unlock()
	go rt.tryReplace(idx, oldest, c)
}

func (rt *RoutingTable) tryReplace(idx int, oldest, cand Contact) {
	alive := rt.ping != nil && rt.ping(oldest)
	rt.mu.Lock()
	defer rt.mu.Unlock()
	b := rt.buckets[idx]
	if len(b) == 0 || b[0].ID != oldest.ID {
		return
	}
	if alive {
		rt.buckets[idx] = append(b[1:], oldest) // 旧节点移到队尾
	} else {
		rt.buckets[idx] = append(b[1:], cand) // 替换为新节点
	}
}

// Closest 返回与 target 最近的 count 个节点。
func (rt *RoutingTable) Closest(target ID, count int) []Contact {
	rt.mu.Lock()
	var all []Contact
	for _, b := range rt.buckets {
		all = append(all, b...)
	}
	rt.mu.Unlock()
	sort.Slice(all, func(i, j int) bool {
		return target.Xor(all[i].ID).Less(target.Xor(all[j].ID))
	})
	if len(all) > count {
		all = all[:count]
	}
	return all
}

func (rt *RoutingTable) AllContacts() []Contact {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	var all []Contact
	for _, b := range rt.buckets {
		all = append(all, b...)
	}
	return all
}
