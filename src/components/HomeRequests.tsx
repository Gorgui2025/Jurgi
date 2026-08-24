"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import RequestCard from "@/components/RequestCard";

interface Request {
  id: string;
  title: string;
  category: string;
  location: string;
  quantity: string;
  deadline: string;
  responses: number;
  postedAt: string;
  user: string;
}

export default function HomeRequests({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="page-container pt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Demandes récentes</h2>
          <p className="text-sm text-charbon-300 mt-1">
            Des éleveurs et professionnels recherchent des produits et services
          </p>
        </div>
        <Link
          href="/demandes"
          className="text-sm font-medium text-baobab-500 hover:text-baobab-600 flex items-center gap-1 transition-colors"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {requests.map((req) => (
          <RequestCard
            key={req.id}
            id={req.id}
            title={req.title}
            category={req.category}
            location={req.location}
            quantity={req.quantity}
            deadline={req.deadline}
            responses={req.responses}
            postedAt={req.postedAt}
            user={req.user}
          />
        ))}
      </div>
    </section>
  );
}
