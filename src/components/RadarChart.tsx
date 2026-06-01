'use client';

import React, { useState } from 'react';
import { Indicator } from '@/lib/types';

interface RadarChartProps {
  indicators: Indicator[];
  isNeutralMode?: boolean; // 블라인드 토글 활성화 시 중립 회색 적용 여부
}

export default function RadarChart({ indicators, isNeutralMode = false }: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG 기본 설계 상수
  const size = 320;
  const center = size / 2;
  const maxRadius = 100;
  
  // 동적 다각형 축 레이아웃 계산 (N각형: 360도 / N 간격, 12시 방향부터 시계 방향으로 정렬)
  // 라디안 변환을 용이하게 하기 위해 각도를 라디안으로 맵핑 (-90도에서 시작하여 등분 각도씩 가산)
  const angleStep = 360 / indicators.length;
  const getCoordinates = (index: number, value: number) => {
    const angle = (index * angleStep - 90) * (Math.PI / 180);
    const radius = (value / 100) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // 배경 다각형 그리드 레벨 (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  // 메인 폴리곤 포인트 스트링 생성
  const polygonPoints = indicators
    .map((ind, i) => {
      const { x, y } = getCoordinates(i, ind.value);
      return `${x},${y}`;
    })
    .join(' ');

  // 각 지표의 축 끝점 좌표 (라벨 배치용 및 축 그리드선용)
  const axes = indicators.map((ind, i) => {
    const outerCoord = getCoordinates(i, 100);
    const labelCoord = getCoordinates(i, 120); // 텍스트 배치를 위해 바깥쪽으로 배치
    return { outerCoord, labelCoord, label: ind.label, value: ind.value };
  });

  // 색상 테마 정의
  const mainColor = isNeutralMode ? '#737373' : 'var(--accent)';
  const fillColor = isNeutralMode ? 'rgba(115, 115, 115, 0.15)' : 'rgba(13, 148, 136, 0.18)';

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        
        {/* Concentric grid lines (Concentric Hexagons) */}
        {gridLevels.map((level) => {
          const points = indicators
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.8"
              strokeDasharray={level === 100 ? '0' : '3 3'}
            />
          );
        })}

        {/* 100% 그리드 원형 점선 및 6대 축 라인 */}
        {axes.map((axis, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={axis.outerCoord.x}
            y2={axis.outerCoord.y}
            stroke="var(--border)"
            strokeWidth="0.8"
          />
        ))}

        {/* 배경 그리드 수치 레벨 표시 (20, 40, 60, 80, 100) */}
        {gridLevels.map((level) => {
          const { x, y } = getCoordinates(0, level); // 12시 방향 그리드선 상에 레벨값 표시
          return (
            <text
              key={level}
              x={x + 4}
              y={y + 3}
              fill="var(--text-3)"
              fontSize="8px"
              fontWeight="bold"
              fontFamily="var(--font-mono)"
            >
              {level}%
            </text>
          );
        })}

        {/* 데이터 영역 다각형 (Data Polygon Area) */}
        <polygon
          points={polygonPoints}
          fill={fillColor}
          stroke={mainColor}
          strokeWidth="2.5"
          style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* 데이터 꼭짓점들 (Data Dots) 및 인터랙티브 호버 스폿 */}
        {indicators.map((ind, i) => {
          const { x, y } = getCoordinates(i, ind.value);
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              {/* 꼭짓점 동그라미 */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="var(--bg)"
                stroke={mainColor}
                strokeWidth={isHovered ? 3 : 2}
                style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          );
        })}

        {/* 6대 지표 라벨 (Labels) */}
        {axes.map((axis, i) => {
          const isHovered = hoveredIndex === i;
          
          // 라벨 정렬용 조율
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          let dy = '0.35em';
          
          if (axis.labelCoord.x < center - 10) {
            textAnchor = 'end';
          } else if (axis.labelCoord.x > center + 10) {
            textAnchor = 'start';
          }
          
          if (axis.labelCoord.y < center - 10) {
            dy = '-0.2em';
          } else if (axis.labelCoord.y > center + 10) {
            dy = '0.8em';
          }

          return (
            <text
              key={i}
              x={axis.labelCoord.x}
              y={axis.labelCoord.y}
              textAnchor={textAnchor}
              dy={dy}
              fill={isHovered ? mainColor : 'var(--text-2)'}
              fontSize="11px"
              fontWeight={isHovered ? 800 : 700}
              style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      {/* 꼭짓점 혹은 지표 호버 시 표시할 툴팁 오버레이 */}
      {hoveredIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: `1px solid ${mainColor}50`,
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 600, marginBottom: '2px' }}>
            {indicators[hoveredIndex].label}
          </div>
          <span style={{ color: mainColor, fontSize: '13px' }}>
            {indicators[hoveredIndex].value}%
          </span>
        </div>
      )}
    </div>
  );
}
