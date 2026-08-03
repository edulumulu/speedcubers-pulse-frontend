import PropTypes from 'prop-types';
import '@cubing/icons/css';

const CUBING_ICON_CLASS_BY_EVENT = {
  '2x2': 'event-222',
  '3x3': 'event-333',
  '4x4': 'event-444',
  '5x5': 'event-555',
  '6x6': 'event-666',
  '7x7': 'event-777',
  oh: 'event-333oh',
  pyraminx: 'event-pyram',
  skewb: 'event-skewb',
  megaminx: 'event-minx',
  fto: 'unofficial-fto',
};

export function EventIcon({ event, className = '' }) {
  const iconClass = CUBING_ICON_CLASS_BY_EVENT[event];
  if (iconClass) {
    return (
      <span
        aria-hidden="true"
        className={`cubing-icon ${iconClass} inline-grid h-full w-full place-items-center leading-none ${className}`}
      />
    );
  }

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
