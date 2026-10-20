<<<<<<< HEAD
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
      <article className="mx-auto max-w-3xl space-y-6 px-5 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Updated 20 October 2026</p>

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
            Supabase provides sign-in and database services. If administrator email notifications
            are configured, the request reference, submission time, customer and contact details,
            device and condition information, estimate, pickup schedule and address are sent to
            Resend to deliver an alert to the shop administrator. The site loads typefaces from
            Google Fonts when a page is viewed. Store-location and Instagram links open their
            respective services only when you choose to follow them.
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
=======
import { createFileRoute } from '@tanstack/react-router';
import { PublicLayout } from '@/components/public/PublicLayout';
import { SHOP_PHONE, SHOP_ADDRESS } from '@/lib/shop';
import { canonicalUrl } from '@/lib/site';
const description='How USED MOBILES uses contact, device and doorstep pickup information.';
export const Route=createFileRoute('/privacy')({head:()=>({meta:[{title:'Privacy Policy | USED MOBILES'},{name:'description',content:description},{property:'og:title',content:'Privacy Policy | USED MOBILES'},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}],links:[{rel:'canonical',href:canonicalUrl('/privacy')}]}),component:Privacy});
function Privacy(){return <PublicLayout><article className="mx-auto max-w-3xl px-5 py-12 space-y-6"><h1 className="text-3xl font-bold">Privacy Policy</h1><p className="text-muted-foreground">Updated 18 October 2026</p><section><h2 className="text-xl font-semibold">Information collected</h2><p className="mt-2 leading-relaxed">When you request a pickup, we store your name, mobile number, pickup address, locality, pincode, optional landmark, preferred date and time, device model and variant, condition answers, estimated offer and booking reference. Our staff can record booking status, staff assignments and internal notes. Phone numbers are currently unverified; no SMS verification is performed.</p></section><section><h2 className="text-xl font-semibold">How information is used</h2><p className="mt-2 leading-relaxed">We use this information to contact you, arrange and manage pickup, inspect your phone and discuss its final offer. Staff accounts use email sign-in and browser storage to access the private request management page.</p></section><section><h2 className="text-xl font-semibold">Storage and service providers</h2><p className="mt-2 leading-relaxed">The website uses Vercel for hosting and Supabase for secure staff sign-in and pickup request storage. Authorized staff can view pickup requests. Linked map and Instagram services operate under their own privacy policies when you choose to visit them. We do not send booking details through external messaging links.</p></section><section><h2 className="text-xl font-semibold">Retention and your requests</h2><p className="mt-2 leading-relaxed">Contact the store to ask about your information, request a correction or request deletion. A fixed retention period has not yet been established; the business must confirm it before publication. Some information may need to be retained to resolve an ongoing transaction or meet applicable obligations.</p></section><section><h2 className="text-xl font-semibold">Security and contact</h2><p className="mt-2 leading-relaxed">Staff sign-in and access restrictions protect booking information, but no online system is risk-free. For questions, call {SHOP_PHONE} or visit {SHOP_ADDRESS}.</p></section></article></PublicLayout>}
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
