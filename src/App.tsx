import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Shield } from 'lucide-react';
import DomainTable from './components/DomainTable';
import AddDomainForm from './components/AddDomainForm';
import ThemeToggle from './components/ThemeToggle';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <Toaster position="top-right" />
        
        <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SSL Monitor</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <AddDomainForm />
            <DomainTable />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;