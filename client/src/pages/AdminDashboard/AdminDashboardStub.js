const adminDashboardStub = {
  admin: {
    _id: "661f8d9c12ab34cd56ef7892",
    name: "Bruno",
    surname: "Faria",
    email: "bruno@example.com",
    role: "admin"
  },
  clinics: [
    {
      _id: "661f8c9a12ab34cd56ef7890",
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
        {
          _id: "661f8d1b12ab34cd56ef7891",
          userId: "661f8e0d12ab34cd56ef7893",
          name: "John",
          surname: "Doe",
          role: "staff"
        },
        {
          _id: "661f8d2c12ab34cd56ef7894",
          userId: "661f8e1e12ab34cd56ef7895",
          name: "Jane",
          surname: "Smith",
          role: "staff"
        }
      ]
    }
  ]
};

export default adminDashboardStub;