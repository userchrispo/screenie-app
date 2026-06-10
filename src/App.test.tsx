import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the Screenie inbox shell', () => {
    render(<App />);

    expect(screen.getByRole('main', { name: /screenie app/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /capture anything/i })).toBeInTheDocument();
  });
});
