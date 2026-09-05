"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What does 'verified' mean on MizoramStay?",
    answer:
      "Every property goes through a verification process where our team checks the host's identity, property details, and photos before it's published. Verified stays meet our quality and safety standards.",
  },
  {
    question: "How do I book a stay?",
    answer:
      "Search for a destination, choose your dates, and select a stay that fits your needs. You'll confirm your booking details and pay securely — the host confirms availability and you're all set.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Yes. Cancellation policies vary by property and are shown clearly before you book. You can manage cancellations from your account dashboard at any time.",
  },
  {
    question: "How do I become a host?",
    answer:
      "Create an account, choose 'List your property', and follow the simple steps to add your home, photos, and pricing. Our team reviews and verifies your listing before it goes live.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Absolutely. Payments are processed through secure, PCI-compliant providers. Your payment details are never shared with hosts.",
  },
  {
    question: "What if something goes wrong during my stay?",
    answer:
      "Our support team is available to help. We encourage respectful communication between guests and hosts, and we step in to resolve issues when needed.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Good to know
        </p>
        <h2 className="font-display mt-3 text-5xl tracking-tight">
          Frequently asked questions
        </h2>
      </div>

      <Accordion className="mt-12 border-y border-border">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question}>
            <AccordionTrigger className="py-5 text-left font-semibold text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-7 text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}