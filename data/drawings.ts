export interface Drawing {
  id: string;
  number: string;
  name: string;
  revision: string;
  status: string;
}

export const drawings: Drawing[] = [
  {
    id: "1",
    number: "C-101",
    name: "Site Layout",
    revision: "Rev 5",
    status: "IFC",
  },
  {
    id: "2",
    number: "E-201",
    name: "Electrical Plan",
    revision: "Rev 3",
    status: "Review",
  },
  {
    id: "3",
    number: "S-401",
    name: "Structural Details",
    revision: "Rev 7",
    status: "Approved",
  },
];