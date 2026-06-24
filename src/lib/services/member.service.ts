import { BaseService } from './base.service';
import type { Member } from '../types';

export class MemberService extends BaseService {
  async getMember(id: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(error);
      return null;
    }
    return data as Member;
  }

  async getMembers(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*');

    if (error) {
      console.error(error);
      return [];
    }
    return data as Member[];
  }
}

export const memberService = new MemberService();
