import './globals.css';

export const metadata = {
  title: 'Stellaris Deck — Walkable Space World',
  description:
    'A walkable 3D space world with a gravitational three-body star system, real solar-system planets, cinematic video capture, and a PostgreSQL world library.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
