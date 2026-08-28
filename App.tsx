import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ContentVault } from './pages/ContentVault';
import { AIStudio } from './pages/AIStudio';
import { Calendar } from './pages/Calendar';
import { LeadsPipeline } from './pages/LeadsPipeline';
import { SocialInbox } from './pages/SocialInbox';
import { Login } from './pages/Login';
import { ViewState, Asset, User } from './types';
import { AuthUser, getCurrentSession, onAuthStateChange, signOut } from './services/authService';

// Helper to load assets from localStorage
const loadAssetsFromStorage = (): Asset[] => {
  try {
    const stored = localStorage.getItem('kadoshai_uploaded_assets');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load assets from localStorage:', e);
  }
  return [];
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>(loadAssetsFromStorage);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Persist uploaded assets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('kadoshai_uploaded_assets', JSON.stringify(uploadedAssets));
    } catch (e) {
      console.error('Failed to save assets to localStorage:', e);
    }
  }, [uploadedAssets]);

  // Check for existing session on mount with timeout fallback
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Create a timeout promise - if check takes more than 3 seconds, fall back to login
        const timeoutPromise = new Promise<{ user: null; error: string }>((resolve) => {
          setTimeout(() => resolve({ user: null, error: 'timeout' }), 3000);
        });

        const sessionPromise = getCurrentSession();

        // Race between session check and timeout
        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        if (result.user) {
          setUser({
            name: result.user.name,
            avatar: result.user.avatar || 'https://picsum.photos/id/64/100/100',
            role: result.user.role || 'User'
          });
          setCurrentView('vault');
        } else {
          setCurrentView('login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setCurrentView('login');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to auth state changes (only for logout events, not initial load)
  useEffect(() => {
    const { unsubscribe } = onAuthStateChange((authUser) => {
      // Only handle if we're already past the initial loading
      if (isCheckingAuth) return;

      if (authUser) {
        setUser({
          name: authUser.name,
          avatar: authUser.avatar || 'https://picsum.photos/id/64/100/100',
          role: authUser.role || 'User'
        });
        if (currentView === 'login') {
          setCurrentView('vault');
        }
      } else {
        setUser(null);
        setCurrentView('login');
      }
    });

    return () => unsubscribe();
  }, [currentView, isCheckingAuth]);

  const handleLogin = (authUser: AuthUser) => {
    setUser({
      name: authUser.name,
      avatar: authUser.avatar || 'https://picsum.photos/id/64/100/100',
      role: authUser.role || 'User'
    });
    setCurrentView('vault');
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentView('login');
    setSelectedAsset(null);
    setUploadedAssets([]);
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    // Reset selection if moving away from studio context
    if (view !== 'studio') {
      setSelectedAsset(null);
    }
  };

  const handleRepurpose = (asset: Asset) => {
    setSelectedAsset(asset);
    setCurrentView('studio');
  };

  // Simple Router Switch
  const renderView = () => {
    switch (currentView) {
      case 'vault':
        return <ContentVault onRepurpose={handleRepurpose} uploadedAssets={uploadedAssets} setUploadedAssets={setUploadedAssets} />;
      case 'studio':
        if (!selectedAsset) return <ContentVault onRepurpose={handleRepurpose} uploadedAssets={uploadedAssets} setUploadedAssets={setUploadedAssets} />;
        return (
          <AIStudio
            asset={selectedAsset}
            onBack={() => handleNavigate('vault')}
            onSchedule={() => handleNavigate('calendar')}
          />
        );
      case 'calendar':
        return <Calendar />;
      case 'inbox':
        return <SocialInbox />;
      case 'leads':
        return <LeadsPipeline />;
      default:
        return <ContentVault onRepurpose={handleRepurpose} uploadedAssets={uploadedAssets} setUploadedAssets={setUploadedAssets} />;
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'login' || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentView={currentView}
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
