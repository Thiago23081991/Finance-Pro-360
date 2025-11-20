import { Transaction, Goal, AppConfig, UserAccount } from "./types";
import { DEFAULT_CONFIG } from "./constants";

const DB_NAME = 'FinancePro360_EnterpriseDB';
const DB_VERSION = 1;

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
}