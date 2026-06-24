import { BaseService } from './base.service';
import type { BillThread, BillProposal, BillReply, ReplyType } from '../types';

export class BillService extends BaseService {
  async getBills(): Promise<BillThread[]> {
    const { data, error } = await this.supabase.from('bill_threads').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  }

  async getBill(id: string): Promise<BillThread | null> {
    const { data, error } = await this.supabase.from('bill_threads').select('*').eq('id', id).single();
    if (error) console.error(error);
    return data || null;
  }

  async getProposals(): Promise<BillProposal[]> {
    const { data, error } = await this.supabase.from('proposals').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  }

  async createProposal(proposal: Partial<BillProposal>): Promise<BillProposal | null> {
    const { data, error } = await this.supabase.from('proposals').insert([proposal]).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data as BillProposal;
  }
}

export const billService = new BillService();