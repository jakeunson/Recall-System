import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-[120px] font-bold text-text-3/30 leading-none mb-4">404</div>
      <h2 className="text-2xl font-bold text-text-1 mb-3">페이지를 찾을 수 없습니다</h2>
      <p className="text-text-2 mb-8 max-w-md">
        요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
      </p>
      <Link href="/" className="btn-primary px-8">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
