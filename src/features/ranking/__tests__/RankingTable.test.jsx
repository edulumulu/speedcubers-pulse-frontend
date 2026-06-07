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
    dnf_count: 3,
    pb_time: 8.43,
    average_time: 12.7,
    wca_id: '2022TEST01',
    wca_ranking: { rank: 150, average: 9.5 },
  },
  {
    position: 2,
    userId: 'u2',
    username: 'midplayer',
    elo: 1000,
    wins: 10,
    losses: 10,
    dnf_count: 0,
    pb_time: null,
    average_time: null,
    wca_id: null,
    wca_ranking: null,
  },
];

describe('RankingTable', () => {
  it('renders empty message when no rows', () => {
    renderWithProviders(<RankingTable rows={[]} event="3x3" />);
    expect(screen.getByText(/no hay competidores/i)).toBeInTheDocument();
  });

  it('renders all rows with correct data', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    expect(screen.getByText('topplayer')).toBeInTheDocument();
    expect(screen.getByText('midplayer')).toBeInTheDocument();
    expect(screen.getByText('1247')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('shows WCA ID next to username when present', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    expect(screen.getByText('(2022TEST01)')).toBeInTheDocument();
  });

  it('shows WCA ranking badge when wca_ranking is available', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    expect(screen.getByText('WCA #150')).toBeInTheDocument();
  });

  it('formats null pb_time as dash', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    // midplayer has null pb_time — two dashes (pb and average)
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('formats pb_time with 2 decimal places', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    expect(screen.getByText('8.43s')).toBeInTheDocument();
  });

  it('username links to user profile page', () => {
    renderWithProviders(<RankingTable rows={sampleRows} event="3x3" />);
    const link = screen.getByRole('link', { name: /topplayer/i });
    expect(link).toHaveAttribute('href', '/users/topplayer');
  });
});
