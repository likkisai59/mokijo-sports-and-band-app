"use client";

import * as React from "react";
import { useVenueVerification } from "@/hooks/use-venue-verification";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  ExternalLink,
  History,
  Send
} from "lucide-react";
import { format } from "date-fns";

export default function VenueVerificationPage() {
  const { profile, loading, submitting, error, refetch, resubmitDocs } = useVenueVerification();
  
  // Resubmission form inputs state
  const [docPan, setDocPan] = React.useState("");
  const [docGst, setDocGst] = React.useState("");
  const [docOwnership, setDocOwnership] = React.useState("");
  const [docGovId, setDocGovId] = React.useState("");
  const [docLicense, setDocLicense] = React.useState("");

  // Populate inputs with current profile documents when loaded
  React.useEffect(() => {
    if (profile?.documents) {
      setDocPan(profile.documents.doc_pan || "");
      setDocGst(profile.documents.doc_gst || "");
      setDocOwnership(profile.documents.doc_ownership_proof || "");
      setDocGovId(profile.documents.doc_government_id || "");
      setDocLicense(profile.documents.doc_business_license || "");
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm text-text-secondary animate-pulse font-medium">Checking verification compliance status...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[55vh] p-4">
        <ErrorState title="Load Error" message={error || "Could not retrieve verification profile."} onRetry={refetch} />
      </div>
    );
  }

  const status = profile.verification_status || "pending";
  const notes = profile.verification_notes || "";
  const history = profile.metadata_fields?.verification_history || [];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docPan || !docOwnership || !docGovId || !docLicense) {
      return;
    }
    await resubmitDocs({
      doc_pan: docPan,
      doc_gst: docGst,
      doc_ownership_proof: docOwnership,
      doc_government_id: docGovId,
      doc_business_license: docLicense
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6.5 w-6.5 text-primary" />
            Verification Center
          </h1>
          <p className="text-xs text-text-secondary">
            Manage your legal compliance records, inspect document verification states, and audit resubmission timelines.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="flex items-center gap-1.5 self-start sm:self-center text-xs h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Details</span>
        </Button>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Verification Status Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Compliance Status</span>
                
                {status === "approved" ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-3 py-1 flex items-center gap-1.5 font-bold text-sm">
                      <ShieldCheck className="h-4.5 w-4.5" />
                      Approved / Active
                    </Badge>
                  </div>
                ) : status === "rejected" ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-error/10 text-error border border-error/25 px-3 py-1 flex items-center gap-1.5 font-bold text-sm">
                      <AlertTriangle className="h-4.5 w-4.5" />
                      Action Required / Rejected
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-3 py-1 flex items-center gap-1.5 font-bold text-sm">
                      <Clock className="h-4.5 w-4.5 animate-pulse" />
                      Under Review / Pending
                    </Badge>
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-text-muted block">Profile Owner</span>
                <span className="text-sm font-bold text-text-primary block">{profile.business_name || "Your Listing"}</span>
              </div>
            </div>

            {/* Admin Comments Alert */}
            {notes && (
              <div className={`mt-5 p-4 rounded-xl border text-xs leading-relaxed ${
                status === "rejected" 
                  ? "bg-error/5 border-error/20 text-error" 
                  : status === "approved"
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-400"
              }`}>
                <span className="font-bold block mb-1">Administrative Message:</span>
                {notes}
              </div>
            )}
          </Card>

          {/* Current Documents Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Document Vault
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "PAN Card Document", key: "doc_pan", url: docPan },
                { name: "GST Certificate (Optional)", key: "doc_gst", url: docGst },
                { name: "Property Ownership Proof", key: "doc_ownership_proof", url: docOwnership },
                { name: "Owner Government ID", key: "doc_government_id", url: docGovId },
                { name: "Business Operations License", key: "doc_business_license", url: docLicense },
              ].map((doc, idx) => (
                <Card key={idx} className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-text-primary block">{doc.name}</span>
                    <span className="text-[10px] text-text-secondary block">
                      {doc.url ? "File successfully uploaded" : "Missing / Not uploaded"}
                    </span>
                  </div>
                  {doc.url ? (
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-xl transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-error font-bold uppercase px-2.5 py-1 bg-error/10 border border-error/20 rounded-lg">
                      Empty
                    </span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Timeline / History History */}
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-5">
          <div className="border-b border-border/30 pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-primary" />
              Verification History
            </h3>
            <p className="text-[9px] text-text-secondary">Audit log transitions timeline</p>
          </div>

          <div className="relative pl-4 border-l border-border/40 space-y-6">
            {history.map((log: any, idx: number) => (
              <div key={idx} className="relative space-y-1">
                <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border ${
                  log.status === "approved" 
                    ? "bg-emerald-400 border-emerald-500" 
                    : log.status === "rejected"
                    ? "bg-error border-error"
                    : "bg-amber-400 border-amber-500"
                }`} />
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-text-primary capitalize">{log.status}</span>
                  <span className="text-text-muted font-mono">
                    {format(new Date(log.timestamp), "dd MMM yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">{log.notes || "No notes supplied."}</p>
              </div>
            ))}

            {history.length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-6">No historical records available.</p>
            )}
          </div>
        </Card>

      </div>

      {/* Resubmit Documents Form (Show if status is rejected or operator wants to update files) */}
      {(status === "rejected" || status === "pending") && (
        <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow p-6 max-w-3xl">
          <div className="border-b border-border/30 pb-3.5 mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Resubmit Verification Files
            </h3>
            <p className="text-xs text-text-secondary">
              Update document links below to reset the verification request. Make sure URLs link to legible PDF or image scans.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-muted block">PAN Card URL</label>
                <Input 
                  value={docPan}
                  onChange={e => setDocPan(e.target.value)}
                  placeholder="https://example.com/pan.pdf"
                  required
                  className="bg-bg-elevated/40 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-muted block">GST Certificate URL (Optional)</label>
                <Input 
                  value={docGst}
                  onChange={e => setDocGst(e.target.value)}
                  placeholder="https://example.com/gst.pdf"
                  className="bg-bg-elevated/40 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-muted block">Ownership Proof URL</label>
                <Input 
                  value={docOwnership}
                  onChange={e => setDocOwnership(e.target.value)}
                  placeholder="https://example.com/ownership.pdf"
                  required
                  className="bg-bg-elevated/40 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-muted block">Government ID URL</label>
                <Input 
                  value={docGovId}
                  onChange={e => setDocGovId(e.target.value)}
                  placeholder="https://example.com/government-id.pdf"
                  required
                  className="bg-bg-elevated/40 border-border"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-text-muted block">Business License URL</label>
                <Input 
                  value={docLicense}
                  onChange={e => setDocLicense(e.target.value)}
                  placeholder="https://example.com/business-license.pdf"
                  required
                  className="bg-bg-elevated/40 border-border"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting || !docPan || !docOwnership || !docGovId || !docLicense}
              className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Submitting Scans...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Resubmit Document Vault</span>
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

    </div>
  );
}
