const adminDashboardStub = {
  admin: {
    userId: "U001",
    name: "Bruno",
    surname: "Faria",
    email: "bruno@example.com",
    role: "admin"
  },
  clinics: [
    {
      clinicId: "C001",
      practiceName: "Johannesburg Family Clinic",
      province: "Gauteng",
      physicalTown: "Johannesburg",
      physicalSuburb: "Braamfontein",
      physicalAddress: "12 Biccard Street",
      practiceType: "Clinic",
      practiceTypeDescription: "Primary Healthcare Clinic",
      practiceNumber: "P001",
      contactNumber: "011-123-4567",
      operatingHours: "08:00 - 17:00",
      services: ["General Consultation", "Vaccination", "Family Planning"],
      staff: [
        { staffId: "S001", userId: "U010", name: "John", surname: "Doe", role: "staff" },
        { staffId: "S002", userId: "U011", name: "Jane", surname: "Smith", role: "staff" },
        { staffId: "S003", userId: "U001", name: "Bruno", surname: "Faria", role: "admin" }
      ]
    },
    {
      clinicId: "C002",
      practiceName: "Soweto Community Clinic",
      province: "Gauteng",
      physicalTown: "Johannesburg",
      physicalSuburb: "Soweto",
      physicalAddress: "45 Vilakazi Street",
      practiceType: "Clinic",
      practiceTypeDescription: "Community Health Clinic",
      practiceNumber: "P002",
      contactNumber: "011-987-6543",
      operatingHours: "07:30 - 16:00",
      services: ["HIV Testing", "TB Screening"],
      staff: [
        { staffId: "S004", userId: "U012", name: "Alice", surname: "Nkosi", role: "staff" },
        { staffId: "S005", userId: "U013", name: "David", surname: "Khumalo", role: "staff" }
      ]
    }
  ]
};

export default adminDashboardStub;