import React from 'react';

interface LoadingOrEmptyProps {
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
}

const LoadingOrEmpty: React.FC<LoadingOrEmptyProps> = ({ loading, empty, emptyMessage, children }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex items-center justify-center min-h-[100px] text-gray-400">{emptyMessage || 'No data available.'}</div>
    );
  }
  return <>{children}</>;
};

export default LoadingOrEmpty;
