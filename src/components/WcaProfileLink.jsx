import PropTypes from 'prop-types';

export function wcaProfileUrl(wcaId) {
  return `https://www.worldcubeassociation.org/persons/${encodeURIComponent(wcaId)}`;
}

export function WcaProfileLink({ wcaId, className = '', children }) {
  if (!wcaId) return null;

  return (
    <a
      href={wcaProfileUrl(wcaId)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children ?? wcaId}
    </a>
  );
}

WcaProfileLink.propTypes = {
  wcaId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
