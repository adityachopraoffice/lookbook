import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | Shoppable Lookbooks" },
    { name: "description", content: "Privacy Policy for the Shoppable Lookbooks Shopify App." },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      padding: '4rem 2rem',
      lineHeight: '1.6'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '3rem',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(to right, #8b5cf6, #38bdf8)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#e2e8f0' }}>1. Introduction</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
            Welcome to Shoppable Lookbooks ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you install and use our Shopify App.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#e2e8f0' }}>2. Information We Collect</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
            When you install the App, we are automatically able to access certain types of information from your Shopify account:
          </p>
          <ul style={{ color: '#cbd5e1', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Store Information:</strong> Your store name, primary domain, and contact email address.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Product Information:</strong> Details about your products, including titles, prices, and images, strictly for the purpose of creating shoppable hotspots.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Theme Data:</strong> We may inject code into your store's theme to display the lookbooks on your storefront.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#e2e8f0' }}>3. How We Use Your Information</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
            We use the collected information for the following purposes:
          </p>
          <ul style={{ color: '#cbd5e1', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>To provide and maintain the App's core functionality.</li>
            <li style={{ marginBottom: '0.5rem' }}>To generate interactive lookbooks and track storefront engagement (views and clicks).</li>
            <li style={{ marginBottom: '0.5rem' }}>To communicate with you regarding updates, support, or billing.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#e2e8f0' }}>4. Data Retention</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
            We retain your data only for as long as your store has our App installed. If you uninstall the App, we will automatically schedule your lookbook data and associated configurations for deletion in accordance with Shopify's data retention guidelines.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#e2e8f0' }}>5. Contact Us</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@hostnestic.online.
          </p>
        </section>
        
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Home</a>
        </div>
      </div>
    </div>
  );
}
