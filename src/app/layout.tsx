export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Dot GEN</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
