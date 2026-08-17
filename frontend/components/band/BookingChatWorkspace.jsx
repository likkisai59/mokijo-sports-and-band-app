"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Sparkles,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  Music,
  Building2,
  User,
  Search,
  FileText,
  ShieldCheck,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import bandApi from "@/lib/bandApi";
import { getBandUser } from "@/lib/bandAuth";
import toast from "react-hot-toast";

const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    booking_id: 101,
    counterpart_name: "Sarah Connor",
    counterpart_role: "Client",
    counterpart_email: "sarah.connor@events.in",
    event_name: "Luxury Wedding Gala & Reception",
    event_date: "2026-09-12",
    venue_name: "The Velvet Amphitheater, Hyderabad",
    total_price: 45000,
    status: "CONFIRMED",
    unread_count: 1,
    last_message: "We would love to request a 45-min extended encore set!",
    last_message_time: "10m ago",
    messages: [
      {
        id: 1001,
        sender_id: "client",
        sender_name: "Sarah Connor",
        content: "Hi! We are so excited to have The Deccan Strings perform at our wedding reception on Sep 12.",
        created_at: "10:30 AM",
      },
      {
        id: 1002,
        sender_id: "artist",
        sender_name: "The Deccan Strings",
        content: "Hello Sarah! It is our absolute pleasure. We have prepared a classical-contemporary fusion setlist.",
        created_at: "10:45 AM",
      },
      {
        id: 1003,
        sender_id: "artist",
        sender_name: "The Deccan Strings",
        content: "Attached is our Stage Sound Rider & Tech Spec Sheet for the sound engineer.",
        attachment_name: "Deccan_Strings_Stage_Tech_Rider_v2.pdf",
        attachment_size: "1.4 MB",
        created_at: "10:46 AM",
      },
      {
        id: 1004,
        sender_id: "client",
        sender_name: "Sarah Connor",
        content: "We would love to request a 45-min extended encore set! Could you quote us a custom rate for the extra duration?",
        created_at: "11:15 AM",
      },
      {
        id: 1005,
        sender_id: "artist",
        sender_name: "The Deccan Strings",
        content: "Here is our custom proposal for the 45-minute extended acoustic encore set:",
        is_offer: true,
        offer_amount: 55000,
        offer_original: 45000,
        offer_status: "pending",
        created_at: "11:20 AM",
      },
    ],
  },
  {
    id: 2,
    booking_id: 102,
    counterpart_name: "Velvet Amphitheater",
    counterpart_role: "Venue Host",
    counterpart_email: "events@velvetamphitheater.com",
    event_name: "Indie Acoustic Evening",
    event_date: "2026-08-25",
    venue_name: "Velvet Main Hall, Hyderabad",
    total_price: 35000,
    status: "INQUIRY",
    unread_count: 0,
    last_message: "Soundcheck is scheduled for 4:00 PM sharp.",
    last_message_time: "2h ago",
    messages: [
      {
        id: 2001,
        sender_id: "venue",
        sender_name: "Velvet Amphitheater",
        content: "Hi! Confirming that our 32-channel digital console and line array PA are reserved for your gig.",
        created_at: "Yesterday",
      },
      {
        id: 2002,
        sender_id: "artist",
        sender_name: "You",
        content: "Awesome, our sound engineer will arrive by 3:30 PM for line check.",
        created_at: "9:00 AM",
      },
      {
        id: 2003,
        sender_id: "venue",
        sender_name: "Velvet Amphitheater",
        content: "Soundcheck is scheduled for 4:00 PM sharp.",
        created_at: "9:30 AM",
      },
    ],
  },
];

export function BookingChatWorkspace({ currentRole = "artist" }) {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState(1);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender_id: currentRole,
      sender_name: currentRole === "artist" ? "You" : "Sarah Connor",
      content: inputText.trim(),
      created_at: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              last_message: newMsg.content,
              last_message_time: "Just now",
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setInputText("");
    toast.success("Message sent!");
  };

  const handleProposeCustomOffer = () => {
    const parsed = parseFloat(offerAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid custom proposal amount.");
      return;
    }

    const offerMsg = {
      id: Date.now(),
      sender_id: currentRole,
      sender_name: "You",
      content: `Proposed custom rate adjustment for extended duration & rider specs:`,
      is_offer: true,
      offer_amount: parsed,
      offer_original: activeConv.total_price,
      offer_status: "pending",
      created_at: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              last_message: `Custom Price Proposal: ₹${parsed.toLocaleString("en-IN")}`,
              last_message_time: "Just now",
              messages: [...c.messages, offerMsg],
            }
          : c
      )
    );
    setOfferModalOpen(false);
    setOfferAmount("");
    toast.success(`Custom proposal of ₹${parsed.toLocaleString("en-IN")} submitted!`);
  };

  const handleOfferResponse = (messageId, decision) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== selectedId) return c;
        const updatedMsgs = c.messages.map((m) => {
          if (m.id === messageId) {
            return { ...m, offer_status: decision };
          }
          return m;
        });

        const targetMsg = c.messages.find((m) => m.id === messageId);
        const newTotal = decision === "accepted" ? targetMsg.offer_amount : c.total_price;

        return {
          ...c,
          total_price: newTotal,
          messages: updatedMsgs,
        };
      })
    );

    if (decision === "accepted") {
      toast.success("Custom proposal accepted! Escrow 20% deposit updated.");
    } else {
      toast.error("Custom proposal declined.");
    }
  };

  const handleAttachRider = () => {
    const riderMsg = {
      id: Date.now(),
      sender_id: currentRole,
      sender_name: "You",
      content: "Attached updated Sound Technical Rider & Stage Setlist:",
      attachment_name: "BandConnect_Rider_Spec_Approved.pdf",
      attachment_size: "2.1 MB",
      created_at: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              last_message: "Attached sound technical rider",
              last_message_time: "Just now",
              messages: [...c.messages, riderMsg],
            }
          : c
      )
    );
    toast.success("Sound Rider attached successfully!");
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.counterpart_name.toLowerCase().includes(search.toLowerCase()) ||
      c.event_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              width: "fit-content",
              marginBottom: "6px",
            }}
          >
            <Sparkles style={{ width: "12px", height: "12px" }} />
            <span>Direct Messaging & Custom Price Negotiation</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", margin: 0 }}>
            Booking Inquiries & Messages
          </h1>
        </div>
      </div>

      {/* ── 2-PANE CHAT CONTAINER ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(10, 10, 15, 0.08)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.02)",
          minHeight: "680px",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT PANE: THREADS LIST ── */}
        <div style={{ borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {filteredConversations.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #f8fafc",
                    backgroundColor: isSelected ? "rgba(198, 255, 61, 0.08)" : "transparent",
                    borderLeft: isSelected ? "4px solid #0a0a0f" : "4px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#0a0a0f" }}>
                      {c.counterpart_name}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{c.last_message_time}</span>
                  </div>

                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                    {c.event_name}
                  </span>

                  <p
                    style={{
                      fontSize: "12px",
                      color: isSelected ? "#0a0a0f" : "#64748b",
                      fontWeight: isSelected ? 700 : 500,
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.last_message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANE: ACTIVE CHAT ── */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fafafa" }}>
          {/* Thread Header */}
          <div
            style={{
              padding: "18px 24px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  backgroundColor: "#0a0a0f",
                  color: "#c6ff3d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "16px",
                }}
              >
                {activeConv.counterpart_name[0]}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 800, fontSize: "16px", color: "#0a0a0f" }}>
                    {activeConv.counterpart_name}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "10px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                    }}
                  >
                    {activeConv.status}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {activeConv.event_name} • {activeConv.venue_name}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Agreed Fee</span>
                <span style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f" }}>
                  ₹{activeConv.total_price.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setOfferModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#0a0a0f",
                  color: "#c6ff3d",
                  fontSize: "12px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <IndianRupee style={{ width: "14px", height: "14px" }} />
                <span>Propose Quote</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {activeConv.messages.map((m) => {
              const isMe = m.sender_id === currentRole || m.sender_name === "You";

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px", padding: "0 4px" }}>
                    {m.sender_name} • {m.created_at}
                  </span>

                  {/* Attachment Card */}
                  {m.attachment_name ? (
                    <div
                      style={{
                        maxWidth: "400px",
                        padding: "16px",
                        borderRadius: "18px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          backgroundColor: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444",
                          flexShrink: 0,
                        }}
                      >
                        <FileText style={{ width: "20px", height: "20px" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0a0a0f", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.attachment_name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{m.attachment_size} • Verified Rider</span>
                      </div>
                    </div>
                  ) : m.is_offer ? (
                    /* In-Chat Price Negotiation Card */
                    <div
                      style={{
                        maxWidth: "440px",
                        padding: "20px",
                        borderRadius: "22px",
                        backgroundColor: "#ffffff",
                        border: "2px solid #0a0a0f",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Sparkles style={{ width: "15px", height: "15px", color: "#c6ff3d" }} />
                          <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#0a0a0f" }}>
                            Custom Price Proposal
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            fontSize: "10px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            backgroundColor:
                              m.offer_status === "accepted"
                                ? "rgba(16,185,129,0.1)"
                                : m.offer_status === "declined"
                                ? "#fee2e2"
                                : "rgba(245,158,11,0.1)",
                            color:
                              m.offer_status === "accepted"
                                ? "#10b981"
                                : m.offer_status === "declined"
                                ? "#b91c1c"
                                : "#d97706",
                          }}
                        >
                          {m.offer_status}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "24px", fontWeight: 900, color: "#0a0a0f" }}>
                          ₹{m.offer_amount.toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "line-through" }}>
                          ₹{m.offer_original.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Includes 45-minute encore extension and travel rider compensation. 20% advance will recalculate upon approval.
                      </p>

                      {m.offer_status === "pending" && !isMe && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => handleOfferResponse(m.id, "accepted")}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "12px",
                              backgroundColor: "#c6ff3d",
                              color: "#0a0a0f",
                              fontSize: "12px",
                              fontWeight: 800,
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                            <span>Accept & Update Escrow</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOfferResponse(m.id, "declined")}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "12px",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
                              fontSize: "12px",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Standard Message Bubble */
                    <div
                      style={{
                        maxWidth: "480px",
                        padding: "12px 18px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        backgroundColor: isMe ? "#0a0a0f" : "#ffffff",
                        color: isMe ? "#ffffff" : "#0a0a0f",
                        fontSize: "13px",
                        fontWeight: 500,
                        lineHeight: 1.5,
                        boxShadow: isMe ? "0 4px 12px rgba(0,0,0,0.1)" : "0 2px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      {m.content}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div style={{ padding: "18px 24px", backgroundColor: "#ffffff", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              title="Attach Tech Rider / Setlist"
              onClick={handleAttachRider}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Paperclip style={{ width: "18px", height: "18px" }} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type message, technical request, or inquiry..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0a0a0f",
                backgroundColor: "#f8fafc",
              }}
            />

            <button
              type="button"
              onClick={handleSendMessage}
              style={{
                padding: "12px 20px",
                borderRadius: "14px",
                backgroundColor: "#0a0a0f",
                color: "#c6ff3d",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Send</span>
              <Send style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PROPOSE CUSTOM QUOTE MODAL ── */}
      {offerModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10,10,15,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "28px",
              padding: "32px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles style={{ width: "18px", height: "18px", color: "#c6ff3d" }} />
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                  Propose Custom Quote
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                style={{ backgroundColor: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Adjust the total fee for extra set duration, special sound gear rentals, or travel riders. The 20% advance escrow deposit will re-compute automatically.
            </p>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                New Proposed Total Fee (₹ INR)
              </label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="e.g. 55000"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0a0a0f",
                  backgroundColor: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={handleProposeCustomOffer}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  backgroundColor: "#0a0a0f",
                  color: "#c6ff3d",
                  fontSize: "13px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Send Proposal to Client
              </button>
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                style={{
                  padding: "14px 20px",
                  borderRadius: "14px",
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
