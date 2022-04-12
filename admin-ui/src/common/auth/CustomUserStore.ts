import { oidcClientId, oidcUrl, apiScope } from "../const";

export default class CustomUserStore {
  storage = window.localStorage;

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
    this.storage.removeItem(`oidc.apiToken.${apiScope}`); // side effect, make sure api access token is cleared
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  key(i: number): string | null {
    return this.storage.key(i);
  }

  getLength(): number {
    return this.storage.length;
  }

  getAccessToken(): string | undefined {
    const key = `oidc.user:${oidcUrl}/:${oidcClientId}`;
    const data = this.getItem(key);

    if (data) {
      try {
        const parsed = JSON.parse(data);
        return parsed.access_token;
      } catch (Exception) {
        //
      }
    }
    return undefined;
  }
}
