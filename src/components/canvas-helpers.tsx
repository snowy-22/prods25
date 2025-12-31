'use client';

import React from 'react';
import { AlignmentGuide, measureDistance } from '@/lib/layout-engine';

interface CanvasHelpersProps {
  alignmentGuides: AlignmentGuide[];
  selectedItems: Array<{ x: number; y: number; width: number; height: number; id: string }>;
  showMeasurements?: boolean;
  showGrid?: boolean;
  gridSize?: number;
}

export function CanvasHelpers({
  alignmentGuides,
  selectedItems,
  showMeasurements = true,
  showGrid = false,
  gridSize = 16
}: CanvasHelpersProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {/* Grid Background */}
      {showGrid && (
        <defs>
          <pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
      )}
      {showGrid && (
        <rect width="100%" height="100%" fill="url(#grid)" />
      )}

      {/* Alignment Guides - Vertical */}
      {alignmentGuides
        .filter(g => g.type === 'vertical')
        .map((guide, idx) => (
          <line
            key={`v-guide-${idx}`}
            x1={guide.position}
            y1="0"
            x2={guide.position}
            y2="100%"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.7"
          />
        ))}

      {/* Alignment Guides - Horizontal */}
      {alignmentGuides
        .filter(g => g.type === 'horizontal')
        .map((guide, idx) => (
          <line
            key={`h-guide-${idx}`}
            x1="0"
            y1={guide.position}
            x2="100%"
            y2={guide.position}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.7"
          />
        ))}

      {/* Distance Measurements */}
      {showMeasurements && selectedItems.length > 1 && (
        <>
          {selectedItems.map((item1, i) =>
            selectedItems.slice(i + 1).map((item2, j) => {
              const distance = measureDistance(
                { x: item1.x, y: item1.y },
                { x: item2.x, y: item2.y }
              );

              const midX = (item1.x + item2.x) / 2;
              const midY = (item1.y + item2.y) / 2;

              return (
                <g key={`distance-${i}-${j}`}>
                  {/* Distance Line */}
                  <line
                    x1={item1.x + item1.width / 2}
                    y1={item1.y + item1.height / 2}
                    x2={item2.x + item2.width / 2}
                    y2={item2.y + item2.height / 2}
                    stroke="#10b981"
                    strokeWidth="1"
                    opacity="0.5"
                  />

                  {/* Distance Label */}
                  <g>
                    <rect
                      x={midX - 30}
                      y={midY - 12}
                      width="60"
                      height="24"
                      fill="white"
                      stroke="#10b981"
                      strokeWidth="1"
                      rx="4"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#10b981"
                      fontWeight="bold"
                    >
                      {Math.round(distance)}px
                    </text>
                  </g>
                </g>
              );
            })
          )}
        </>
      )}

      {/* Selection Boxes with Measurements */}
      {selectedItems.map((item, idx) => (
        <g key={`item-box-${idx}`}>
          {/* Box */}
          <rect
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Dimension Labels */}
          {showMeasurements && (
            <>
              {/* Width */}
              <g>
                <line
                  x1={item.x}
                  y1={item.y - 20}
                  x2={item.x + item.width}
                  y2={item.y - 20}
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <text
                  x={item.x + item.width / 2}
                  y={item.y - 24}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#f59e0b"
                >
                  {Math.round(item.width)}px
                </text>
              </g>

              {/* Height */}
              <g>
                <line
                  x1={item.x - 20}
                  y1={item.y}
                  x2={item.x - 20}
                  y2={item.y + item.height}
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <text
                  x={item.x - 24}
                  y={item.y + item.height / 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#f59e0b"
                  transform={`rotate(-90 ${item.x - 24} ${item.y + item.height / 2})`}
                >
                  {Math.round(item.height)}px
                </text>
              </g>
            </>
          )}

          {/* Corners */}
          <circle cx={item.x} cy={item.y} r="3" fill="#3b82f6" />
          <circle cx={item.x + item.width} cy={item.y} r="3" fill="#3b82f6" />
          <circle cx={item.x} cy={item.y + item.height} r="3" fill="#3b82f6" />
          <circle cx={item.x + item.width} cy={item.y + item.height} r="3" fill="#3b82f6" />
        </g>
      ))}
    </svg>
  );
}

// Flow Chart Connection Line Component
interface FlowChartArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  type?: 'success' | 'error' | 'condition' | 'default';
}

export function FlowChartArrow({
  fromX,
  fromY,
  toX,
  toY,
  label,
  type = 'default'
}: FlowChartArrowProps) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    condition: '#f59e0b',
    default: '#6b7280'
  };

  const color = colors[type];
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  // Calculate arrow angle
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowSize = 10;

  return (
    <g>
      {/* Connection Line */}
      <path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY - 30} ${toX} ${toY}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#arrow-${type})`}
      />

      {/* Label */}
      {label && (
        <g>
          <rect
            x={midX - 30}
            y={midY - 32}
            width="60"
            height="20"
            fill="white"
            stroke={color}
            strokeWidth="1"
            rx="3"
          />
          <text
            x={midX}
            y={midY - 17}
            textAnchor="middle"
            fontSize="12"
            fill={color}
            fontWeight="600"
          >
            {label}
          </text>
        </g>
      )}

      {/* Arrow Marker Definition */}
      <defs>
        <marker
          id={`arrow-${type}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>
    </g>
  );
}
