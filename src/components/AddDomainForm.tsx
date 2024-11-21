import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const AddDomainForm = () => {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [notifyDays, setNotifyDays] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const addDomainMutation = useMutation({
    mutationFn: async (newDomain: { domain: string; email: string; notifyDays: number }) => {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDomain),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add domain');
      }
      return data;
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain added successfully');
      setDomain('');
      setEmail('');
      setNotifyDays('30');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    addDomainMutation.mutate({
      domain,
      email,
      notifyDays: parseInt(notifyDays),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1">
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Domain
          </label>
          <input
            type="text"
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>
        
        <div className="col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notification Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>
        
        <div className="col-span-1">
          <label htmlFor="notifyDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notify Days Before
          </label>
          <select
            id="notifyDays"
            value={notifyDays}
            onChange={(e) => setNotifyDays(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Domain
        </button>
      </div>
    </form>
  );
};

export default AddDomainForm;