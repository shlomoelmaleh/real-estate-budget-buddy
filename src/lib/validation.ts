import { z } from 'zod';

// Client-side validation schema matching the Edge Function's schema
// This ensures data is validated before database insertion
export const SimulationInputSchema = z.object({
  clientName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\p{L}\p{N}\s\-'.,]+$/u, "Name contains invalid characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email must be less than 254 characters"),
  phone: z.string()
    .trim()
    .max(30, "Phone must be less than 30 characters")
    .regex(/^[+0-9\s\-()]*$/, "Phone contains invalid characters"),
  language: z.enum(["he", "en", "fr"]),
});

export type ValidatedSimulationInput = z.infer<typeof SimulationInputSchema>;

export type ValidationSuccess = { success: true; data: ValidatedSimulationInput };
export type ValidationFailure = { success: false; error: string };
export type ValidationResult = ValidationSuccess | ValidationFailure;

// Validate simulation data before database insert
export function validateSimulationInput(data: {
  clientName: string;
  email: string;
  phone: string;
  language: string;
}): ValidationResult {
  const result = SimulationInputSchema.safeParse(data);
  
  if (!result.success) {
    // Return the first error message
    const firstError = result.error.errors[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }
  
  return { success: true, data: result.data };
}
