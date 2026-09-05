export interface PaymentProvider { createPaymentOrder(input: { reference: string; amount: number; currency: string }): Promise<{ provider: string; orderId: string }> }
export function createPaymentService(provider: PaymentProvider) { return { createOrder: (input: { reference: string; amount: number; currency: string }) => provider.createPaymentOrder(input) } }
