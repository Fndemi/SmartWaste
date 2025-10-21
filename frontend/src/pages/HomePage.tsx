// In your actual HomePage.tsx file:
import { SimpleHero } from '../components/layout/SimpleHero';
import { SliderReviews } from '../components/layout/SliderReviews';
import { FAQSection } from '../components/layout/FAQSection';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        <SimpleHero />      {/* Hero with features */}
        <SliderReviews />   {/* 3 sliding reviews */}
        <FAQSection />      {/* 4 FAQ items */}
      </main>

      <Footer />
    </div>
  );
}