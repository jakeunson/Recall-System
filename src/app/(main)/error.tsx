'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-1 mb-2">오류가 발생했습니다</h2>
      <p className="text-text-2 mb-8 max-w-md">
        페이지를 불러오는 중 예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          다시 시도
        </button>
        <Link href="/" className="btn-secondary">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
