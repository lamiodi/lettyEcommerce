# Apple Pay Domain Association for Stripe

To enable Apple Pay on your live production domain (e.g. `houseofletty.com`):

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/settings/payments/apple_pay).
2. Click **Add new domain** and enter your production web domain.
3. Download the `apple-developer-merchantid-domain-association` verification file.
4. Place that file in this directory (`frontend/public/.well-known/apple-developer-merchantid-domain-association` without any file extension).
5. Click **Add** in Stripe to verify the domain.
