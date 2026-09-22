import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'eisenhower_user_id';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let _cached: string | null = null;

export const UserIdService = {
  async get(): Promise<string> {
    if (_cached) return _cached;
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored) {
        _cached = stored;
        return stored;
      }
      const fresh = uuidv4();
      await AsyncStorage.setItem(KEY, fresh);
      _cached = fresh;
      return fresh;
    } catch {
      return 'anonymous';
    }
  },

  getCached(): string | null {
    return _cached;
  },
};
