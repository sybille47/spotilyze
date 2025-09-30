import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div>
      <h2>Welcome to Spotilyze</h2>
      <p>Analyze your Spotify listening history!</p>
    </div>
  );
}
