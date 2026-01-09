import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const styles = {
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
  };

  const { container, icon } = styles[type];

  return (
    <div
      className={`border rounded-lg p-4 flex gap-3 ${container} ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
