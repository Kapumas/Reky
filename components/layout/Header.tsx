'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Settings } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { ManageBookingsModal } from '@/components/manage/ManageBookingsModal';
import { BoltIcon } from '@/components/ui/BoltIcon';

export function Header() {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-semibold flex items-center gap-2" style={{ fontSize: '20px', color: '#1F2933' }}>
                <BoltIcon size={24} />
                {APP_NAME}
              </Link>
              <span style={{ color: '#6B7280', fontSize: '14px' }} className="hidden sm:inline">
                Colinas del Mameyal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#1F2933',
                  fontSize: '14px',
                  minHeight: '44px',
                }}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendario</span>
              </Link>
              <button
                onClick={() => setIsManageModalOpen(true)}
                className="px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: '#2F9E44',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '44px',
                }}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Mis Reservas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ManageBookingsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </>
  );
}
