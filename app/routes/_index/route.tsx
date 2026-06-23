import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1 className={styles.heading}>
            Shoppable Lookbooks <br /><span>for Shopify</span>
          </h1>
          <p className={styles.text}>
            Turn your lifestyle photos into interactive shopping experiences. Tag products, choose from multiple premium layouts, and increase conversions instantly.
          </p>
        </div>

        {/* Login Form */}
        {showForm && (
          <div className={styles.formContainer}>
            <h2 className={styles.formHeading}>Install or Log in to your store</h2>
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label}>
                <span>Shop domain</span>
                <input className={styles.input} type="text" name="shop" placeholder="my-shop-domain.myshopify.com" required />
                <span>Enter your myshopify.com domain</span>
              </label>
              <button className={styles.button} type="submit">
                Log in / Install
              </button>
            </Form>
          </div>
        )}

        {/* Features Section */}
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h3>Interactive Hotspots</h3>
            <p>Tag multiple products directly on your lifestyle images. Customers can hover over dots to see product details and add to cart instantly.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
            <h3>6 Premium Layouts</h3>
            <p>Choose from Grid, Hero, Slideshow, Masonry, Vertical Stack, and Featured Mosaic layouts to perfectly match your brand's aesthetic.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <h3>Storefront Analytics</h3>
            <p>Built-in tracking lets you monitor total lookbook views and hotspot clicks so you can measure engagement and optimize conversions.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
