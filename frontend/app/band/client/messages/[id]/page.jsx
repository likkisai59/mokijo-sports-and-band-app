"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function ClientMessageStub() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="bg-surface rounded-2xl shadow-sm border border-border/40 p-12 text-center flex flex-col items-center">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">
          Conversation Initialized
        </h1>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          Your booking has been accepted! This conversation space is ready. 
          (Conversation ID: {params.id})
        </p>
        <div className="inline-flex items-center justify-center px-4 py-2 bg-secondary/20 text-secondary rounded-full text-sm font-medium">
          Messaging implementation scheduled for future sprint.
        </div>
      </div>
    </div>
  );
}
