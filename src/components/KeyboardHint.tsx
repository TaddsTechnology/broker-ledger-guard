export const KeyboardHint = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-4 py-2 shadow-elevated text-sm text-muted-foreground flex items-center gap-2">
      {children}
    </div>
  );
};
