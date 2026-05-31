"use client";

import { MatchIntel } from "../../../../components/match/match-intel";

export default function MatchPage({ params }: { params: { id: string } }) {
  return <MatchIntel id={params.id} />;
}
