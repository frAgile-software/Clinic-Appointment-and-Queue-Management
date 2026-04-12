import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from './Landing';

const renderLanding = () =>
  render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );


describe('Layout', () => {
  test('renders the site name', () => {
    renderLanding();
    expect(screen.getByText(/cliniq/i)).toBeInTheDocument();
  });

  test('renders a Login button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders a Register button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('Login button links to /login', () => {
    renderLanding();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  test('Register button links to /register', () => {
    renderLanding();
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  test('renders the hero heading', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('renders the search input', () => {
    renderLanding();
    expect(screen.getByPlaceholderText(/search clinics/i)).toBeInTheDocument();
  });

  test('renders the search button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

 
});



