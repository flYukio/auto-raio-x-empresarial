import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { SocialProof } from '../components/SocialProof';
import { HowItWorks } from '../components/HowItWorks';
import { ProductModules } from '../components/ProductModules';
import { CompetitiveAdvantage } from '../components/CompetitiveAdvantage';
import { VisualDemo } from '../components/VisualDemo';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <ProductModules />
        <CompetitiveAdvantage />
        <VisualDemo />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
