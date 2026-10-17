import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/shop";
const title = "How to Sell Your Phone — USED MOBILES Hyderabad";
const description =
  "Choose your device, assess its condition and share an estimated offer with USED MOBILES before an in-store inspection.";
export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorks,
});
function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Selling at USED MOBILES
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold">How it works</h1>
        <div className="mt-10 max-w-3xl divide-y divide-border">
          {[
            [
              "Choose your exact device",
              "Select the brand, model and storage/RAM variant. Your base value comes from the listed price for that exact combination.",
            ],
            [
              "Tell us about its condition",
              "Answer questions about calls, touch, screen, body, functional problems and the original box. Your estimate reflects the applicable condition adjustments.",
            ],
            [
              "Share your enquiry on WhatsApp",
              "Review the estimated offer, enter a mobile number and open WhatsApp. Send the prepared message to USED MOBILES to discuss your device.",
            ],
            [
              "Visit the store for confirmation",
              "The final price is confirmed after an in-store inspection in Toli Chowki, Hyderabad. Bring a valid government ID when selling.",
            ],
          ].map(([heading, text], i) => (
            <div key={heading} className="flex gap-6 py-7">
              <span className="font-num text-sm text-muted-foreground">0{i + 1}</span>
              <div>
                <h2 className="text-xl font-semibold">{heading}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/sell-phone">
              Check your phone’s value <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Ask the store
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
