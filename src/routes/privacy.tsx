import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { SHOP_PHONE, SHOP_ADDRESS } from "@/lib/shop";

const description = "How USED MOBILES uses customer, device and pickup information.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | USED MOBILES" },
      { name: "description", content: description },
      { property: "og:title", content: "Privacy Policy | USED MOBILES" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PublicLayout>
      <article className="legal-page space-y-7">
        <p className="eyebrow">USED MOBILES · Hyderabad</p>
        <h1 className="-mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="-mt-4 text-sm text-muted-foreground">Updated 20 October 2026</p>

        <section>
          <h2 className="text-xl font-semibold">Information collected</h2>
          <p className="mt-2 leading-relaxed">
            When you request a pickup, we store your name, mobile number, pickup address, locality,
            pincode, optional landmark, preferred date and time, phone brand, exact model and
            variant, condition answers, estimated offer and booking reference. The system also
            stores a random retry key and a keyed, one-way contact value used to limit repeated
            requests. Staff may add the request status, an assignment and internal notes. Phone
            numbers are currently unverified; the website does not send SMS verification codes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How we use information</h2>
          <p className="mt-2 leading-relaxed">
            We use request details to contact you, arrange and manage pickup, inspect your phone and
            discuss its final offer. Staff use email sign-in to access the private request
            management page. The website does not collect online payments.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Service providers</h2>
          <p className="mt-2 leading-relaxed">
            Supabase provides sign-in and database services. Pickup request details, including the
            reference, submission time, customer contact details, device and condition information,
            estimate, pickup schedule and address, are sent to the shop's private employee group
            through Telegram so staff can respond. The site loads typefaces from Google Fonts when a
            page is viewed. Store-location and Instagram links open their respective services only
            when you choose to follow them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Retention and requests</h2>
          <p className="mt-2 leading-relaxed">
            The business has not set a fixed retention period. Contact the store to ask about your
            information or request a correction or deletion. A request may need to be retained while
            a transaction is being handled or where applicable obligations require it. The business
            must approve a retention period before this policy is treated as final.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Security and contact</h2>
          <p className="mt-2 leading-relaxed">
            Staff access is restricted by server-checked account roles. No online system is
            risk-free. For privacy questions, call {SHOP_PHONE} or visit {SHOP_ADDRESS}.
          </p>
        </section>
      </article>
    </PublicLayout>
  );
}
