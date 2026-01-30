import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert letter grade to GPA number
 */
export function gradeToGPA(grade: string): number {
  const map: Record<string, number> = {
    A: 4.0,
    AB: 3.5,
    B: 3.0,
    BC: 2.5,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  return map[grade] ?? 0;
}

/**
 * Convert GPA to letter grade
 */
export function gpaToGrade(gpa: number): string {
  if (gpa >= 3.75) return "A";
  if (gpa >= 3.25) return "AB";
  if (gpa >= 2.75) return "B";
  if (gpa >= 2.25) return "BC";
  if (gpa >= 1.75) return "C";
  if (gpa >= 0.75) return "D";
  return "F";
}

/**
 * Get badge color for grade
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: "bg-green-500",
    AB: "bg-green-400",
    B: "bg-blue-500",
    BC: "bg-blue-400",
    C: "bg-yellow-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };
  return colors[grade] ?? "bg-gray-500";
}

/**
 * Format term for display
 */
export function formatTerm(term: string): string {
  // "2024-Fall" -> "Fall 2024"
  const [year, semester] = term.split("-");
  return `${semester} ${year}`;
}

/**
 * Generate term options for the past N years
 */
export function generateTermOptions(years: number = 3): { value: string; label: string }[] {
  const terms: { value: string; label: string }[] = [];
  const currentYear = new Date().getFullYear();
  const semesters = ["Spring", "Summer", "Fall"];

  for (let y = currentYear; y >= currentYear - years; y--) {
    for (const sem of semesters) {
      terms.push({
        value: `${y}-${sem}`,
        label: `${sem} ${y}`,
      });
    }
  }

  return terms;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
