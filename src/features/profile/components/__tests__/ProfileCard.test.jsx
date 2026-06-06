import { render, screen } from '@testing-library/react';
import { ProfileCard } from '../ProfileCard.jsx';

describe('ProfileCard', () => {
  it('renders nothing when profile is null', () => {
    const { container } = render(<ProfileCard profile={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders username', () => {
    render(<ProfileCard profile={{ username: 'speedcuber99' }} />);
    expect(screen.getByText('speedcuber99')).toBeInTheDocument();
  });

  it('renders WCA ID when present', () => {
    render(<ProfileCard profile={{ username: 'alice', wcaId: '2022LUCA04' }} />);
    expect(screen.getByText('2022LUCA04')).toBeInTheDocument();
  });

  it('does not render WCA ID section when wcaId is null', () => {
    render(<ProfileCard profile={{ username: 'alice', wcaId: null }} />);
    expect(screen.queryByText(/LUCA/)).not.toBeInTheDocument();
  });

  it('renders country when wca.country is present', () => {
    render(
      <ProfileCard
        profile={{
          username: 'alice',
          wcaId: '2022LUCA04',
          wca: { country: 'Spain', name: 'Alice Luca' },
        }}
      />,
    );
    expect(screen.getByText('Spain')).toBeInTheDocument();
  });

  it('renders WCA name when wca.name is present', () => {
    render(
      <ProfileCard
        profile={{
          username: 'alice',
          wca: { name: 'Alice Luca', country: null },
        }}
      />,
    );
    expect(screen.getByText('Alice Luca')).toBeInTheDocument();
  });

  it('renders memberSince when createdAt is provided', () => {
    render(
      <ProfileCard
        profile={{ username: 'alice', createdAt: '2024-01-15T00:00:00.000Z' }}
      />,
    );
    expect(screen.getByText(/Miembro desde/)).toBeInTheDocument();
  });
});
