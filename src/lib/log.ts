// 簡易メトリクスとイベントログ（開発支援）
// - プロセス内に近況のイベント一覧とカウンタを保持します。
// - `/api/metrics` からスナップショットを参照可能（開発時のみ）。
type Counters = Record<string, number>;

type EventRecord = {
  ts: number;
  name: string;
  props?: Record<string, unknown>;
};

type MetricsStore = {
  since: number;
  counters: Counters;
  events: EventRecord[];
};

const globalForMetrics = globalThis as unknown as { __metrics?: MetricsStore };

function getStore(): MetricsStore {
  if (!globalForMetrics.__metrics) {
    globalForMetrics.__metrics = {
      since: Date.now(),
      counters: Object.create(null),
      events: [],
    };
  }
  return globalForMetrics.__metrics!;
}

export function incCounter(name: string, by = 1) {
  const store = getStore();
  store.counters[name] = (store.counters[name] || 0) + by;
}

export function logEvent(name: string, props?: Record<string, unknown>) {
  const store = getStore();
  // counters: event name total
  incCounter(`events:${name}`, 1);
  if (name.startsWith('publish.')) {
    incCounter(`publish:${name.split('.').slice(1).join('.') || 'event'}`, 1);
  }
  // keep recent 100
  const rec: EventRecord = { ts: Date.now(), name, props };
  store.events.push(rec);
  if (store.events.length > 100) store.events.shift();
  // structured console
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', ts: rec.ts, event: name, ...props }));
  } catch {
    // ignore
  }
}

export function getMetricsSnapshot() {
  const store = getStore();
  return {
    since: store.since,
    counters: store.counters,
    recent: store.events,
  };
}
