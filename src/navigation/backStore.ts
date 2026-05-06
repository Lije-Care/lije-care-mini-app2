type BackHandler = {
  id?: string;
  priority?: number;
  canHandle?: () => boolean;
  onBack: () => boolean | void;
};

type RegisteredBackHandler = {
  id: string;
  priority: number;
  canHandle?: () => boolean;
  onBack: () => boolean | void;
  order: number;
};

type BackStoreSnapshot = {
  count: number;
  hasHandlers: boolean;
};

type Listener = () => void;

const listeners = new Set<Listener>();
const handlers = new Map<string, RegisteredBackHandler>();

let nextOrder = 0;
let nextId = 0;
let snapshot: BackStoreSnapshot = {
  count: 0,
  hasHandlers: false,
};

function emitChange() {
  const count = handlers.size;
  snapshot = {
    count,
    hasHandlers: count > 0,
  };
  listeners.forEach((listener) => listener());
}

function getSortedHandlers() {
  return Array.from(handlers.values()).sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return right.order - left.order;
  });
}

export function registerBackHandler(handler: BackHandler) {
  const id = handler.id?.trim() || `back-handler-${++nextId}`;

  handlers.set(id, {
    id,
    priority: handler.priority ?? 0,
    canHandle: handler.canHandle,
    onBack: handler.onBack,
    order: ++nextOrder,
  });
  emitChange();

  return () => {
    if (handlers.delete(id)) {
      emitChange();
    }
  };
}

export function consumeRegisteredBackHandler() {
  for (const handler of getSortedHandlers()) {
    if (handler.canHandle && !handler.canHandle()) {
      continue;
    }

    const result = handler.onBack();
    return result !== false;
  }

  return false;
}

export function subscribeBackStore(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBackStoreSnapshot(): BackStoreSnapshot {
  return snapshot;
}
