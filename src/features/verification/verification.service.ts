export type VerificationDecision = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'SCHEDULE_INSPECTION'
export function assertVerificationDecision(decision: string): asserts decision is VerificationDecision { if (!['APPROVE','REJECT','REQUEST_CHANGES','SCHEDULE_INSPECTION'].includes(decision)) throw new Error('Invalid verification decision') }
