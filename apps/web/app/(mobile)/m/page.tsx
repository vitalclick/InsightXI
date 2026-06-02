import type { Metadata } from "next";
import { MobileApp } from "../../../modules/mobile/mobile-app";

export const metadata: Metadata = {
  title: "InsightXI — Football Intelligence",
  description: "AI-powered football analytics, live match intelligence and confidence-ranked predictions.",
};

/** Native-feeling mobile app: bottom-nav tabs + a pushable detail stack. */
export default function MobilePage() {
  return <MobileApp />;
}
