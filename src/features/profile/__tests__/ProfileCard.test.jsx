import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ProfileCard } from '../components/ProfileCard.jsx';

describe('ProfileCard', () => {
  it('renders nothing when profile is null', () => {
    const { container } = renderWithProviders(<ProfileCard profile={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders username', () => {
    renderWithProviders(<ProfileCard profile={{ username: 'edulumulu' }} />);
    expect(screen.getByText('edulumulu')).toBeInTheDocument();
  });

  it('renders member since date when createdAt is provided', () => {
    renderWithProviders(<ProfileCard profile={{ username: 'edulumulu', createdAt: '2024-01-15T10:00:00Z' }} />);
    expect(screen.getByText(/Miembro desde/)).toBeInTheDocument();
  });

  it('does not render member since when createdAt is missing', () => {
    renderWithProviders(<ProfileCard profile={{ username: 'edulumulu' }} />);
    expect(screen.queryByText(/Miembro desde/)).not.toBeInTheDocument();
  });

  it('renders WCA badge when wcaId is present', () => {
    renderWithProviders(<ProfileCard profile={{ username: 'edulumulu', wcaId: '2022LUCA04', wca: { countryIso2: 'ES' } }} />);
    expect(screen.getByText('2022LUCA04')).toBeInTheDocument();
  });

  it('renders WCA live data when wca object has name and country', () => {
    renderWithProviders(<ProfileCard profile={{
      username: 'edulumulu',
      wcaId: '2022LUCA04',
      wca: { name: 'Eduardo Lucas', country: 'Spain', countryIso2: 'ES' },
    }} />);
    expect(screen.getByText('Eduardo Lucas')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
  });

  it('renders WCA section without name/country when fields are missing', () => {
    renderWithProviders(<ProfileCard profile={{
      username: 'edulumulu',
      wcaId: '2022LUCA04',
      wca: { countryIso2: 'ES' },
    }} />);
    expect(screen.queryByText(/Nombre WCA/)).not.toBeInTheDocument();
  });

  it('does not render flag when countryIso2 is missing', () => {
    renderWithProviders(<ProfileCard profile={{ username: 'edulumulu', wcaId: '2022LUCA04', wca: {} }} />);
    expect(screen.getByText('2022LUCA04')).toBeInTheDocument();
  });
});
