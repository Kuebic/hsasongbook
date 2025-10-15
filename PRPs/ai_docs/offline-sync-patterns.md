# Offline/Online Synchronization Patterns
## For HSA Songbook PWA Implementation

---

## Overview
This document provides comprehensive offline-first synchronization patterns for the HSA Songbook PWA, focusing on conflict resolution, background sync, and data consistency.

## Core Sync Architecture

### Offline-First Principle
```typescript
// Always serve from local, sync in background
class OfflineFirstRepository<T extends { id: string }> {
  async get(id: string): Promise<T | null> {
    // 1. Try local first (instant response)
    const local = await this.localDB.get(id);
    if (local) return local;

    // 2. If not found locally, try remote
    if (navigator.onLine) {
      const remote = await this.remoteAPI.get(id);
      if (remote) {
        await this.localDB.save(remote);
        return remote;
      }
    }

    return null;
  }

  async save(entity: T): Promise<void> {
    // 1. Always save locally first (instant)
    await this.localDB.save(entity);

    // 2. Queue for background sync
    await this.syncQueue.enqueue({
      type: 'upsert',
      entity,
      timestamp: Date.now()
    });

    // 3. Attempt immediate sync if online
    if (navigator.onLine) {
      this.triggerBackgroundSync();
    }
  }
}
```

## Conflict Resolution Strategies

### 1. Last-Write-Wins (LWW) with Timestamps
```typescript
interface LWWEntity {
  id: string;
  data: any;
  updatedAt: number;
  updatedBy: string;
}

class LWWResolver {
  resolve(local: LWWEntity, remote: LWWEntity): LWWEntity {
    // Simple timestamp comparison
    if (local.updatedAt > remote.updatedAt) {
      return local;
    } else if (remote.updatedAt > local.updatedAt) {
      return remote;
    } else {
      // Same timestamp - use deterministic tiebreaker
      return local.updatedBy > remote.updatedBy ? local : remote;
    }
  }
}
```

### 2. Three-Way Merge
```typescript
interface MergeableEntity {
  id: string;
  version: number;
  baseVersion: number;
  fields: Record<string, any>;
}

class ThreeWayMerger {
  async resolve(
    local: MergeableEntity,
    remote: MergeableEntity,
    base: MergeableEntity
  ): Promise<MergeableEntity> {
    const merged: MergeableEntity = {
      id: local.id,
      version: Math.max(local.version, remote.version) + 1,
      baseVersion: merged.version,
      fields: {}
    };

    // Merge each field
    for (const field of Object.keys({ ...local.fields, ...remote.fields })) {
      const localValue = local.fields[field];
      const remoteValue = remote.fields[field];
      const baseValue = base.fields[field];

      if (localValue === remoteValue) {
        // No conflict
        merged.fields[field] = localValue;
      } else if (localValue === baseValue) {
        // Remote changed, local didn't
        merged.fields[field] = remoteValue;
      } else if (remoteValue === baseValue) {
        // Local changed, remote didn't
        merged.fields[field] = localValue;
      } else {
        // Both changed - need resolution
        merged.fields[field] = await this.resolveFieldConflict(
          field,
          localValue,
          remoteValue
        );
      }
    }

    return merged;
  }

  private async resolveFieldConflict(
    field: string,
    localValue: any,
    remoteValue: any
  ): Promise<any> {
    // Field-specific resolution strategies
    switch (field) {
      case 'title':
      case 'description':
        // For text: prefer longer value
        return localValue.length > remoteValue.length ? localValue : remoteValue;

      case 'tags':
        // For arrays: merge unique values
        return [...new Set([...localValue, ...remoteValue])];

      case 'rating':
        // For numbers: average
        return (localValue + remoteValue) / 2;

      default:
        // Default: last-write-wins
        return localValue;
    }
  }
}
```

### 3. Operational Transformation for Collaborative Editing
```typescript
interface Operation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
}

class OTResolver {
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Transform op1 against op2
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position + op1.content!.length }];
      } else if (op1.position > op2.position) {
        return [{ ...op1, position: op1.position + op2.content!.length }, op2];
      } else {
        // Same position - deterministic ordering
        return op1.content! < op2.content!
          ? [op1, { ...op2, position: op2.position + op1.content!.length }]
          : [{ ...op1, position: op1.position + op2.content!.length }, op2];
      }
    }
    // ... handle other operation combinations
    return [op1, op2];
  }
}
```

## Background Sync Implementation

### Service Worker Background Sync
```typescript
// service-worker.ts
self.addEventListener('sync', async (event: ExtendableEvent & { tag: string }) => {
  if (event.tag === 'songbook-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync(): Promise<void> {
  const syncManager = new BackgroundSyncManager();
  await syncManager.processQueue();
}

// In main app
async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('songbook-sync');
  }
}
```

### Sync Queue Implementation
```typescript
interface SyncQueueItem {
  id: string;
  type: 'song' | 'arrangement' | 'setlist';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

class SyncQueue {
  private db: IDBDatabase;
  private processing = false;

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'attempts'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${item.type}-${item.operation}-${Date.now()}-${Math.random()}`,
      attempts: 0
    };

    await this.saveToQueue(queueItem);
    this.processQueue(); // Don't await - process in background
  }

  async processQueue(): Promise<void> {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;

    try {
      const items = await this.getQueueItems();

      for (const item of items) {
        try {
          await this.processItem(item);
          await this.removeFromQueue(item.id);
        } catch (error) {
          await this.handleSyncError(item, error);
        }
      }
    } finally {
      this.processing = false;

      // Check if there are more items
      const remaining = await this.getQueueCount();
      if (remaining > 0 && navigator.onLine) {
        // Schedule next processing with exponential backoff
        setTimeout(() => this.processQueue(), this.getBackoffDelay());
      }
    }
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    const endpoint = `/api/${item.type}s`;

    switch (item.operation) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(item.data),
          headers: { 'Content-Type': 'application/json' }
        });
        break;

      case 'update':
        await fetch(`${endpoint}/${item.data.id}`, {
          method: 'PUT',
          body: JSON.stringify(item.data),
          headers: { 'Content-Type': 'application/json' }
        });
        break;

      case 'delete':
        await fetch(`${endpoint}/${item.data.id}`, {
          method: 'DELETE'
        });
        break;
    }
  }

  private async handleSyncError(item: SyncQueueItem, error: any): Promise<void> {
    item.attempts++;
    item.lastError = error.message;

    if (item.attempts >= 3) {
      // Max retries reached - move to dead letter queue
      await this.moveToDeadLetterQueue(item);
      await this.removeFromQueue(item.id);
    } else {
      // Update attempt count
      await this.updateQueueItem(item);
    }
  }

  private getBackoffDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const attempt = this.getAttemptCount();

    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * delay * 0.1;

    return delay + jitter;
  }
}
```

## Online/Offline Detection

### Connection Status Manager
```typescript
class ConnectionManager {
  private isOnline = navigator.onLine;
  private listeners = new Set<(online: boolean) => void>();

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Periodic connectivity check
    setInterval(() => this.checkConnectivity(), 30000);
  }

  private handleOnline = (): void => {
    this.setOnlineStatus(true);
    this.notifyListeners(true);
    this.triggerSync();
  };

  private handleOffline = (): void => {
    this.setOnlineStatus(false);
    this.notifyListeners(false);
  };

  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-store'
      });

      this.setOnlineStatus(response.ok);
    } catch {
      this.setOnlineStatus(false);
    }
  }

  private triggerSync(): void {
    // Trigger background sync when coming online
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('songbook-sync');
      });
    }
  }

  public onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }
}
```

## Delta Sync Implementation

### Efficient Delta Updates
```typescript
interface DeltaSync {
  lastSyncTimestamp: number;
  pendingDeltas: Delta[];
}

interface Delta {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  changes?: Partial<any>;
  timestamp: number;
}

class DeltaSyncManager {
  async pullDeltas(since: number): Promise<Delta[]> {
    const response = await fetch(`/api/sync/deltas?since=${since}`);
    const deltas = await response.json();
    return deltas;
  }

  async pushDeltas(deltas: Delta[]): Promise<void> {
    await fetch('/api/sync/deltas', {
      method: 'POST',
      body: JSON.stringify({ deltas }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async applyDeltas(deltas: Delta[]): Promise<void> {
    const grouped = this.groupDeltasByEntity(deltas);

    for (const [entityType, entityDeltas] of Object.entries(grouped)) {
      await this.applyEntityDeltas(entityType, entityDeltas);
    }
  }

  private groupDeltasByEntity(deltas: Delta[]): Record<string, Delta[]> {
    return deltas.reduce((acc, delta) => {
      if (!acc[delta.entityType]) {
        acc[delta.entityType] = [];
      }
      acc[delta.entityType].push(delta);
      return acc;
    }, {} as Record<string, Delta[]>);
  }

  private async applyEntityDeltas(entityType: string, deltas: Delta[]): Promise<void> {
    const tx = this.db.transaction(entityType, 'readwrite');
    const store = tx.objectStore(entityType);

    for (const delta of deltas) {
      switch (delta.type) {
        case 'create':
        case 'update':
          await store.put(delta.changes);
          break;
        case 'delete':
          await store.delete(delta.entityId);
          break;
      }
    }

    await tx.done;
  }
}
```

## Supabase Integration

### Supabase Offline Repository
```typescript
import { SupabaseClient } from '@supabase/supabase-js';

class SupabaseOfflineRepository<T extends { id: string; updated_at: string }> {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    private localDB: IDBDatabase
  ) {}

  async sync(): Promise<void> {
    // 1. Pull remote changes
    await this.pullChanges();

    // 2. Push local changes
    await this.pushChanges();

    // 3. Resolve conflicts
    await this.resolveConflicts();
  }

  private async pullChanges(): Promise<void> {
    const lastSync = await this.getLastSyncTime();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gt('updated_at', lastSync)
      .order('updated_at');

    if (error) throw error;

    // Apply remote changes to local
    for (const item of data || []) {
      await this.mergeRemoteChange(item);
    }

    await this.updateLastSyncTime();
  }

  private async pushChanges(): Promise<void> {
    const localChanges = await this.getUnsyncedChanges();

    for (const change of localChanges) {
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .upsert(change);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            await this.handleConflict(change);
          } else {
            throw error;
          }
        } else {
          await this.markAsSynced(change.id);
        }
      } catch (error) {
        console.error('Sync error:', error);
        // Keep in queue for retry
      }
    }
  }

  private async handleConflict(localItem: T): Promise<void> {
    // Fetch current remote version
    const { data: remoteItem } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', localItem.id)
      .single();

    if (!remoteItem) {
      // Remote was deleted - respect deletion
      await this.deleteLocal(localItem.id);
      return;
    }

    // Apply conflict resolution strategy
    const resolved = this.resolveConflict(localItem, remoteItem);

    // Update both local and remote
    await this.updateLocal(resolved);
    await this.supabase
      .from(this.tableName)
      .update(resolved)
      .eq('id', resolved.id);
  }

  private resolveConflict(local: T, remote: T): T {
    // Simple last-write-wins
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();

    return localTime > remoteTime ? local : remote;
  }
}
```

## Retry Strategies

### Exponential Backoff with Jitter
```typescript
class RetryManager {
  private readonly baseDelay = 1000; // 1 second
  private readonly maxDelay = 60000; // 1 minute
  private readonly maxRetries = 5;

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`Retry ${attempt + 1}/${this.maxRetries} for ${context} in ${delay}ms`);

        await this.sleep(delay);
      }
    }

    throw new Error(`Max retries exceeded for ${context}: ${lastError!.message}`);
  }

  private isRetryable(error: any): boolean {
    // Network errors are retryable
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }

    // HTTP status codes that are retryable
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    // Add jitter (±10%)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);

    return Math.round(exponentialDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Complete Sync Coordinator

### Main Sync Orchestrator
```typescript
class SyncCoordinator {
  private syncQueue: SyncQueue;
  private connectionManager: ConnectionManager;
  private deltaSyncManager: DeltaSyncManager;
  private retryManager: RetryManager;
  private syncInProgress = false;

  constructor(
    private songRepo: SupabaseOfflineRepository<Song>,
    private arrangementRepo: SupabaseOfflineRepository<Arrangement>,
    private setlistRepo: SupabaseOfflineRepository<Setlist>
  ) {
    this.syncQueue = new SyncQueue();
    this.connectionManager = new ConnectionManager();
    this.deltaSyncManager = new DeltaSyncManager();
    this.retryManager = new RetryManager();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Sync when coming online
    this.connectionManager.onStatusChange(online => {
      if (online && !this.syncInProgress) {
        this.performSync();
      }
    });

    // Periodic sync when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.performSync();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async performSync(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('Starting sync...');

    try {
      // 1. Process sync queue
      await this.syncQueue.processQueue();

      // 2. Pull and apply deltas
      const lastSync = await this.getLastSyncTimestamp();
      const deltas = await this.deltaSyncManager.pullDeltas(lastSync);
      await this.deltaSyncManager.applyDeltas(deltas);

      // 3. Sync each repository
      await Promise.all([
        this.retryManager.executeWithRetry(
          () => this.songRepo.sync(),
          'songs'
        ),
        this.retryManager.executeWithRetry(
          () => this.arrangementRepo.sync(),
          'arrangements'
        ),
        this.retryManager.executeWithRetry(
          () => this.setlistRepo.sync(),
          'setlists'
        )
      ]);

      // 4. Update last sync timestamp
      await this.updateLastSyncTimestamp();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async getLastSyncTimestamp(): Promise<number> {
    const stored = localStorage.getItem('lastSyncTimestamp');
    return stored ? parseInt(stored, 10) : 0;
  }

  private async updateLastSyncTimestamp(): Promise<void> {
    localStorage.setItem('lastSyncTimestamp', Date.now().toString());
  }
}
```

## Best Practices

### DO:
- ✅ Always save locally first
- ✅ Queue operations for background sync
- ✅ Implement proper conflict resolution
- ✅ Use exponential backoff for retries
- ✅ Monitor sync queue size
- ✅ Provide user feedback on sync status

### DON'T:
- ❌ Block UI waiting for sync
- ❌ Lose user data during conflicts
- ❌ Retry infinitely without backoff
- ❌ Sync everything on every change
- ❌ Ignore network status changes

## References
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Workbox Background Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Conflict-Free Replicated Data Types](https://crdt.tech/)