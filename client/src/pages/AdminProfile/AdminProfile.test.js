import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminProfile from "./AdminProfile";

import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '../../api/useApi';

jest.mock('@auth0/auth0-react');
jest.mock('../../api/useApi');

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe("Admin Profile - Component and Feature Tests", () => {
  const mockLogout = jest.fn();
  let mockApi;

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth0.mockReturnValue({
      user: { sub: "auth0|admin123" },
      logout: mockLogout,
    });

    mockApi = {
      users: {
        get: jest.fn().mockResolvedValue({
          name: "Jane",
          surname: "Doe",
          title: "Dr",
          email: "jane@example.com",
        }),
        update: jest.fn().mockResolvedValue({ message: "Updated" }),
      },
    };

    useApi.mockReturnValue(mockApi);
    window.alert = jest.fn();
  });

  const renderProfile = async () => {
    render(<AdminProfile />);
    await waitFor(() => {
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  };

  test("Given the profile loads, Then the user's details are displayed", async () => {
    await renderProfile();

    expect(screen.getByText("Dr")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  test("Given the profile is loading, Then a loading message is shown", async () => {
    mockApi.users.get.mockImplementation(() => new Promise(() => {}));
    render(<AdminProfile />);

    expect(screen.getByText(/Loading profile details/i)).toBeInTheDocument();
  });

  test("Given the profile fetch fails, Then an error is logged", async () => {
    mockApi.users.get.mockRejectedValue(new Error("Fetch error"));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<AdminProfile />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Could not fetch profile data:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  test("Given the component mounts, Then it fetches the profile using the Auth0 ID", async () => {
    await renderProfile();
    expect(mockApi.users.get).toHaveBeenCalledWith("auth0|admin123");
  });

  test("Given the user clicks Logout, Then the Auth0 logout function is triggered", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });

  test("Given the user clicks Back, Then they are navigated to the admin dashboard", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin");
  });

  test("Given the user clicks 'Update account details', Then the edit modal opens with pre-filled values", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));

    expect(screen.getByRole("heading", { name: /Edit Account Details/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dr")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
  });

  test("Given the edit modal is open, When the user clicks Cancel, Then the modal closes", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByRole("heading", { name: /Edit Account Details/i })).not.toBeInTheDocument();
  });

  test("Given the edit modal is open, When no changes are made and Save is clicked, Then an alert is shown", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    expect(window.alert).toHaveBeenCalledWith("No changes made.");
    expect(mockApi.users.update).not.toHaveBeenCalled();
  });

  test("Given the edit modal is open, When a field is changed and saved, Then the API is called with only the changed fields", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));

    const nameInput = screen.getByDisplayValue("Jane");
    fireEvent.change(nameInput, { target: { value: "Janet" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockApi.users.update).toHaveBeenCalledWith(
        "auth0|admin123",
        { name: "Janet" },
        null
      );
    });

    expect(window.alert).toHaveBeenCalledWith("Details updated successfully!");
  });

  test("Given the update fails, Then an error is logged", async () => {
    mockApi.users.update.mockRejectedValue(new Error("Update error"));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));

    const nameInput = screen.getByDisplayValue("Jane");
    fireEvent.change(nameInput, { target: { value: "Janet" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Update failed:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  test("Given the profile updates successfully, Then the displayed details reflect the changes", async () => {
    await renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /Update account details/i }));

    const nameInput = screen.getByDisplayValue("Jane");
    fireEvent.change(nameInput, { target: { value: "Janet" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Janet")).toBeInTheDocument();
    });
  });

  test("Given no user is logged in, Then the profile fetch is skipped", async () => {
    useAuth0.mockReturnValue({ user: null, logout: mockLogout });
    render(<AdminProfile />);

    expect(mockApi.users.get).not.toHaveBeenCalled();
  });
});