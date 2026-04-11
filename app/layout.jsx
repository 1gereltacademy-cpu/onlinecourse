import "./globals.css";

export const metadata = {
  title: "Gerelt Academy",
  description: "Online course platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>
        

        
        {children}</body>
    </html>
  );
}
