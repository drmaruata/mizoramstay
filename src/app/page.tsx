import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedStaysSection } from "@/components/home/FeaturedStaysSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { HostCTASection } from "@/components/home/HostCTASection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FAQSection } from "@/components/home/FAQSection";

export default async function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <HeroSection />
      <main>
        <DestinationsSection />
        <FeaturedStaysSection />
        <HostCTASection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <footer className="border-t border-border px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-2xl text-foreground">
            mizoram<span className="text-accent">stay</span>
          </p>
          <p>Book verified stays and discover authentic Mizoram.</p>
          <p>© 2026 MizoramStay</p>
        </div>
      </footer>
    </div>
  );
}
