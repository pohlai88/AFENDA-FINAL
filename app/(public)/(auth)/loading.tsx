export default function AuthLoading() {
  return (
    <main className="container mx-auto flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </main>
  );
}
