import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDashboard from "./PatientDashboard";

import { useAuth0 } from '@auth0/auth0-react';
import { useApiAuth } from '../../hooks/apiAuth';

jest.mock('@auth0/auth0-react');
jest.mock('../../hooks/apiAuth');

describe("Patient Dashboard - User Acceptance Tests", () => {
  const mockLogout = jest.fn();
  const mockApiFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth0.mockReturnValue({
      user: { sub: "auth0|12345" },
      logout: mockLogout,
    });

    useApiAuth.mockReturnValue({
      apiFetch: mockApiFetch,
    });

    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ name: "John Doe", surname: "Smith" }),
    });
  });

  test("Given the dashboard loads, Then the top navigation bar is displayed", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("heading", { name: /Clinics and Qs/i })).toBeInTheDocument(); 
    expect(screen.getByRole("button", { name: /HOME/i })).toBeInTheDocument();
  });

  test("Given the user is logged in, Then they see a personalized welcome message", async () => {
    render(<PatientDashboard />);
    
    expect(screen.getByText(/Welcome Back, ...!/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Welcome Back, John Doe!/i)).toBeInTheDocument();
    });
  });

  test("Given the user wants to book an appointment, Then the Book Appointment button is visible", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("button", { name: /BOOK AN APPOINTMENT/i })).toBeInTheDocument();
  });

  test("Given the dashboard loads, Then the notification panel is displayed", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("heading", { name: /Notifications/i })).toBeInTheDocument();
  });

  test("Given the user views the action grid, Then the core feature buttons are available", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("button", { name: /VIEW DETAILS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JOIN QUEUE/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CHECK STATUS/i })).toBeInTheDocument();
  });

  test("Given the component mounts, Then it fetches the user profile using the Auth0 ID", async () => {
    render(<PatientDashboard />);
    
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/auth0|12345"));
    });
  });

  test("Given the API fails to fetch the user, Then it gracefully defaults to the placeholder '...'", async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: false });
    
    render(<PatientDashboard />);
    
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });
    
    expect(screen.getByText(/Welcome Back, ...!/i)).toBeInTheDocument();
  });

  test("Given the user clicks logout, Then the Auth0 logout function is triggered", () => {
    render(<PatientDashboard />);
    
    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: "http://localhost" }
    });
  });

});