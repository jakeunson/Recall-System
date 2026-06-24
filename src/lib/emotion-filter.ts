/**
 * Political OS 감정 단어 필터
 *
 * 게시물 작성 시 감정 자극 단어를 감지하여 사용자에게 수정을 유도합니다.
 * design.md §8 "금지 패턴"의 콘텐츠 규칙 기반.
 */

const EMOTION_WORDS = [
  // 분노·혐오 계열
  '분노', '배신', '적폐', '쓰레기', '거짓말쟁이', '반역자', '매국',
  '독재', '빨갱이', '수꼴', '한남', '페미',
  // 선동 계열
  '퇴진', '탄핵하라', '감옥', '구속해라', '처단',
  // 극단 표현
  '혐오스럽다', '최악', '역겹다', '구역질',
] as const;

export interface EmotionFilterResult {
  hasEmotionWords: boolean;
  detectedWords: string[];
  warningMessage: string;
}

/**
 * 텍스트에서 감정 자극 단어를 감지합니다.
 */
export function detectEmotionWords(text: string): EmotionFilterResult {
  const detectedWords = EMOTION_WORDS.filter((word) => text.includes(word));
  const hasEmotionWords = detectedWords.length > 0;

  return {
    hasEmotionWords,
    detectedWords,
    warningMessage: hasEmotionWords
      ? `감정 자극 표현이 감지되었습니다: "${detectedWords.join('", "')}". 팩트와 근거 중심으로 수정해주세요.`
      : '',
  };
}

/**
 * 텍스트에 감정 자극 단어가 포함되어 있는지 간단히 확인합니다.
 */
export function hasEmotionLanguage(text: string): boolean {
  return EMOTION_WORDS.some((word) => text.includes(word));
}

/**
 * 출처 URL이 유효한 형식인지 검증합니다.
 */
export function isValidSourceUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 게시물 유효성 검사 (출처 필수 + 감정 단어 검사)
 */
export interface PostValidationResult {
  isValid: boolean;
  errors: string[];
  emotionWarning: string;
}

export function validatePost(params: {
  content: string;
  sourceUrl?: string;
  requireSource?: boolean;
}): PostValidationResult {
  const { content, sourceUrl, requireSource = true } = params;
  const errors: string[] = [];

  if (!content || content.trim().length < 10) {
    errors.push('내용을 10자 이상 입력해주세요.');
  }

  if (requireSource && (!sourceUrl || !isValidSourceUrl(sourceUrl))) {
    errors.push('출처 URL을 입력해주세요 (출처가 없으면 "[미검증]" 태그가 붙습니다).');
  }

  const emotionResult = detectEmotionWords(content);

  return {
    isValid: errors.length === 0,
    errors,
    emotionWarning: emotionResult.warningMessage,
  };
}