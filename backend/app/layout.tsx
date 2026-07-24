/**
 * Minimal layout so Next.js can run the backend as a standalone app.
 * The backend serves APIs only — there is no UI rendered here.
 */
export const metadata = {
  title: "LETTY Backend",
  description: "LETTY e-commerce API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
