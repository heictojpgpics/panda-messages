import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { Testimonials } from "@/components/landing/Testimonials";
import { EnvelopeDemo } from "@/components/landing/EnvelopeDemo";
import { Features } from "@/components/landing/Features";
import { LiveWatch } from "@/components/landing/LiveWatch";
import { ThemesSection } from "@/components/landing/ThemesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExamplesSection } from "@/components/landing/ExamplesSection";
import { LibraryPreview } from "@/components/landing/LibraryPreview";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { opportunisticTick } from "@/lib/delivery";

export default function Home() {
  // Any page load nudges the delivery engine. Cheap, debounced, keeps
  // scheduled cards flowing even without a cron trigger configured.
  opportunisticTick().catch(() => {});

  return (
    <div className="relative min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <Testimonials />
        <EnvelopeDemo />
        <LiveWatch />
        <Features />
        <ThemesSection />
        <HowItWorks />
        <ExamplesSection />
        <LibraryPreview />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
