import * as z from 'zod';

export const calculatorSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').min(1, 'Required'),
  equity: z.string().min(1, 'Required'),
  netIncome: z.string().min(1, 'Required'),
  age: z.string().min(1, 'Required'),
  isFirstProperty: z.boolean({ required_error: 'Required' }),
  isIsraeliCitizen: z.boolean({ required_error: 'Required' }),
  isIsraeliTaxResident: z.boolean({ required_error: 'Required' }),
  isRented: z.boolean().default(false),
  expectedRent: z.string().default(''),
  budgetCap: z.string().default(''),
  targetPropertyPrice: z.string().default(''),
  // Partner-driven parameters (can be overridden by user in "What If" scenarios)
  interest: z.string().optional(),
  lawyerPct: z.string().optional(),
  brokerPct: z.string().optional(),
  vatPct: z.string().optional(),
  advisorFee: z.string().optional(),
  otherFee: z.string().optional(),
  ratio: z.string().optional(),
  maxAge: z.string().optional(),
  rentalYield: z.string().optional(),
  rentRecognition: z.string().optional(),
});

export type CalculatorFormValues = z.infer<typeof calculatorSchema>;
