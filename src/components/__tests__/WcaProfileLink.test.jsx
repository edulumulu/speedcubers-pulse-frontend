import { render, screen } from '@testing-library/react';
import { WcaProfileLink, wcaProfileUrl } from '../WcaProfileLink.jsx';

describe('WcaProfileLink', () => {
  it('builds WCA profile URLs', () => {
    expect(wcaProfileUrl('2022LUCA04')).toBe('https://www.worldcubeassociation.org/persons/2022LUCA04');
  });

  it('opens the WCA profile in a new tab', () => {
    render(<WcaProfileLink wcaId="2022LUCA04" />);

    const link = screen.getByRole('link', { name: '2022LUCA04' });
    expect(link).toHaveAttribute('href', 'https://www.worldcubeassociation.org/persons/2022LUCA04');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
