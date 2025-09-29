import { useState } from "react";
import { Hero } from "@/components/app/Hero";
import { RecommendationForm } from "@/components/app/RecommendationForm";
import { RecommendationsList } from "@/components/app/RecommendationsList";
import { GuidanceChat } from "@/components/app/GuidanceChat";
import { AIChat } from "@/components/app/AIChat";
import type { Recommendation } from "@/lib/recommend";

export default function Index() {
  const [results, setResults] = useState<Recommendation[]>([]);

  return (
    <main className="min-h-screen">
      <Hero />
      <RecommendationForm onResults={setResults} />
      <RecommendationsList results={results} />
      <GuidanceChat />
      <AIChat />
    </main>
  );
}
