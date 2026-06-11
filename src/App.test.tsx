import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App', () => {
  it('renders the Screenie inbox shell', () => {
    render(<App />);

    expect(screen.getByRole('main', { name: /screenie app/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /capture workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste link/i })).toBeInTheDocument();
  });

  it('navigates to Find and returns seeded pricing results', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Find' }));
    await user.type(screen.getByRole('textbox', { name: /search everything/i }), 'pricing pro plan');

    expect(
      await screen.findByRole('heading', { name: /pricing screenshot/i }, { timeout: 5000 })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeInTheDocument();
  });
});
