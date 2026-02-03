interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = 4, style }: SkeletonProps) {
  return (
    <div
      className="skeleton-bar"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton height={16} width={i === 0 ? 80 : 60} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton height={18} width={colIdx === 0 ? "70%" : "50%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
      <Skeleton height={32} width="80%" />
    </div>
  );
}
