// Display prices (credits). Calculators: 1 credit per use (the sums run in the browser) and
// 1 credit for each "Explain in plain words". The server copy in
// supabase/functions/_shared/appSpecs/calculators.ts is what is charged.
export const calculators: Record<string, number> = {
  "emi-calculator": 1,
  "loan-prepayment-calculator": 1,
  "sip-calculator": 1,
  "fd-calculator": 1,
  "rd-calculator": 1,
  "cagr-calculator": 1,
  "break-even-calculator": 1,
  "percentage-calculator": 1,
  "age-calculator": 1,
};
