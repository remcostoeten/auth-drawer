import type {
  AuthTriggerConfig,
  AuthTriggerEvent,
  AuthTriggerKind,
  AuthTriggerStore,
  AuthTriggerStoreOptions,
  AuthTriggerStoreSnapshot,
  AuthTriggerStorage,
  TriggerPolicy,
} from "../types";

type TriggerRecord = {
  seenCount: number;
  fireCount: number;
  lastSeenAt: number;
  lastFiredAt: number;
};

type Registration = {
  kind: AuthTriggerKind;
  config: AuthTriggerConfig[AuthTriggerKind] | undefined;
  onFire: (event: AuthTriggerEvent) => void;
};

function createMemoryStorage(): AuthTriggerStorage {
  const entries = new Map<string, string>();

  return {
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, value);
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}

function resolveStorage(storage?: AuthTriggerStorage): AuthTriggerStorage {
  if (storage) return storage;

  if (typeof window !== "undefined") {
    try {
      return window.localStorage;
    } catch {
      return createMemoryStorage();
    }
  }

  return createMemoryStorage();
}

function readRecord(storage: AuthTriggerStorage, key: string): TriggerRecord {
  const raw = storage.getItem(key);

  if (!raw) {
    return {
      seenCount: 0,
      fireCount: 0,
      lastSeenAt: 0,
      lastFiredAt: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TriggerRecord>;

    return {
      seenCount: parsed.seenCount ?? 0,
      fireCount: parsed.fireCount ?? 0,
      lastSeenAt: parsed.lastSeenAt ?? 0,
      lastFiredAt: parsed.lastFiredAt ?? 0,
    };
  } catch {
    return {
      seenCount: 0,
      fireCount: 0,
      lastSeenAt: 0,
      lastFiredAt: 0,
    };
  }
}

function writeRecord(storage: AuthTriggerStorage, key: string, record: TriggerRecord) {
  storage.setItem(key, JSON.stringify(record));
}

function getDayBucket(now: number) {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekBucket(now: number) {
  const date = new Date(now);
  const yearStart = new Date(date.getFullYear(), 0, 1).getTime();
  const dayIndex = Math.floor((now - yearStart) / 86400000);
  const weekIndex = Math.floor(dayIndex / 7) + 1;

  return `${date.getFullYear()}-W${String(weekIndex).padStart(2, "0")}`;
}

function getScopeBucket(scope: TriggerPolicy["scope"], now: number) {
  if (!scope || scope === "session") return "session";
  if (scope === "install") return "install";
  if (scope === "day") return `day:${getDayBucket(now)}`;
  if (scope === "week") return `week:${getWeekBucket(now)}`;

  return "session";
}

function getRegistrationKey(
  namespace: string,
  kind: AuthTriggerKind,
  scope: TriggerPolicy["scope"],
  now: number,
) {
  return `${namespace}:${kind}:${getScopeBucket(scope, now)}`;
}

function eventMatches(
  kind: AuthTriggerKind,
  config: AuthTriggerConfig[AuthTriggerKind],
  event: AuthTriggerEvent,
) {
  if (kind === "pageLoad") {
    return event.kind === "pageLoad";
  }

  if (kind === "click") {
    const clickConfig = config as AuthTriggerConfig["click"];
    if (event.kind !== "click") return false;
    if (clickConfig?.event && event.event && clickConfig.event !== event.event) return false;

    if (!clickConfig?.selector) return true;

    if (event.selector) return event.selector === clickConfig.selector;

    const target = event.target;
    if (typeof Element !== "undefined" && target instanceof Element) {
      return Boolean(target.closest(clickConfig.selector));
    }

    return false;
  }

  if (kind === "state") {
    const stateConfig = config as AuthTriggerConfig["state"];
    return event.kind === "state" && event.state === stateConfig?.state;
  }

  if (kind === "scrollOpen") {
    const scrollConfig = config as AuthTriggerConfig["scrollOpen"];
    return event.kind === "scrollOpen" && event.progress >= (scrollConfig?.threshold ?? 0.25);
  }

  if (kind === "idle") {
    const idleConfig = config as AuthTriggerConfig["idle"];
    return event.kind === "idle" && event.idleMs >= (idleConfig?.idleMs ?? 0);
  }

  if (kind === "custom") {
    const customConfig = config as AuthTriggerConfig["custom"];
    return event.kind === "custom" && event.event === customConfig?.event;
  }

  return false;
}

function canFire(
  config: AuthTriggerConfig[AuthTriggerKind],
  record: TriggerRecord,
  now: number,
  random: () => number,
) {
  if (!config) return false;
  if (config.once && record.fireCount > 0) return false;
  if (config.cooldownMs && record.lastFiredAt > 0 && now - record.lastFiredAt < config.cooldownMs)
    return false;
  if (config.every && config.every > 1 && record.seenCount % config.every !== 0) return false;
  if (config.sampleRate !== undefined && random() > config.sampleRate) return false;

  return true;
}

/**
 * Creates a framework-free trigger store that can be shared by any runtime.
 *
 * The store accepts trigger events from React, DOM listeners, router state, or
 * any other source that can call `emit`.
 */
export function createAuthTriggerStore(options: AuthTriggerStoreOptions = {}): AuthTriggerStore {
  const namespace = options.namespace ?? "auth-drawer";
  const storage = resolveStorage(options.storage);
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? Math.random;
  const listeners = new Set<(event: AuthTriggerEvent) => void>();
  const registrations = new Set<Registration>();
  const knownKeys = new Set<string>();
  const memoryRecords = new Map<string, TriggerRecord>();

  function getRecordKey(kind: AuthTriggerKind, config: AuthTriggerConfig[AuthTriggerKind]) {
    return getRegistrationKey(namespace, kind, config?.scope, now());
  }

  function loadRecord(kind: AuthTriggerKind, config: AuthTriggerConfig[AuthTriggerKind]) {
    const key = getRecordKey(kind, config);

    if (config?.scope && config.scope !== "session") {
      return readRecord(storage, key);
    }

    return (
      memoryRecords.get(key) ?? {
        seenCount: 0,
        fireCount: 0,
        lastSeenAt: 0,
        lastFiredAt: 0,
      }
    );
  }

  function saveRecord(
    kind: AuthTriggerKind,
    config: AuthTriggerConfig[AuthTriggerKind],
    record: TriggerRecord,
  ) {
    const key = getRecordKey(kind, config);
    knownKeys.add(key);

    if (config?.scope && config.scope !== "session") {
      writeRecord(storage, key, record);
      return;
    }

    memoryRecords.set(key, record);
  }

  function registerTrigger(
    kind: AuthTriggerKind,
    config: AuthTriggerConfig[AuthTriggerKind] | undefined,
    onFire: (event: AuthTriggerEvent) => void,
  ) {
    knownKeys.add(getRecordKey(kind, config));

    const registration: Registration = { kind, config, onFire };
    registrations.add(registration);

    return () => {
      registrations.delete(registration);
    };
  }

  function emit(event: AuthTriggerEvent) {
    listeners.forEach((listener) => listener(event));

    for (const registration of registrations) {
      if (!eventMatches(registration.kind, registration.config, event)) continue;

      const record = loadRecord(registration.kind, registration.config);
      const nextRecord = {
        ...record,
        seenCount: record.seenCount + 1,
        lastSeenAt: now(),
      };

      saveRecord(registration.kind, registration.config, nextRecord);

      if (!canFire(registration.config, nextRecord, nextRecord.lastSeenAt, random)) {
        continue;
      }

      const firedRecord = {
        ...nextRecord,
        fireCount: nextRecord.fireCount + 1,
        lastFiredAt: nextRecord.lastSeenAt,
      };

      saveRecord(registration.kind, registration.config, firedRecord);
      registration.onFire(event);
    }
  }

  function snapshot(): AuthTriggerStoreSnapshot {
    const base: AuthTriggerStoreSnapshot = {
      seenCounts: {},
      fireCounts: {},
      lastSeenAt: {},
      lastFiredAt: {},
    };

    for (const key of knownKeys) {
      const record = memoryRecords.get(key) ?? readRecord(storage, key);
      base.seenCounts[key] = record.seenCount;
      base.fireCounts[key] = record.fireCount;
      base.lastSeenAt[key] = record.lastSeenAt;
      base.lastFiredAt[key] = record.lastFiredAt;
    }

    return base;
  }

  function clear(kind?: AuthTriggerKind) {
    if (!kind) {
      memoryRecords.clear();

      for (const key of knownKeys) {
        storage.removeItem(key);
      }

      knownKeys.clear();
      return;
    }

    for (const key of Array.from(knownKeys)) {
      if (!key.includes(`:${kind}:`)) continue;

      memoryRecords.delete(key);
      storage.removeItem(key);
      knownKeys.delete(key);
    }
  }

  return {
    registerTrigger,
    emit,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear,
    snapshot,
  };
}
