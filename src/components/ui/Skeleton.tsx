interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = 4, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <thead>
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} style={{ padding: "0.75rem 1rem", textAlign: "left" }}>
              <Skeleton height={16} width={i === 0 ? 80 : 60} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
            {Array.from({ length: cols }).map((_, colIdx) => (
              <td key={colIdx} style={{ padding: "0.75rem 1rem" }}>
                <Skeleton height={18} width={colIdx === 0 ? "70%" : "50%"} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        padding: "1.25rem",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
      <Skeleton height={32} width="80%" />
    </div>
  );
}
