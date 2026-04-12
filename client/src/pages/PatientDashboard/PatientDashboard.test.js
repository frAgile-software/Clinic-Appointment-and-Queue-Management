import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDashboard from "./PatientDashboard";

describe("Patient Dashboard - User Acceptance Tests", () => {
  
  // Tests if the basic layout renders correctly
  test("Given the dashboard loads, Then the top navigation bar is displayed", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("banner")).toBeInTheDocument(); // Checks for <header>
    expect(screen.getByRole("button", { name: /HOME/i })).toBeInTheDocument();
  });

  // Tests the personal greeting
  test("Given the user is logged in, Then they see a personalized welcome message", () => {
    render(<PatientDashboard />);
    expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
  });

  // Tests the primary call to action
  test("Given the user wants to book an appointment, Then the Book Appointment button is visible", () => {
    render(<PatientDashboard />);
    const bookBtn = screen.getByRole("button", { name: /BOOK AN APPOINTMENT/i });
    expect(bookBtn).toBeInTheDocument();
  });

  // Tests the presence of the notification area
  test("Given the user has alerts, Then the notification panel displays their messages", () => {
    render(<PatientDashboard />);
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/Your appointment is confirmed/i)).toBeInTheDocument();
  });

  // Tests the interactive grid cards
  test("Given the user views the action grid, Then the core feature buttons are available", () => {
    render(<PatientDashboard />);
    expect(screen.getByRole("button", { name: /VIEW DETAILS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /JOIN QUEUE/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CHECK STATUS/i })).toBeInTheDocument();
  });
});