/**
 * Centralized program options configuration
 * Contains all available academic programs and their metadata
 */

export interface ProgramOptionItem {
  value: string;
  label: string;
}

export const PROGRAM_OPTIONS: ProgramOptionItem[] = [
  { value: "prog-ac-heridas-curaciones", label: "PROG. ACADÉMICO HERIDAS Y CURACIONES" },
  { value: "prog-ac-iaas", label: "PROG. ACADÉMICO IAAS" },
  { value: "prog-ac-sup-higiene", label: "PROG. ACADÉMICO SUP. HIGIENE" },
  { value: "prog-ac-lavanderia-hospitalaria", label: "PROG. ACADÉMICO LAVANDERIA HOSPITALARIA" },
  { value: "prog-ac-emergencia-urgencia", label: "PROG. ACADÉMICO EMERGENCIA Y URGENCIA" },
  { value: "prog-ac-atuss", label: "PROG. ACADÉMICO ATUSS" },
  { value: "prog-ac-ad-bq-cti", label: "PROG. ACADÉMICO AD. BQ y CTI" },
  { value: "prog-ac-camillero", label: "PROG. ACADÉMICO CAMILLERO" },
  { value: "prog-ac-economato", label: "PROG. ACADÉMICO ECONOMATO" },
  { value: "prog-ac-economato-2026", label: "PROG. ACADÉMICO ECONOMATO 2026" },
  { value: "prog-ac-chofer-sanitario", label: "PROG. ACADÉMICO CHOFER SANITARIO" },
  { value: "prog-mc-ostomias", label: "PROG. Master Class OSTOMIAS" },
];

// Extract valid program option values as a union type
export type ProgramOption = (typeof PROGRAM_OPTIONS)[number]["value"];

// Get all program option values for validation
export const PROGRAM_OPTION_VALUES = PROGRAM_OPTIONS.map(opt => opt.value);

// Optional: Drive links for diplomas per program (if needed)
export const PROGRAM_DRIVE_LINKS: Record<ProgramOption, string> = {
  "prog-ac-heridas-curaciones": "https://drive.google.com/file/d/1PN4espGUDUc4sTNeVMAc8-GEJDM2UuyR/view?usp=drive_link",
  "prog-ac-iaas": "https://drive.google.com/file/d/14V04X8o8AQNKFZIg38_k3KEO1y4fuQXv/view?usp=drive_link",
  "prog-ac-sup-higiene": "https://drive.google.com/file/d/1Ut5njg4D4wqN6XSeXNooXRXynnE8ZxPV/view?usp=drive_link",
  "prog-ac-lavanderia-hospitalaria": "https://drive.google.com/file/d/1WAAy_cGQT-gjiDU1zIqSpuvLrli_jhZo/view?usp=drive_link",
  "prog-ac-emergencia-urgencia": "https://drive.google.com/file/d/1ktDa2YQyZqvsFGVvJj3mVwZemuvAyPAR/view?usp=drive_link",
  "prog-ac-atuss": "https://drive.google.com/file/d/1UxRrcM8CMoM9oOKdhExwpkjY4uuxWG-V/view?usp=drive_link",
  "prog-ac-ad-bq-cti": "https://drive.google.com/file/d/1lrs2zFt6toKoOfvGR1zuQM8yGVUhLlvv/view?usp=drive_link",
  "prog-ac-camillero": "https://drive.google.com/file/d/1mgFDKYBYSA_jk-dhIXXCjdFA5WiIItiU/view?usp=drive_link",
  "prog-ac-economato": "https://drive.google.com/file/d/175ADwjwj-z0UbVFpnHZXmdMeyE-uW89O/view?usp=drive_link",
  "prog-ac-economato-2026": "https://drive.google.com/file/d/16WWCShu9SvBnW9kmvAE9R3ShyVo_vuV9/view?usp=drive_link",
  "prog-ac-chofer-sanitario": "https://drive.google.com/file/d/1bWP9BhsOAyF24f5LbKSnCB6QEvNZCxKb/view?usp=drive_link",
  "prog-mc-ostomias": "https://drive.google.com/file/d/1TtagCZ95WzHej3qqvq_zyspSmQPDFfxb/view?usp=drive_link",
};
