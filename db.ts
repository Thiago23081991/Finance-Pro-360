
import { Transaction, Goal, AppConfig, UserAccount, PurchaseRequest, AdminMessage } from "./types";
import { DEFAULT_CONFIG } from "./constants";

const DB_NAME = 'FinancePro360_EnterpriseDB';
const DB_VERSION = 4; // Incrementado para messages

// Database Schema Definition
export class DBService {
  private static async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users Store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'username' });
        }

        // Transactions Store (Indexed by userId for fast retrieval)
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('by_user', 'userId', { unique: false });
        }

        // Goals Store
        if (!db.objectStoreNames.contains('goals')) {
          const store = db.createObjectStore('goals', { keyPath: 'id' });
          store.createIndex('by_user', 'userId', { unique: false });
        }

        // Config Store
        if (!db.objectStoreNames.contains('configs')) {
          db.createObjectStore('configs', { keyPath: 'userId' });
        }

        // Purchase Requests Store
        if (!db.objectStoreNames.contains('purchase_requests')) {
          const store = db.createObjectStore('purchase_requests', { keyPath: 'userId' }); 
        }

        // Messages Store (New in v4)
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'id' });
          store.createIndex('by_receiver', 'receiver', { unique: false });
        }
      };
    });
  }

  // --- AUTH OPERATIONS ---

  static async registerUser(user: UserAccount): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      
      const checkRequest = store.get(user.username);
      
      checkRequest.onsuccess = () => {
        if (checkRequest.result) {
          reject(new Error("Usuário já existe"));
        } else {
          const addRequest = store.add(user);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      checkRequest.onerror = () => reject(checkRequest.error);
    });
  }

  static async loginUser(username: string, password: string): Promise<boolean> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(username);

      request.onsuccess = () => {
        const user = request.result as UserAccount;
        if (user && user.password === password) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async resetUserPassword(username: string, newPass: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.get(username);

        request.onsuccess = () => {
            const user = request.result as UserAccount;
            if (user) {
                user.password = newPass;
                const updateRequest = store.put(user);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                reject(new Error("Usuário não encontrado"));
            }
        };
        request.onerror = () => reject(request.error);
    });
  }

  // --- DATA OPERATIONS ---

  static async getTransactions(userId: string): Promise<Transaction[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('by_user');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async addTransaction(t: Transaction): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.put(t); // put allows update if id exists
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteTransaction(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getGoals(userId: string): Promise<Goal[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['goals'], 'readonly');
      const store = transaction.objectStore('goals');
      const index = store.index('by_user');
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveGoal(g: Goal): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['goals'], 'readwrite');
      const store = transaction.objectStore('goals');
      const request = store.put(g);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteGoal(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['goals'], 'readwrite');
      const store = transaction.objectStore('goals');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getConfig(userId: string): Promise<AppConfig> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['configs'], 'readonly');
        const store = transaction.objectStore('configs');
        const request = store.get(userId);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result);
            } else {
                resolve({ ...DEFAULT_CONFIG, userId });
            }
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        resolve({ ...DEFAULT_CONFIG, userId });
      }
    });
  }

  static async saveConfig(config: AppConfig): Promise<void> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['configs'], 'readwrite');
        const store = transaction.objectStore('configs');
        const request = store.put(config);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
  }

  // --- BACKUP OPERATIONS ---

  static async createBackup(): Promise<string> {
      const db = await this.open();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['users', 'transactions', 'goals', 'configs', 'messages'], 'readonly');
          const backup: any = {};
          
          let completed = 0;
          const stores = ['users', 'transactions', 'goals', 'configs', 'messages'];

          stores.forEach(storeName => {
              const store = transaction.objectStore(storeName);
              const request = store.getAll();
              request.onsuccess = () => {
                  backup[storeName] = request.result;
                  completed++;
                  if (completed === stores.length) {
                      resolve(JSON.stringify(backup));
                  }
              };
              request.onerror = () => reject(request.error);
          });
      });
  }

  static async restoreBackup(jsonString: string): Promise<void> {
      const data = JSON.parse(jsonString);
      const db = await this.open();
      
      return new Promise((resolve, reject) => {
          const transaction = db.transaction(['users', 'transactions', 'goals', 'configs', 'messages'], 'readwrite');
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);

          if (data.users) {
              const store = transaction.objectStore('users');
              data.users.forEach((item: any) => store.put(item));
          }
          if (data.transactions) {
              const store = transaction.objectStore('transactions');
              data.transactions.forEach((item: any) => store.put(item));
          }
          if (data.goals) {
              const store = transaction.objectStore('goals');
              data.goals.forEach((item: any) => store.put(item));
          }
          if (data.configs) {
              const store = transaction.objectStore('configs');
              data.configs.forEach((item: any) => store.put(item));
          }
           if (data.messages) {
              const store = transaction.objectStore('messages');
              data.messages.forEach((item: any) => store.put(item));
          }
      });
  }

  // --- PURCHASE REQUEST OPERATIONS (ADMIN) ---

  static async getPurchaseRequest(userId: string): Promise<PurchaseRequest | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['purchase_requests'], 'readonly');
            const store = transaction.objectStore('purchase_requests');
            const request = store.get(userId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
  }

  static async savePurchaseRequest(req: PurchaseRequest): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['purchase_requests'], 'readwrite');
        const store = transaction.objectStore('purchase_requests');
        const request = store.put(req);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }

  static async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['purchase_requests'], 'readonly');
            const store = transaction.objectStore('purchase_requests');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } catch (e) {
            resolve([]);
        }
    });
  }

  // --- MESSAGING OPERATIONS ---

  static async sendMessage(msg: AdminMessage): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const request = store.add(msg);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }

  static async getMessagesForUser(userId: string): Promise<AdminMessage[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('by_receiver');
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const msgs = request.result || [];
            // Sort by timestamp desc
            msgs.sort((a: AdminMessage, b: AdminMessage) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            resolve(msgs);
        };
        request.onerror = () => reject(request.error);
    });
  }

  static async markMessageAsRead(msgId: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const getRequest = store.get(msgId);
        
        getRequest.onsuccess = () => {
            const msg = getRequest.result as AdminMessage;
            if (msg) {
                msg.read = true;
                store.put(msg);
                resolve();
            } else {
                resolve();
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
  }
}
