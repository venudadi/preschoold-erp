// offlineSync.js
// Offline capability and sync management for camera uploads

class OfflineSync {
  constructor() {
    this.dbName = 'PortfolioOfflineDB';
    this.version = 1;
    this.db = null;
    this.storeName = 'pendingUploads';
    this.syncInProgress = false;
    this.syncCallbacks = [];

    this.initDB();
    this.setupEventListeners();
  }

  async initDB() {
    try {
      this.db = await this.openDB();
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for pending uploads
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes
          store.createIndex('childId', 'childId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('retryCount', 'retryCount', { unique: false });
        }
      };
    });
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Periodic sync when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncPendingUploads();
      }
    }, 30000); // Every 30 seconds
  }

  handleOnline() {
    console.log('Device came online, attempting sync...');
    this.syncPendingUploads();
  }

  handleOffline() {
    console.log('Device went offline, uploads will be queued');
  }

  // Store upload for offline processing
  async storeUpload(uploadData) {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const uploadRecord = {
      ...uploadData,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      lastAttempt: null,
      error: null
    };

    return new Promise((resolve, reject) => {
      const request = store.add(uploadRecord);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending uploads
  async getPendingUploads() {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update upload status
  async updateUploadStatus(id, status, error = null) {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.status = status;
          record.lastAttempt = Date.now();
          record.error = error;

          if (status === 'failed') {
            record.retryCount = (record.retryCount || 0) + 1;
          }

          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Remove completed uploads
  async removeUpload(id) {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending uploads
  async syncPendingUploads() {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    this.notifyCallbacks('sync_started');

    try {
      const pendingUploads = await this.getPendingUploads();
      console.log(`Found ${pendingUploads.length} pending uploads`);

      let successCount = 0;
      let failureCount = 0;

      for (const upload of pendingUploads) {
        // Skip uploads that have failed too many times
        if (upload.retryCount >= 3) {
          console.warn(`Skipping upload ${upload.id} - too many retries`);
          continue;
        }

        try {
          await this.processUpload(upload);
          await this.updateUploadStatus(upload.id, 'completed');
          await this.removeUpload(upload.id);
          successCount++;

          this.notifyCallbacks('upload_success', { upload, successCount });
        } catch (error) {
          console.error(`Failed to sync upload ${upload.id}:`, error);
          await this.updateUploadStatus(upload.id, 'failed', error.message);
          failureCount++;

          this.notifyCallbacks('upload_failed', { upload, error, failureCount });
        }
      }

      console.log(`Sync completed: ${successCount} successful, ${failureCount} failed`);
      this.notifyCallbacks('sync_completed', { successCount, failureCount });

    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyCallbacks('sync_failed', { error });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual upload
  async processUpload(upload) {
    const formData = new FormData();

    // Handle single vs batch upload
    if (upload.type === 'single') {
      formData.append('file', upload.file);
      formData.append('childId', upload.childId);

      if (upload.metadata) {
        formData.append('captureMetadata', JSON.stringify(upload.metadata));
        formData.append('captureMethod', upload.captureMethod || 'camera');
      }

      if (upload.title) formData.append('title', upload.title);
      if (upload.description) formData.append('description', upload.description);
      if (upload.tags) formData.append('tags', JSON.stringify(upload.tags));

      const response = await fetch('/api/digital-portfolio/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();

    } else if (upload.type === 'batch') {
      formData.append('childId', upload.childId);

      upload.files.forEach((fileData, index) => {
        formData.append('files', fileData.file);
        if (fileData.metadata) {
          formData.append(`captureMetadata[${index}]`, JSON.stringify(fileData.metadata));
        }
        if (fileData.title) {
          formData.append(`titles[${index}]`, fileData.title);
        }
        if (fileData.description) {
          formData.append(`descriptions[${index}]`, fileData.description);
        }
      });

      const response = await fetch('/api/digital-portfolio/batch-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Batch upload failed: ${response.statusText}`);
      }

      return await response.json();
    }
  }

  // Convert file/blob data to storable format
  async prepareFileForStorage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result, // Base64 data URL
          lastModified: file.lastModified
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Restore file from storage
  base64ToFile(base64Data, filename, mimeType) {
    const arr = base64Data.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mimeType });
  }

  // Register callback for sync events
  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  // Remove sync callback
  offSync(callback) {
    this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
  }

  // Notify callbacks
  notifyCallbacks(event, data = {}) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    });
  }

  // Get sync status
  getSyncStatus() {
    return {
      online: navigator.onLine,
      syncing: this.syncInProgress
    };
  }

  // Manual sync trigger
  forcSync() {
    if (navigator.onLine) {
      this.syncPendingUploads();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Clear all pending uploads (for development/testing)
  async clearAllPending() {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage statistics
  async getStorageStats() {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result;
        const stats = {
          total: records.length,
          pending: records.filter(r => r.status === 'pending').length,
          failed: records.filter(r => r.status === 'failed').length,
          completed: records.filter(r => r.status === 'completed').length,
          totalSize: records.reduce((sum, r) => sum + (r.file?.size || 0), 0)
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineSync = new OfflineSync();

export default offlineSync;