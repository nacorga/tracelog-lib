import { USER_ID_KEY } from '../app.constants';
import { generateUUID } from '../utils';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';

export class UserManager extends StateManager {
  private readonly storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    super();
    this.storageManager = storageManager;
  }

  getId(): string {
    const storedUserId = this.storageManager.getItem(USER_ID_KEY);

    if (storedUserId) {
      return storedUserId;
    }

    const newUserId = generateUUID();

    this.storageManager.setItem(USER_ID_KEY, newUserId);

    return newUserId;
  }
}
