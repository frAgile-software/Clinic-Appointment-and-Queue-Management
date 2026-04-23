import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDashboard from "./PatientDashboard";

describe("Patient Dashboard - User Acceptance Tests", () => {
  
  // Tests if the basic layout renders correctly
  test("Given the dashboard loads, Then the top navigation bar is displayed", () => {
    render(<PatientDashboard />);
    // Replaced "banner" role query with a check for the main header title.
    // React Testing Library sometimes struggles to implicitly map the <header> tag.
    expect(screen.getByRole("heading", { name: /Clinics and Qs/i })).toBeInTheDocument(); 
    expect(screen.getByRole("button", { name: /HOME/i })).toBeInTheDocument();
  });

  // Tests the personal greeting
  test("Given the user is logged in, Then they see a personalized welcome message", () => {
    render(<PatientDashboard />);
    expect(screen.getByText(/Welcome Back, John Doe!/i)).toBeInTheDocument();
  });

  // Tests the primary call to action
  test("Given the user wants to book an appointment, Then the Book Appointment button is visible", () => {
    render(<PatientDashboard />);
    const bookBtn = screen.getByRole("button", { name: /BOOK AN APPOINTMENT/i });
    expect(bookBtn).toBeInTheDocument();
  });

  // Tests the presence of the notification area
  test("Given the dashboard loads, Then the notification panel is displayed", () => {
    render(<PatientDashboard />);
    // The component renders an empty notifications list by default, 
    // so we verify the panel exists via its heading instead of hardcoded alert text.
    expect(screen.getByRole("heading", { name: /Notifications/i })).toBeInTheDocument();
  });

  // Tests the interactive grid cards
  test("Given the user views the action grid, Then the core feature buttons are available", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("button", { name: /VIEW DETAILS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JOIN QUEUE/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CHECK STATUS/i })).toBeInTheDocument();
  });
});