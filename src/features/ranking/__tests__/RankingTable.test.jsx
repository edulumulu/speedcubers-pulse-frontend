import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { RankingTable } from '../RankingTable.jsx';

const sampleRows = [
  {
    position: 1,
    userId: 'u1',
    username: 'topplayer',
    elo: 1247,
    wins: 38,
    losses: 14,
    pb_time: 8.43,
    average_time: 12.7,
    wca_id: '2022TEST01',
    wca_ranking: { rank: 32158, average: 11.37 },
  },
  {
    position: 2,
    userId: 'u2',
    username: 'midplayer',
    elo: 1000,
    wins: 10,
    losses: 10,
    pb_time: null,
    average_time: null,
    wca_id: null,
    wca_ranking: null,
  },
];

describe('RankingTable', () => {
  it('renders empty message when no rows', () => {
    renderWithProviders(<RankingTable rows={[]} />);
    expect(screen.getByText(/no hay competidores/i)).toBeInTheDocument();
  });

  it('renders all rows', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    expect(screen.getByText('topplayer')).toBeInTheDocument();
    expect(screen.getByText('midplayer')).toBeInTheDocument();
  });

  it('shows Elo values', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    expect(screen.getByText('1247')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('shows WCA ID below username when present', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    const link = screen.getByRole('link', { name: '2022TEST01' });
    expect(link).toHaveAttribute('href', 'https://www.worldcubeassociation.org/persons/2022TEST01');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows WCA rank when wca_ranking is available', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    expect(screen.getByText('#32,158')).toBeInTheDocument();
  });

  it('shows dash when wca_ranking is null', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('formats pb_time with 2 decimal places', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    expect(screen.getByText('8.43s')).toBeInTheDocument();
  });

  it('shows dash for null pb_time', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('username links to user profile', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    const link = screen.getByRole('link', { name: /topplayer/i });
    expect(link).toHaveAttribute('href', '/users/topplayer');
  });

  it('shows win/loss chips', () => {
    renderWithProviders(<RankingTable rows={sampleRows} />);
    expect(screen.getByText('38V')).toBeInTheDocument();
    expect(screen.getByText('14D')).toBeInTheDocument();
  });
});
