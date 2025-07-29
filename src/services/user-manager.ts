import { USER_ID_KEY } from '../app.constants';
import { generateUUID } from '../utils/uuid.utils';
import { persistentStorage } from './storage-manager';

export class UserManager {
  private readonly userId: string;

  constructor() {
    this.userId = this.getOrInitializeUserId();
  }

  getUserId(): string {
    return this.userId;
  }

  private getOrInitializeUserId(): string {
    const storedUserId = persistentStorage.getItem(USER_ID_KEY);

    if (storedUserId) {
      return storedUserId;
    }

    const newUserId = generateUUID();

    persistentStorage.setItem(USER_ID_KEY, newUserId);

    return newUserId;
  }
}
