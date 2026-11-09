import { Metadata } from "next";
import RateGuideView from "./rate-guide-view";

export const metadata: Metadata = {
  title: "कति पर्ला? Rate Guide - KamGhar",
  description:
    "Standard market price benchmarks for informal trades across Nepal (Electricians, Plumbers, Painters, Carpenters, Cleaners, Technicians).",
  openGraph: {
    title: "कति पर्ला? Nepali Fair Market Rate Estimator",
    description: "Benchmark labor and service rates across Kathmandu Valley and Nepal.",
  },
};

export default function RateGuidePage() {
  return <RateGuideView />;
}
