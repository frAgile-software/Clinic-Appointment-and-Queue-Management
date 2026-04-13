import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Landing from './Landing';
import { MemoryRouter } from 'react-router';

const renderLanding = () => render(
  <MemoryRouter>
    <Landing />
  </MemoryRouter>
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

  test('renders a Signup button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
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



