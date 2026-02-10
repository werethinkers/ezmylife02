import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
              Cancellation & Refund Policy
            </h1>
            <p className="text-muted-foreground">Last updated on Dec 3, 2025</p>
          </div>

          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <p>
                ABHIJAY JAIN believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>
            </div>

            <div className="space-y-6">
              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Cancellation Requests</h2>
                <p className="text-muted-foreground">
                  Cancellations will be considered only if the request is made within 7 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                </p>
              </section>

              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Perishable Items</h2>
                <p className="text-muted-foreground">
                  ABHIJAY JAIN does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                </p>
              </section>

              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Damaged or Defective Items</h2>
                <p className="text-muted-foreground">
                  In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 7 days of receipt of the products.
                </p>
              </section>

              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Product Expectations</h2>
                <p className="text-muted-foreground">
                  In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                </p>
              </section>

              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Manufacturer Warranty</h2>
                <p className="text-muted-foreground">
                  In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                </p>
              </section>

              <section className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h2 className="font-display text-xl font-semibold">Refund Processing</h2>
                <p className="text-muted-foreground">
                  In case of any Refunds approved by ABHIJAY JAIN, it'll take 7-10 business days for the refund to be processed to the end customer.
                </p>
              </section>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-accent/30 text-center">
              <p className="text-muted-foreground">
                For any questions regarding this policy, please{" "}
                <Link to="/contact" className="text-foreground underline hover:no-underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ezmy.life" className="h-10 object-contain" />
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
              <Link to="/subscription" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Ezyourlife. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;
