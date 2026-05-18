import React from 'react';
import './Header.css';

export default function Header({ children }) {
  return (
    <header className="universal-header">
      {/* Branding Section */}
      <section className="header-branding">
        <img src="/logo.svg" alt="Clinics and Qs Logo" className="header-logo" />
        <span className="header-title">Clinics and Qs</span>
      </section>
      
      {/* Primary Navigation / Actions Slot */}
      <nav className="header-navigation" aria-label="Header actions">
        {children}
      </nav>
    </header>
  );
}