// Offline-first storage utilities for parent communication hub
class OfflineStorageManager {
  constructor() {
    this.dbName = 'ParentCommunicationDB';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];

    // Initialize event listeners
    this.setupNetworkListeners();
    this.initIndexedDB();
  }

  // Initialize IndexedDB
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Child data store
        if (!db.objectStoreNames.contains('children')) {
          const childStore = db.createObjectStore('children', { keyPath: 'id' });
          childStore.createIndex('parentId', 'parentId', { unique: false });
        }

        // Timeline data store
        if (!db.objectStoreNames.contains('timeline')) {
          const timelineStore = db.createObjectStore('timeline', { keyPath: 'id' });
          timelineStore.createIndex('childId', 'childId', { unique: false });
          timelineStore.createIndex('date', 'date', { unique: false });
        }

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notificationStore.createIndex('childId', 'childId', { unique: false });
          notificationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Voice messages store
        if (!db.objectStoreNames.contains('voiceMessages')) {
          const voiceStore = db.createObjectStore('voiceMessages', { keyPath: 'id' });
          voiceStore.createIndex('childId', 'childId', { unique: false });
          voiceStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Media uploads store
        if (!db.objectStoreNames.contains('mediaUploads')) {
          const mediaStore = db.createObjectStore('mediaUploads', { keyPath: 'id' });
          mediaStore.createIndex('childId', 'childId', { unique: false });
          mediaStore.createIndex('status', 'status', { unique: false });
        }

        // Progress tracking store
        if (!db.objectStoreNames.contains('progressData')) {
          const progressStore = db.createObjectStore('progressData', { keyPath: 'id' });
          progressStore.createIndex('childId', 'childId', { unique: false });
          progressStore.createIndex('category', 'category', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    });
  }

  // Setup network event listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      // Back online - processing sync queue
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      // Offline mode activated
    });
  }

  // Generic store data method
  async storeData(storeName, data) {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...data, lastUpdated: Date.now() });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic get data method
  async getData(storeName, id) {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all data from store with optional filter
  async getAllData(storeName, indexName = null, indexValue = null) {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      let request;
      if (indexName && indexValue) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Child-specific methods
  async storeChildData(childData) {
    return this.storeData('children', childData);
  }

  async getChildData(childId) {
    return this.getData('children', childId);
  }

  async getAllChildren() {
    return this.getAllData('children');
  }

  // Timeline methods
  async storeTimelineData(timelineData) {
    return this.storeData('timeline', timelineData);
  }

  async getChildTimeline(childId, date = null) {
    if (date) {
      return this.getAllData('timeline', 'date', date);
    }
    return this.getAllData('timeline', 'childId', childId);
  }

  // Notifications methods
  async storeNotification(notification) {
    return this.storeData('notifications', {
      ...notification,
      cached: true,
      timestamp: notification.timestamp || Date.now()
    });
  }

  async getNotifications(childId = null) {
    if (childId) {
      return this.getAllData('notifications', 'childId', childId);
    }
    return this.getAllData('notifications');
  }

  // Voice messages methods
  async storeVoiceMessage(voiceMessage) {
    return this.storeData('voiceMessages', {
      ...voiceMessage,
      timestamp: voiceMessage.timestamp || Date.now(),
      synced: this.isOnline
    });
  }

  async getVoiceMessages(childId) {
    return this.getAllData('voiceMessages', 'childId', childId);
  }

  // Media uploads methods
  async storeMediaUpload(mediaData) {
    return this.storeData('mediaUploads', {
      ...mediaData,
      status: this.isOnline ? 'pending' : 'offline',
      timestamp: Date.now()
    });
  }

  async getMediaUploads(childId = null) {
    if (childId) {
      return this.getAllData('mediaUploads', 'childId', childId);
    }
    return this.getAllData('mediaUploads');
  }

  // Progress data methods
  async storeProgressData(progressData) {
    return this.storeData('progressData', progressData);
  }

  async getProgressData(childId) {
    return this.getAllData('progressData', 'childId', childId);
  }

  // Sync queue management
  async addToSyncQueue(operation) {
    const queueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      priority: operation.priority || 1,
      attempts: 0,
      maxAttempts: 3
    };

    await this.storeData('syncQueue', queueItem);

    // If online, immediately try to sync
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue when back online
  async processSyncQueue() {
    if (!this.isOnline) return;

    const queue = await this.getAllData('syncQueue');
    const sortedQueue = queue.sort((a, b) => b.priority - a.priority);

    for (const item of sortedQueue) {
      try {
        await this.processSyncItem(item);
        await this.removeSyncItem(item.id);
        // Sync completed for operation type
      } catch (error) {
        console.error('❌ Sync failed:', item.operation.type, error);

        // Increment attempts
        item.attempts = (item.attempts || 0) + 1;

        if (item.attempts >= item.maxAttempts) {
          console.error('🚫 Max sync attempts reached, removing from queue:', item.id);
          await this.removeSyncItem(item.id);
        } else {
          await this.storeData('syncQueue', item);
        }
      }
    }
  }

  // Process individual sync item
  async processSyncItem(item) {
    const { operation } = item;

    switch (operation.type) {
      case 'voice_message':
        await this.syncVoiceMessage(operation.data);
        break;
      case 'media_upload':
        await this.syncMediaUpload(operation.data);
        break;
      case 'notification_read':
        await this.syncNotificationStatus(operation.data);
        break;
      case 'progress_update':
        await this.syncProgressUpdate(operation.data);
        break;
      default:
        console.warn('Unknown sync operation type:', operation.type);
    }
  }

  // Sync voice message
  async syncVoiceMessage(data) {
    const response = await fetch('/api/voice-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync voice message');
    }

    return response.json();
  }

  // Sync media upload
  async syncMediaUpload(data) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('metadata', JSON.stringify(data.metadata));

    const response = await fetch('/api/media-uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to sync media upload');
    }

    return response.json();
  }

  // Sync notification status
  async syncNotificationStatus(data) {
    const response = await fetch(`/api/notifications/${data.id}/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ readAt: data.readAt })
    });

    if (!response.ok) {
      throw new Error('Failed to sync notification status');
    }

    return response.json();
  }

  // Sync progress update
  async syncProgressUpdate(data) {
    const response = await fetch('/api/progress-updates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to sync progress update');
    }

    return response.json();
  }

  // Remove item from sync queue
  async removeSyncItem(id) {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache management
  async clearExpiredData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const stores = ['timeline', 'notifications', 'voiceMessages', 'progressData'];
    const cutoffTime = Date.now() - maxAge;

    for (const storeName of stores) {
      const data = await this.getAllData(storeName);
      const expiredItems = data.filter(item =>
        (item.lastUpdated || item.timestamp) < cutoffTime
      );

      for (const item of expiredItems) {
        await this.deleteData(storeName, item.id);
      }

      // Cleaned expired items from storage
    }
  }

  // Delete data from store
  async deleteData(storeName, id) {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage usage
  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    }
    return null;
  }

  // Check if specific data is available offline
  async isAvailableOffline(storeName, id) {
    const data = await this.getData(storeName, id);
    return !!data;
  }

  // Get network status
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    };
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageManager();

export default offlineStorage;

// React hook for using offline storage
export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [storageUsage, setStorageUsage] = React.useState(null);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get storage usage
    offlineStorage.getStorageUsage().then(setStorageUsage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheData = async (storeName, data) => {
    return offlineStorage.storeData(storeName, data);
  };

  const getCachedData = async (storeName, id = null) => {
    if (id) {
      return offlineStorage.getData(storeName, id);
    }
    return offlineStorage.getAllData(storeName);
  };

  const addToSyncQueue = async (operation) => {
    return offlineStorage.addToSyncQueue(operation);
  };

  return {
    isOnline,
    storageUsage,
    cacheData,
    getCachedData,
    addToSyncQueue,
    storage: offlineStorage
  };
};