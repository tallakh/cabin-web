import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steens hytter",
  description: "Family cabin booking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const path = window.location.pathname;
                const locale = path.split('/')[1];
                if (locale === 'no' || locale === 'en') {
                  document.documentElement.lang = locale;
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
