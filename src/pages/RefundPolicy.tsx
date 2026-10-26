import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { Link } from "react-router-dom";
import { seoFor } from "@/lib/seo/pages";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        {...seoFor("/refund-policy", "")}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Cancellation & Refund Policy",
            description: "EZYOURLIFE cancellation and refund policy.",
            url: "https://ezyourlife.com/refund-policy",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
              { "@type": "ListItem", position: 2, name: "Refund Policy", item: "https://ezyourlife.com/refund-policy" },
            ],
          },
        ]}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
              Cancellation & Refund Policy
            </h1>
            <p className="text-muted-foreground">Last updated on Oct 26, 2026</p>
          </div>

          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <div className="p-6 rounded-2xl border-2 border-ink bg-card">
              <p>
                ABHIJAY JAIN believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>
            </div>

            <div className="space-y-6">
              <section id="money-back" className="p-6 rounded-2xl border-2 border-ink bg-sun space-y-4">
                <h2 className="font-display text-xl font-semibold">30-day money-back guarantee (pro rata)</h2>
                <p>
                  If you bought credits and are not satisfied, ask for your money back within 30 days of the purchase. We refund the
                  part of that purchase you have not used, pro rata:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Refund = amount you paid × the bought credits still unused ÷ the credits in that purchase.</li>
                  <li>Credits you have already used are not refunded. Credits used to pay for a website or card count as used.</li>
                  <li>Promotional credits are never refunded and have no cash value. That covers card gift credits, free monthly credits, sign-up credits and coupon credits. They are not part of the calculation and cannot be exchanged for money.</li>
                  <li>Refunds go back to the way you paid, in 7-10 business days after approval.</li>
                </ul>
                <p>
                  To ask, write to support@ezyourlife.com from the email on your account with the payment details.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Cancellation Requests</h2>
                <p className="text-muted-foreground">
                  Credit purchases follow the 30-day guarantee above. For any other order, cancellations will be considered only if the request is made within 7 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Perishable Items</h2>
                <p className="text-muted-foreground">
                  ABHIJAY JAIN does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Damaged or Defective Items</h2>
                <p className="text-muted-foreground">
                  In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 7 days of receipt of the products.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Product Expectations</h2>
                <p className="text-muted-foreground">
                  In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Manufacturer Warranty</h2>
                <p className="text-muted-foreground">
                  In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                </p>
              </section>

              <section className="p-6 rounded-2xl border-2 border-ink bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Refund Processing</h2>
                <p className="text-muted-foreground">
                  In case of any Refunds approved by ABHIJAY JAIN, it'll take 7-10 business days for the refund to be processed to the end customer.
                </p>
              </section>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-accent/30 text-center">
              <p className="text-muted-foreground">
                See also our <Link to="/terms" className="text-foreground underline hover:no-underline">Terms and conditions</Link>. For any questions regarding this policy, please{" "}
                <Link to="/contact" className="text-foreground underline hover:no-underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <SEOFooter />
    </div>
  );
};

export default RefundPolicy;
