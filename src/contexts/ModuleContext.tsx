import { createContext, useContext, useState, ReactNode } from 'react';

type Module = 'equity' | 'fo' | null;

interface ModuleContextType {
  currentModule: Module;
  setCurrentModule: (module: Module) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState<Module>(null);

  return (
    <ModuleContext.Provider value={{ currentModule, setCurrentModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
