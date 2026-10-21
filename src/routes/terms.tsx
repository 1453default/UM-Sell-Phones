import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { SHOP_PHONE } from "@/lib/shop";

const description = "Terms for phone estimates, inspection and pickup requests at USED MOBILES.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | USED MOBILES" },
      { name: "description", content: description },
      { property: "og:title", content: "Terms and Conditions | USED MOBILES" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PublicLayout>
      <article className="legal-page space-y-7">
        <p className="eyebrow">USED MOBILES · Hyderabad</p>
        <h1 className="-mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Terms and Conditions
        </h1>
        <p className="-mt-4 text-sm text-muted-foreground">Updated 20 October 2026</p>

        <section>
          <h2 className="text-xl font-semibold">Estimates and final offers</h2>
          <p className="mt-2 leading-relaxed">
            Online values use the selected exact model and variant, the catalog price and your
            condition answers. The estimate is not a guaranteed purchase price. The store confirms
            the final offer after inspecting the device. An unavailable price is not replaced with
            another model’s price.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Pickup requests</h2>
          <p className="mt-2 leading-relaxed">
            Pickup requests are available within the supported Hyderabad pincodes, Monday to
            Saturday, between 10:00 AM and 4:00 PM. A booking reference confirms receipt of your
            request, not a guaranteed arrival time or completed sale. The team will call to confirm
            arrangements. A Telegram alert to the shop's private employee group is an internal
            business notification and does not change your booking or the estimated offer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Your responsibilities</h2>
          <p className="mt-2 leading-relaxed">
            Provide accurate contact, address and device details. You must be entitled to sell the
            device and bring valid government ID at the time of sale. Back up personal information
            before handing over the phone and discuss data removal with the inspecting staff.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Changes and cancellations</h2>
          <p className="mt-2 leading-relaxed">
            Call {SHOP_PHONE} to request a change or cancellation. The store must confirm any
            rescheduling. The business has not supplied a cancellation fee, deadline or dispute
            handling process; these terms need owner review before publication.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Sale and payment</h2>
          <p className="mt-2 leading-relaxed">
            A sale proceeds only after inspection and agreement on the final price. The store offers
            UPI or cash payment. This website does not collect online payments.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Questions</h2>
          <p className="mt-2 leading-relaxed">
            Contact USED MOBILES at {SHOP_PHONE}. The business must review these terms and confirm
            its cancellation and dispute-handling policies before treating them as final.
          </p>
        </section>
      </article>
    </PublicLayout>
  );
}
