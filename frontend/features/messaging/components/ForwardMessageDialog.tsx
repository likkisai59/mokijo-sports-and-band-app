"use client";

import React, { useState } from "react";
import { Conversation, Message } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Forward, Loader2 } from "lucide-react";

interface ForwardMessageDialogProps {
  message: Message | null;
  conversations: Conversation[];
  isOpen: boolean;
  onClose: () => void;
  onForward: (messageId: string, targetConversationId: string) => Promise<boolean>;
}

export function ForwardMessageDialog({
  message,
  conversations,
  isOpen,
  onClose,
  onForward,
}: ForwardMessageDialogProps) {
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [forwarding, setForwarding] = useState<boolean>(false);

  if (!message) return null;

  // Available conversations (excluding source conversation and closed conversations)
  const availableConversations = conversations.filter(
    (c) => c.id !== message.conversation_id && c.status === "ACTIVE"
  );

  const handleSubmit = async () => {
    if (!selectedConvId || forwarding) return;
    setForwarding(true);
    const success = await onForward(message.id, selectedConvId);
    setForwarding(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-bg-card border border-border p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Forward className="h-4 w-4 text-primary" />
            <span>Forward Message</span>
          </DialogTitle>
          <p className="text-xs text-text-secondary">
            Select an active conversation to forward this message content to.
          </p>
        </DialogHeader>

        {/* Source Snippet Preview */}
        <div className="p-3 bg-bg-card/60 border border-border/60 rounded-xl text-xs text-text-secondary italic line-clamp-2 my-2">
          "{message.content}"
        </div>

        {/* Conversation List Selector */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {availableConversations.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">
              No other active conversations available to forward to.
            </p>
          ) : (
            availableConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedConvId === c.id
                    ? "bg-primary/15 border-primary text-text-primary font-bold"
                    : "bg-bg-card/40 border-border/60 hover:bg-bg-card text-text-secondary"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {c.event_name || `Booking ${c.booking_id.slice(0, 8)}`}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-text-muted shrink-0">
                  Ref: {c.booking_id.slice(0, 8)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={forwarding}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedConvId || forwarding}
            className="text-xs h-8 bg-primary text-white font-semibold gap-1.5"
          >
            {forwarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Forward className="h-3.5 w-3.5" />}
            <span>Forward</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
