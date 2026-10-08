/** Entity types: shared type and mock seed (local state only, no backend yet). */
export interface EntityType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export const entitySeed: EntityType[] = [
  { id: "1", name: "جمعية", description: "جمعية أهلية مسجلة", isActive: true },
  { id: "2", name: "مؤسسة أهلية", description: "مؤسسة أهلية غير ربحية", isActive: true },
  { id: "3", name: "جمعية تعاونية", description: "", isActive: false },
];
