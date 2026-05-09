import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout() {
  return (
    <div className="flex bg-void min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col relative">
        <TopBar />
        <main className="app-main flex-1 p-8 md:p-12 z-0 relative">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
