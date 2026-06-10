import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the Screenie foundation', () => {
    render(<App />);

    expect(screen.getByRole('main', { name: /screenie app/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /saved content/i })).toBeInTheDocument();
  });
});
