import React, { useEffect } from 'react';
import { useLifeOSStore } from './store/useLifeOSStore';
import { audioEngine } from './audio/engine';
import { AutoSidebar } from './components/layout/AutoSidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/modals/CommandPalette';
import { TaskDrawer } from './components/modals/TaskDrawer';
import { QuickTaskModal } from './components/modals/QuickTaskModal';
import { QuickExpenseModal } from './components/modals/QuickExpenseModal';
import { EventModal } from './components/modals/EventModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { RoutineModal } from './components/modals/RoutineModal';
import { Toast } from './components/common/Toast';
import { ConfirmModal } from './components/common/ConfirmModal';
import { PinLock } from './components/common/PinLock';
import { PwaInstallBar } from './components/common/PwaInstallBar';
import { FloatingTimer } from './components/common/FloatingTimer';
import { useAppNotifications } from './hooks/useAppNotifications';

import { TodayPage } from './pages/TodayPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { FocusPage } from './pages/FocusPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { FinancePage } from './pages/FinancePage';
import { ReviewPage } from './pages/ReviewPage';
import { MirrorAIPage } from './pages/MirrorAIPage';
import { SettingsPage } from './pages/SettingsPage';
import { ViewKey } from './types';

const VALID_VIEWS: ViewKey[] = ['today','tasks','calendar','projects','focus','routines','finance','review','mirror','settings'];

export const App: React.FC = () => {
  const activeView = useLifeOSStore((state) => state.activeView);
  const isTimerRunning = useLifeOSStore((state) => state.timerState.isRunning);

  // Engine notifikasi lokal: jadwal, timer ongoing, sesi selesai
  useAppNotifications();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        useLifeOSStore.getState().tickTimer();
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning]);

  // Sinkron audio ambient global: tetap bunyi walau ganti page/tab
  const ambientPlaying = useLifeOSStore((state) => state.data.focus.ambientPlaying);
  const ambientVolume = useLifeOSStore((state) => state.data.focus.volume);
  useEffect(() => {
    audioEngine.setBinaural(ambientPlaying, ambientVolume ?? 50);
  }, [ambientPlaying, ambientVolume]);

  // Minta browser jangan hapus LocalStorage otomatis (persistent storage)
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { storage?: { persist?: () => Promise<boolean> } };
      if (nav.storage?.persist) {
        nav.storage.persist().then((granted) => {
          if (!granted) console.info('Persistent storage tidak diberikan browser.');
        });
      }
    } catch {
      /* abaikan — browser lama */
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewKey;
      if (hash && VALID_VIEWS.includes(hash)) {
        useLifeOSStore.getState().setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useLifeOSStore.getState();
      if (st.isLocked) return;
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        st.isCmdkOpen ? st.closeCmdk() : st.openCmdk();
        return;
      }
      if (e.key === 'Escape') {
        st.closeCmdk(); st.closeTaskModal(); st.closeExpenseModal();
        st.closeEventModal(); st.closeProjectModal(); st.closeRoutineModal();
        st.closeDrawer(); st.setNotifOpen(false); st.closeSidebar();
        return;
      }
      if (typing) return;
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); st.openTaskModal(); }
      if (e.key === '/') { e.preventDefault(); st.openCmdk(); }
      if (e.key.toLowerCase() === 'e' && e.altKey) { e.preventDefault(); st.openExpenseModal(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderCurrentPage = () => {
    switch (activeView) {
      case 'today': return <TodayPage />;
      case 'tasks': return <TasksPage />;
      case 'calendar': return <CalendarPage />;
      case 'projects': return <ProjectsPage />;
      case 'focus': return <FocusPage />;
      case 'routines': return <RoutinesPage />;
      case 'finance': return <FinancePage />;
      case 'review': return <ReviewPage />;
      case 'mirror': return <MirrorAIPage />;
      case 'settings': return <SettingsPage />;
      default: return <TodayPage />;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-default text-body-default text-on-surface antialiased flex flex-col selection:bg-tertiary-fixed selection:text-on-tertiary-fixed overflow-x-hidden">
      <AutoSidebar />
      <Header />
      <main key={activeView} className="pt-[72px] px-3 sm:px-space-md lg:px-space-xl pb-28 sm:pb-space-2xl max-w-7xl mx-auto w-full flex-1 min-w-0 animate-fade-in">
        {renderCurrentPage()}
      </main>
      <TaskDrawer />
      <CommandPalette />
      <QuickTaskModal />
      <QuickExpenseModal />
      <EventModal />
      <ProjectModal />
      <RoutineModal />
      <FloatingTimer />
      <ConfirmModal />
      <PwaInstallBar />
      <PinLock />
      <Toast />
    </div>
  );
};

export default App;
