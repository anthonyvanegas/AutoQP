export interface Prop {
  id: string;
  entity_name: string;
  type_display: string;
  line: number;
  odds: number;  // Mock data for now (e.g., -135, +120)
  books: number; // Number of sportsbooks offering this prop
}