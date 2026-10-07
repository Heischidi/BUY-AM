import Script from 'next/script';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ChatAssistant from '@/components/chat/ChatAssistant';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';

export const metadata: Metadata = {
  title: 'Buy Am | Buy it at Buy Am.',
  description: "Nigeria's premier marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
            <ChatAssistant />
          </CartProvider>
        </AuthProvider>

        <Script
          src="https://chidi-ai-core.vercel.app/widget.js"
          data-widget-id="default-workspace-id"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
