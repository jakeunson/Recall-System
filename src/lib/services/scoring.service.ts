import { BaseService } from './base.service';
import type { MemberScore } from '../types';

export class ScoringService extends BaseService {
  async getMemberScores(memberId: string): Promise<MemberScore[]> {
    // 추후 Supabase 연동 시 scoring 테이블에서 가져오도록 변경
    const { data, error } = await this.supabase.from('scoring').select('*').eq('memberId', memberId);
    if (error) {
      console.warn('Scoring table might not exist yet.', error);
      return [];
    }
    return data || [];
  }

  async calculateTrustScore(memberId: string): Promise<number> {
    // 1. 위원회/본회의 출석
    // 2. 법안 통과 성과
    // 3. 시민 소명/블라인드 퀴즈 지지도 종합
    // 현재는 단순 Mocking 값 반환, 추후 프로시저/서버 사이드 계산 로직 삽입
    return 75;
  }
}

export const scoringService = new ScoringService();