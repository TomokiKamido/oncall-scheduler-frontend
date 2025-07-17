// src/services/customBackendService.ts
import { getAuth } from 'firebase/auth';

interface CustomBackendConfig {
  baseUrl: string;
  timeout?: number;
}

export class CustomBackendService {
  private config: CustomBackendConfig;
  
  constructor(config: CustomBackendConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }
  
  // 認証トークンの取得
  private async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('認証されていません');
    }
    
    return user.getIdToken();
  }
  
  // HTTPリクエストの実行
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout!
    );
    
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTPエラー: ${response.status}`
        );
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました');
      }
      
      throw error;
    }
  }
  
  // ユーザーデータの保存
  async saveUserCustomData(userId: string, data: Record<string, unknown>): Promise<void> {
    const response = await this.makeRequest(
      `/api/v1/users/${userId}/custom-data`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('データの保存に失敗しました');
    }
  }
  
  // ユーザーデータの取得
  async getUserCustomData(userId: string): Promise<Record<string, unknown>> {
    const response = await this.makeRequest(
      `/api/v1/users/${userId}/custom-data`,
      {
        method: 'GET'
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('データの取得に失敗しました');
    }
    
    return result.data;
  }
}

// シングルトンインスタンス
export const customBackend = new CustomBackendService({
  baseUrl: process.env.REACT_APP_CUSTOM_API_URL || 'http://localhost:5000'
});
