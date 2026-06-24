// 추후 API 호출 등을 공통적으로 처리할 Service 계층의 기초입니다.
import { createClient } from '@/utils/supabase/client';

export class BaseService {
  protected supabase = createClient();

  protected async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }
}
