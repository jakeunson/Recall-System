import { BaseService } from './base.service';
import type { PublicQuestion, BlindQuiz } from '../types';

export class RecallService extends BaseService {
  async getQuestions(): Promise<PublicQuestion[]> {
    const { data, error } = await this.supabase.from('questions').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  }

  async getQuizzes(): Promise<BlindQuiz[]> {
    const { data, error } = await this.supabase.from('quizzes').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  }

  async createQuestion(question: Partial<PublicQuestion>): Promise<PublicQuestion | null> {
    const { data, error } = await this.supabase.from('questions').insert([question]).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data as PublicQuestion;
  }

  async updateQuizVote(quizId: string, voteType: 'agree' | 'disagree' | 'hold', currentCount: number) {
    const updatePayload: Record<string, number> = {};
    if (voteType === 'agree') updatePayload.agreeCount = currentCount + 1;
    if (voteType === 'disagree') updatePayload.disagreeCount = currentCount + 1;
    if (voteType === 'hold') updatePayload.holdCount = currentCount + 1;

    const { error } = await this.supabase.from('quizzes').update(updatePayload).eq('id', quizId);
    if (error) console.error(error);
    return !error;
  }
}

export const recallService = new RecallService();