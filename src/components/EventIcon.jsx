import PropTypes from 'prop-types';

const CUBE_EVENT_CELLS = {
  '2x2': 2,
  '3x3': 3,
  '4x4': 4,
  '5x5': 5,
  '6x6': 6,
  '7x7': 7,
};

function CubeGridIcon({ cells }) {
  const size = 500;
  const margin = cells >= 6 ? 22 : 30;
  const gap = cells >= 6 ? 20 : cells >= 5 ? 28 : 36;
  const cellSize = (size - margin * 2 - gap * (cells - 1)) / cells;
  const squares = Array.from({ length: cells * cells }, (_, index) => {
    const row = Math.floor(index / cells);
    const column = index % cells;
    return {
      id: `${row}-${column}`,
      x: margin + column * (cellSize + gap),
      y: margin + row * (cellSize + gap),
    };
  });

  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      {squares.map((square) => (
        <rect
          key={square.id}
          x={square.x}
          y={square.y}
          width={cellSize}
          height={cellSize}
        />
      ))}
    </svg>
  );
}

CubeGridIcon.propTypes = {
  cells: PropTypes.number.isRequired,
};

function PyraminxIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <g clipRule="evenodd" fillRule="evenodd">
        <path d="m250.011 71.163c20.532 35.558 40.61 70.329 60.917 105.497-40.682 0-80.999 0-121.824 0 20.215-35.015 40.325-69.848 60.907-105.497z" />
        <path d="m98.746 333.155c20.443 35.413 40.466 70.099 60.748 105.233-40.658 0-80.703 0-121.493 0 20.275-35.124 40.326-69.861 60.745-105.233z" />
        <path d="m401.275 333.155c20.408 35.349 40.43 70.036 60.725 105.19-40.625 0-80.668 0-121.439 0 20.216-35.027 40.267-69.765 60.714-105.19z" />
        <path d="m189.235 438.43c20.374-35.287 40.388-69.953 60.733-105.188 20.383 35.302 40.432 70.026 60.732 105.188-40.684 0-80.713 0-121.465 0z" />
        <path d="m189.222 193.807h121.481c-20.283 35.137-40.336 69.875-60.733 105.213-20.347-35.242-40.372-69.922-60.748-105.213z" />
        <path d="m264.949 307.287c20.256-35.079 40.248-69.701 60.699-105.119 20.459 35.437 40.449 70.061 60.688 105.119-40.684 0-80.705 0-121.387 0z" />
        <path d="m325.604 430.023c-20.439-35.398-40.402-69.979-60.631-105.014h121.252c-20.19 34.971-40.155 69.557-60.621 105.014z" />
        <path d="m235.007 307.329c-40.677 0-80.64 0-121.344 0 20.236-35.051 40.229-69.681 60.671-105.088 20.427 35.38 40.421 70.01 60.673 105.088z" />
        <path d="m113.753 324.944h121.242c-20.21 35.009-40.162 69.573-60.61 104.995-20.35-35.242-40.335-69.849-60.632-104.995z" />
      </g>
    </svg>
  );
}

function SkewbIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <path d="m215.48131-138.07208h276.13837v276.13837h-276.13837z" strokeWidth=".955982" transform="matrix(.70710678 .70710678 -.70710678 .70710678 0 0)" />
      <path d="m43 43.5h187.5l-187.5 187.5z" />
      <path d="m43 456.5v-187.5l187.5 187.5z" />
      <path d="m457 456.5h-187.5l187.5-187.5z" />
      <path d="m457 43.5v187.5l-187.5-187.5z" />
    </svg>
  );
}

function OneHandedIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <path clipRule="evenodd" d="m298.473 332.997c0-2.802 0-5.242 0-8.212-14.722 0-29.174.015-43.626-.003-19.157-.023-38.316.072-57.472-.166-10.302-.129-18.292-7.216-20.328-17.286-1.853-9.163 3.034-19.079 12.012-22.986 3.381-1.472 7.402-2.037 11.135-2.051 40.813-.139 81.629.009 122.443-.161 9.123-.038 15.375 4.223 21.629 10.393 25.26 24.919 50.955 49.397 76.488 74.041 3.596 3.471 6.904 7.313 10.838 10.345 6.215 4.787 8.258 10.58 8.043 18.449-.553 20.143-.186 40.312-.184 60.47v8.481c-9.523-9.161-17.688-17.688-26.564-25.398-13.682-11.885-27.795-23.277-41.836-34.744-8.523-6.962-18.785-9.397-29.422-9.31-23.133.192-46.261 1.237-69.394 1.434-28.321.242-56.652-.366-84.968.079-12.632.199-23.001-4.502-31.481-12.761-29.835-29.058-59.207-58.59-88.763-87.933-6.604-6.557-8.228-14.462-5.22-22.947 2.912-8.216 9.268-12.885 18.003-13.75 6.879-.682 12.596 2 17.604 6.694 19.688 18.456 39.46 36.825 59.202 55.224 3.777 3.521 7.468 7.144 11.396 10.486 1.268 1.08 3.166 2.005 4.778 2.009 41.318.085 82.636.04 123.953.002.472 0 .942-.21 1.734-.399z" fillRule="evenodd" />
      <path d="m131.259 43.322h55.921v55.921h-55.921z" />
      <path d="m209.549 43.322h55.921v55.921h-55.921z" />
      <path d="m287.838 43.322h55.922v55.921h-55.922z" />
      <path d="m131.539 121.612h55.921v55.921h-55.921z" />
      <path d="m209.828 121.612h55.922v55.921h-55.922z" />
      <path d="m288.117 121.612h55.922v55.921h-55.922z" />
      <path d="m131.679 199.901h55.921v55.921h-55.921z" />
      <path d="m209.968 199.901h55.92v55.921h-55.92z" />
      <path d="m288.258 199.901h55.92v55.921h-55.92z" />
    </svg>
  );
}

export function EventIcon({ event, className = '' }) {
  const cells = CUBE_EVENT_CELLS[event];
  if (cells) {
    return (
      <span className={`block h-full w-full ${className}`}>
        <CubeGridIcon cells={cells} />
      </span>
    );
  }
  if (event === 'pyraminx') return <span className={`block h-full w-full ${className}`}><PyraminxIcon /></span>;
  if (event === 'skewb') return <span className={`block h-full w-full ${className}`}><SkewbIcon /></span>;
  if (event === 'oh') return <span className={`block h-full w-full ${className}`}><OneHandedIcon /></span>;

  return (
    <span className={`grid h-full w-full place-items-center font-mono text-xl font-semibold ${className}`}>
      {event}
    </span>
  );
}

EventIcon.propTypes = {
  event: PropTypes.string.isRequired,
  className: PropTypes.string,
};
