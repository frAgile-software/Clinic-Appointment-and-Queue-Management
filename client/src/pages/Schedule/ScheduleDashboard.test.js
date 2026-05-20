

import React from "react";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScheduleDashboard from "./ScheduleDashboard";
 
import { useAuth0 } from "@auth0/auth0-react";
import { useApi } from "../../api/useApi";
import { MemoryRouter } from 'react-router';
 
jest.mock("@auth0/auth0-react");
jest.mock("../../api/useApi");
jest.mock("./ScheduleDashboard.css", () => ({}), { virtual: true });
 
const STAFF_ID = "auth0|staff-001";
 
const mockClinic = {
  practiceTimes: { open: "08:00", close: "12:00" },
};
 
const mockScheduleBlock = {
  _id: "block-001",
  DayOfWeek: 1,
  StartTime: "09:00:00",
  EndTime: "10:00:00",
};
 
function buildApi(overrides = {}) {
  return {
    clinics: {
      getAssignedClinics: jest.fn().mockResolvedValue([mockClinic]),
      ...overrides.clinics,
    },
    schedules: {
      getSchedule: jest.fn().mockResolvedValue({ schedule: [mockScheduleBlock] }),
      create: jest.fn().mockResolvedValue({
        schedule: {
          _id: "block-new",
          DayOfWeek: 1,
          StartTime: "08:00:00",
          EndTime: "09:00:00",
        },
      }),
      delete: jest.fn().mockResolvedValue({ message: "Deleted" }),
      ...overrides.schedules,
    },
  };
}
 
async function renderComponent(api) {
  render(
    <MemoryRouter>
      <ScheduleDashboard />
    </MemoryRouter>
  );
  await waitFor(() =>
    expect(screen.queryByText(/Loading your schedule/i)).not.toBeInTheDocument()
  );
}
 
describe("ScheduleDashboard component", () => {
  let mockApi;
 
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
 
    useAuth0.mockReturnValue({ user: { sub: STAFF_ID } });
 
    mockApi = buildApi();
    useApi.mockReturnValue(mockApi);
  });
 
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
 
  describe("Loading state", () => {
    test("Given the component mounts, Then a loading spinner is shown initially", () => {
      mockApi.clinics.getAssignedClinics.mockReturnValue(new Promise(() => {}));
      useApi.mockReturnValue(mockApi);
 
      render(
  <MemoryRouter>
    <ScheduleDashboard />
  </MemoryRouter>
);
      expect(screen.getByText(/Loading your schedule/i)).toBeInTheDocument();
    });
 
    test("Given data loads, Then the loading spinner disappears", async () => {
      await renderComponent(mockApi);
      expect(screen.queryByText(/Loading your schedule/i)).not.toBeInTheDocument();
    });
  });
 
  describe("Header and layout", () => {
    test("Given the page renders, Then the brand name is shown", async () => {
      await renderComponent(mockApi);
      expect(screen.getByText(/Clinics and Qs/i)).toBeInTheDocument();
    });
 
    test("Given the page renders, Then the hero title 'Edit Your Schedule' is shown", async () => {
      await renderComponent(mockApi);
      expect(
        screen.getByRole("heading", { name: /Edit Your Schedule/i })
      ).toBeInTheDocument();
    });
 
    test("Given the page renders, Then the 'Weekly Availability' section heading is shown", async () => {
      await renderComponent(mockApi);
      expect(screen.getByText(/Weekly Availability/i)).toBeInTheDocument();
    });
 
    test("Given the back button is clicked, Then window.history.back is called", async () => {
      const backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});
      await renderComponent(mockApi);
 
      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(backSpy).toHaveBeenCalled();
    });
  });
 
  describe("Data fetching", () => {
    test("Given the component mounts, Then it fetches the assigned clinics for the staff member", async () => {
      await renderComponent(mockApi);
      expect(mockApi.clinics.getAssignedClinics).toHaveBeenCalledWith(STAFF_ID);
    });
 
    test("Given the component mounts, Then it fetches the schedule for the staff member", async () => {
      await renderComponent(mockApi);
      expect(mockApi.schedules.getSchedule).toHaveBeenCalledWith(STAFF_ID);
    });
 
    test("Given the clinic fetch fails, Then the slot grid is not shown and no crash occurs", async () => {
      mockApi.clinics.getAssignedClinics.mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
 
      await renderComponent(buildApi({ clinics: { getAssignedClinics: mockApi.clinics.getAssignedClinics } }));
 
      expect(
        screen.getByText(/Clinic hours not set — contact your administrator/i)
      ).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
 
    test("Given the schedule fetch fails, Then no blocks are rendered and no crash occurs", async () => {
      mockApi.schedules.getSchedule.mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
 
      await renderComponent(mockApi);
 
      expect(screen.queryByText(/Loading your schedule/i)).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });
 
    test("Given clinic has no practice times, Then the 'contact administrator' message is shown", async () => {
      mockApi.clinics.getAssignedClinics.mockResolvedValue([{}]);
      await renderComponent(mockApi);
      expect(
        screen.getByText(/Clinic hours not set — contact your administrator/i)
      ).toBeInTheDocument();
    });
  });
 
  describe("Day tabs", () => {
 
    test("Given the page loads, Then Monday tab is active by default", async () => {
      await renderComponent(mockApi);
      const mondayTab = screen.getByTitle("Monday");
      expect(mondayTab).toHaveClass("es-day-tab--active");
    });
 
    test("Given a day tab is clicked, Then that day becomes active", async () => {
      await renderComponent(mockApi);
      fireEvent.click(screen.getByTitle("Wednesday"));
      const wednesdayTab = screen.getByTitle("Wednesday");
      expect(wednesdayTab).toHaveClass("es-day-tab--active");
    });
 
    test("Given a day has schedule blocks, Then the badge shows the correct count", async () => {
      await renderComponent(mockApi);
      const mondayTab = screen.getByTitle("Monday");
      const badge = mondayTab.querySelector(".es-day-tab-badge");
      expect(badge).toHaveTextContent("1");
    });
 
    test("Given a day has no schedule blocks, Then its badge shows 0", async () => {
      await renderComponent(mockApi);
      const sundayTab = screen.getByTitle("Sunday");
      const badge = sundayTab.querySelector(".es-day-tab-badge");
      expect(badge).toHaveTextContent("0");
    });
  });
 
  describe("Slot grid", () => {
    test("Given clinic opens at 08:00 and closes at 12:00, Then 4 slot buttons are rendered", async () => {
      await renderComponent(mockApi);
      const timeSlots = screen
        .getAllByRole("button")
        .filter((btn) => btn.hasAttribute("aria-pressed"));
      expect(timeSlots).toHaveLength(4);
    });
 
    test("Given a slot matches a schedule block, Then the button is marked as 'on'", async () => {
      await renderComponent(mockApi);
      const onButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-pressed") === "true");
      expect(onButtons).toHaveLength(1);
      expect(onButtons[0]).toHaveTextContent(/9:00 AM/i);
    });
 
    test("Given a slot has no block, Then the button is marked as 'off'", async () => {
      await renderComponent(mockApi);
      const offButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-pressed") === "false");
      expect(offButtons.length).toBeGreaterThanOrEqual(3);
    });
 
    test("Given a slot button is 'on', Then its title says 'Click to mark unavailable'", async () => {
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
      expect(onBtn).toHaveAttribute("title", "Click to mark unavailable");
    });
 
    test("Given a slot button is 'off', Then its title says 'Click to mark available'", async () => {
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
      expect(offBtn).toHaveAttribute("title", "Click to mark available");
    });
 
 
    test("Given a different day is selected, Then its slot grid is shown", async () => {
      await renderComponent(mockApi);
      fireEvent.click(screen.getByTitle("Sunday"));
      const offButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-pressed") === "false");
      expect(offButtons).toHaveLength(4);
    });
  });
 
  describe("Legend", () => {
 
    test("Given the slot grid renders, Then the Not working legend item is shown", async () => {
      await renderComponent(mockApi);
      expect(screen.getByText(/Not working/i)).toBeInTheDocument();
    });
  });
 
  describe("Adding a schedule block", () => {
    test("Given an 'off' slot is clicked, Then api.schedules.create is called with correct args", async () => {
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() => {
        expect(mockApi.schedules.create).toHaveBeenCalledWith(
          expect.objectContaining({ staffId: STAFF_ID, DayOfWeek: 1 })
        );
      });
    });
 
    test("Given a slot is successfully added, Then a success toast appears", async () => {
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() =>
        expect(screen.getByText(/Timeslot added/i)).toBeInTheDocument()
      );
    });
 
    test("Given the create call fails, Then an error toast is shown", async () => {
      mockApi.schedules.create.mockRejectedValue(new Error("Create failed"));
      useApi.mockReturnValue(mockApi);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
 
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() =>
        expect(screen.getByText(/Create failed/i)).toBeInTheDocument()
      );
      consoleSpy.mockRestore();
    });
 
    test("Given a slot is being added, Then the button is disabled during the request", async () => {
      let resolveCreate;
      mockApi.schedules.create.mockReturnValue(
        new Promise((res) => { resolveCreate = res; })
      );
      useApi.mockReturnValue(mockApi);
 
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() => expect(offBtn).toBeDisabled());
 
      act(() => {
        resolveCreate({
          schedule: { _id: "block-new", DayOfWeek: 1, StartTime: "08:00:00", EndTime: "09:00:00" },
        });
      });
    });
 
    test("Given a slot is added, Then the new block appears in the grid as 'on'", async () => {
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() => {
        const onButtons = screen
          .getAllByRole("button")
          .filter((btn) => btn.getAttribute("aria-pressed") === "true");
        expect(onButtons).toHaveLength(2);
      });
    });
  });
 
  describe("Deleting a schedule block", () => {
    test("Given an 'on' slot is clicked, Then api.schedules.delete is called with the block ID", async () => {
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
 
      fireEvent.click(onBtn);
 
      await waitFor(() => {
        expect(mockApi.schedules.delete).toHaveBeenCalledWith("block-001", STAFF_ID);
      });
    });
 
    test("Given a block is successfully deleted, Then a remove toast appears", async () => {
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
 
      fireEvent.click(onBtn);
 
      await waitFor(() =>
        expect(screen.getByText(/Timeslot removed/i)).toBeInTheDocument()
      );
    });
 
    test("Given the delete call fails, Then an error toast is shown", async () => {
      mockApi.schedules.delete.mockRejectedValue(new Error("Delete failed"));
      useApi.mockReturnValue(mockApi);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
 
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
 
      fireEvent.click(onBtn);
 
      await waitFor(() =>
        expect(screen.getByText(/Delete failed/i)).toBeInTheDocument()
      );
      consoleSpy.mockRestore();
    });
 
    test("Given a block is deleted, Then the slot is removed from the grid (button becomes 'off')", async () => {
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
 
      fireEvent.click(onBtn);
 
      await waitFor(() => {
        const onButtons = screen
          .getAllByRole("button")
          .filter((btn) => btn.getAttribute("aria-pressed") === "true");
        expect(onButtons).toHaveLength(0);
      });
    });
 
    test("Given a block is being deleted, Then the button is disabled during the request", async () => {
      let resolveDelete;
      mockApi.schedules.delete.mockReturnValue(
        new Promise((res) => { resolveDelete = res; })
      );
      useApi.mockReturnValue(mockApi);
 
      await renderComponent(mockApi);
      const onBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "true");
 
      fireEvent.click(onBtn);
 
      await waitFor(() => expect(onBtn).toBeDisabled());
 
      act(() => resolveDelete({ message: "Deleted" }));
    });
  });
 
  describe("Toast notifications", () => {
    test("Given a toast appears, Then it disappears after ~2.8 seconds", async () => {
      await renderComponent(mockApi);
      const offBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.getAttribute("aria-pressed") === "false");
 
      fireEvent.click(offBtn);
 
      await waitFor(() =>
        expect(screen.getByText(/Timeslot added/i)).toBeInTheDocument()
      );
 
      act(() => jest.advanceTimersByTime(3000));
 
      await waitFor(() =>
        expect(screen.queryByText(/Timeslot added/i)).not.toBeInTheDocument()
      );
    });
  });
 
  describe("Days Off section", () => {
    test("Given the page renders, Then the 'Days Off' section heading is shown", async () => {
      await renderComponent(mockApi);
      expect(screen.getByText(/Days Off/i)).toBeInTheDocument();
    });
 
    test("Given the page renders, Then the 'Request specific dates off' sub-text is shown", async () => {
      await renderComponent(mockApi);
      expect(screen.getByText(/Request specific dates off/i)).toBeInTheDocument();
    });
  });
});