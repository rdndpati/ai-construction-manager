import { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "1",
    name: "Hillsboro Solar",
    client: "Lightsource BP",
    location: "Texas",
    status: "Construction",
    progress: 65,
  },
  {
    id: "2",
    name: "Memphis Substation",
    client: "TVA",
    location: "Tennessee",
    status: "Engineering",
    progress: 40,
  },
  {
    id: "3",
    name: "Waco Battery Energy Storage",
    client: "NextEra Energy",
    location: "Texas",
    status: "Design",
    progress: 25,
  },
  {
    id: "4",
    name: "Phoenix Solar Farm",
    client: "Invenergy",
    location: "Arizona",
    status: "Permitting",
    progress: 15,
  },
  {
    id: "5",
    name: "California Substation Upgrade",
    client: "PG&E",
    location: "California",
    status: "Completed",
    progress: 100,
  },
];