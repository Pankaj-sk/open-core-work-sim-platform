import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar } from 'lucide-react';

interface Artifact {
  id: string;
  title: string;
  type: string;
  description: string;
  createdAt: string;
  status: 'generated' | 'processing' | 'failed';
  size?: string;
}

const ArtifactCard: React.FC = () => {
  const [artifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, show empty state instead of hardcoded data
    // TODO: Implement real artifact fetching from backend API
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="text-primary-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Generated Artifacts</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-600">Loading artifacts...</div>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting_minutes':
        return <FileText size={20} className="text-blue-600" />;
      case 'performance_review':
        return <FileText size={20} className="text-green-600" />;
      case 'action_items':
        return <FileText size={20} className="text-purple-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Generated</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Processing</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const handleView = (artifact: Artifact) => {
    console.log('Viewing artifact:', artifact.title);
    // TODO: Implement artifact viewing
  };

  const handleDownload = (artifact: Artifact) => {
    console.log('Downloading artifact:', artifact.title);
    // TODO: Implement artifact download
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="text-primary-600" size={20} />
        <h2 className="text-xl font-semibold text-gray-900">Generated Artifacts</h2>
      </div>
      
      {artifacts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No artifacts generated yet</div>
          <p className="text-sm text-gray-400">Artifacts will be automatically generated based on your simulation interactions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {getTypeIcon(artifact.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{artifact.title}</h3>
                      {getStatusBadge(artifact.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{artifact.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{artifact.createdAt}</span>
                      </div>
                      {artifact.size && (
                        <span>{artifact.size}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(artifact)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    title="View artifact"
                  >
                    <Eye size={16} />
                  </button>
                  {artifact.status === 'generated' && (
                    <button
                      onClick={() => handleDownload(artifact)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Download artifact"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Artifacts will be automatically generated based on your simulation interactions and can be downloaded for review.
        </p>
      </div>
    </div>
  );
};

export default ArtifactCard; 