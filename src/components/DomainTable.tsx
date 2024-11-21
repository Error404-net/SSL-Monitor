import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Domain {
  id: string;
  domain: string;
  email: string;
  notifyDays: number;
  validFrom: string;
  validTo: string;
  issuer: string;
}

const DomainTable = () => {
  const queryClient = useQueryClient();

  const { data: domains, isLoading, error } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await fetch('/api/domains');
      if (!response.ok) throw new Error('Failed to fetch domains');
      return response.json();
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete domain');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove domain');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 py-8">
        Failed to load domains. Please try again later.
      </div>
    );
  }

  const getExpiryStatus = (validTo: string) => {
    const daysUntilExpiry = Math.ceil((new Date(validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (daysUntilExpiry <= 30) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  return (
    <div className="max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Domain</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valid From</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valid Until</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issuer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notification</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {domains?.map((domain: Domain) => (
            <tr key={domain.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{domain.domain}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{domain.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(domain.validFrom), 'PP')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getExpiryStatus(domain.validTo)}`}>
                  {format(new Date(domain.validTo), 'PP')}
                  <span className="ml-1">
                    ({formatDistanceToNow(new Date(domain.validTo), { addSuffix: true })})
                  </span>
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {domain.issuer}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {domain.notifyDays} days before
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => deleteDomainMutation.mutate(domain.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
          {domains?.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No domains added yet. Add your first domain above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DomainTable;