"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StarRating } from "@/components/ui/star-rating";
import {
  Sparkles,
  Music,
  ChevronRight,
  Accessibility
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [rating, setRating] = React.useState(4);

  const triggerToast = () => {
    toast.success("Design system alert triggered!");
  };

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary py-24 px-6 max-w-7xl mx-auto">
      {/* Background glow overlay */}
      <div className="absolute inset-0 glow-overlay pointer-events-none" />

      <header className="relative z-10 border-b border-border pb-8 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-semibold mb-4">
          <Sparkles className="h-4 w-4" />
          <span>Core Design System Specifications</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4">Design Tokens & UI Kit</h1>
        <p className="text-text-secondary max-w-3xl leading-relaxed">
          Premium dark mode UI system for BandConnect. Responsive structures, custom color tokens, accessible elements, and unified glassmorphic animations.
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Section 1: Colors & Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">1. Colors & Typography</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-white rounded-lg flex flex-col justify-end min-h-[80px]">
              <span className="font-bold text-xs">Primary</span>
              <span className="text-[10px] opacity-80">#FF6B35</span>
            </div>
            <div className="p-4 bg-secondary text-white rounded-lg flex flex-col justify-end min-h-[80px]">
              <span className="font-bold text-xs">Secondary</span>
              <span className="text-[10px] opacity-80">#1DB954</span>
            </div>
            <div className="p-4 bg-accent text-bg-primary rounded-lg flex flex-col justify-end min-h-[80px]">
              <span className="font-bold text-xs text-black">Accent</span>
              <span className="text-[10px] text-black/80">#FFD700</span>
            </div>
            <div className="p-4 bg-bg-card border border-border text-text-primary rounded-lg flex flex-col justify-end min-h-[80px]">
              <span className="font-bold text-xs">Card BG</span>
              <span className="text-[10px] opacity-80">#12121A</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Typography Samples</h3>
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-text-primary">Syne Header (Extra Bold)</h1>
              <p className="text-base text-text-primary leading-relaxed font-sans">
                Inter Sans body text: Standard layout sizing configured for optimal line height readability in modern dark browsers layouts.
              </p>
              <code className="text-xs font-mono text-primary bg-bg-card border border-border px-2 py-1 rounded">
                JetBrains Mono code segments: UUID values
              </code>
            </div>
          </div>
        </section>

        {/* Section 2: Reusable Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">2. Interactive Buttons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Trigger</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small size</Button>
            <Button size="default">Default size</Button>
            <Button size="lg">Large size</Button>
            <Button variant="default" className="flex items-center gap-2">
              <span>Icons support</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Section 3: Inputs & Forms */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">3. Form Input Elements</h2>
          <div className="space-y-4 max-w-md">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-text-primary">Text Input Field</span>
              <Input type="text" placeholder="Enter name details..." />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-text-primary">Textarea Comments</span>
              <Textarea placeholder="Enter details feedback comments..." />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-text-primary">Interactive Rating Stars</span>
              <StarRating rating={rating} onRatingChange={setRating} readOnly={false} />
            </div>
          </div>
        </section>

        {/* Section 4: Badges & Statuses */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">4. Badges & Labels</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="destructive">Declined</Badge>
            <Badge variant="outline">Outline border</Badge>
          </div>
        </section>

        {/* Section 5: Glassmorphic Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">5. Glassmorphic Card Blocks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card hover={true}>
              <CardHeader>
                <CardTitle>Standard Card Title</CardTitle>
                <CardDescription>Hover over me to trigger transition</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Custom cards are configured with a standard hover offset animation scaling.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Updated just now</span>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card glass={true}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  <span>Glassmorphism Card</span>
                </CardTitle>
                <CardDescription>Backdrop blur configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Glass components adapt perfectly over gradient blur overlays.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Config Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Section 6: Skeletons & Spinner Loaders */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">6. Loading States</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <span className="text-sm text-text-secondary">Spinners loading components</span>
            </div>
            
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        </section>

        {/* Section 7: Dialogs, Toasts, and Accessibility */}
        <section className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">7. Modals, Alerts, & Accessibility</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              Launch Dialogue Overlay
            </Button>
            <Button onClick={triggerToast} variant="default">
              Launch Toast Notice
            </Button>
          </div>

          <Card className="p-6 border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Accessibility className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary mb-1">WCAG 2.1 Accessibility Compliance</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Every interaction button and input field contains default outline borders mapping focus indices, and labels reference matching DOM IDs. Focus indicator outlines are kept visible to enable high-contrast keyboard navigation workflows.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 8: Tabular Grid Structure */}
        <section className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-bold border-b border-border/30 pb-2">8. Data Tables</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Performer</TableHead>
                <TableHead>Genre Category</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Feedback Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-text-primary">The Classic Quartet</TableCell>
                <TableCell>Classical / Symphony</TableCell>
                <TableCell>₹12,000 / hr</TableCell>
                <TableCell>★ 4.9</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-text-primary">Neon Waves Band</TableCell>
                <TableCell>Electronic / Pop</TableCell>
                <TableCell>₹8,500 / hr</TableCell>
                <TableCell>★ 4.7</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>
      </div>

      {/* Dialog Showcase modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>System Dialog Showcase</DialogTitle>
            <DialogDescription>
              This is a custom modal dialogue displaying options confirm triggers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-text-secondary">
            Glass card backdrops automatically blur underlying sections grids to bring focus.
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
