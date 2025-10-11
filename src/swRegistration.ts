// src/swRegistration.ts
// Service Worker registration with update detection and user notification

interface UpdateAvailableEvent extends Event {
  waiting?: ServiceWorker;
}

interface ServiceWorkerRegistrationWithUpdate extends ServiceWorkerRegistration {
  waiting?: ServiceWorker;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistrationWithUpdate | null = null;
  private updateToastShown = false;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[360MVP] SW: Service workers not supported');
      return;
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[360MVP] SW: Registered successfully');

      // Set up update detection
      this.setupUpdateDetection();
      
      // Check for updates immediately
      this.checkForUpdates();
      
      // Check for updates every 30 seconds
      setInterval(() => this.checkForUpdates(), 30000);
      
    } catch (error) {
      console.error('[360MVP] SW: Registration failed:', error);
    }
  }

  private setupUpdateDetection(): void {
    if (!this.registration) return;

    // Handle when a new service worker is waiting
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[360MVP] SW: New version available');
            this.showUpdateToast();
          }
        });
      }
    });

    // Handle when the waiting service worker becomes active
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[360MVP] SW: Controller changed, reloading page');
      window.location.reload();
    });

    // Check if there's already a waiting worker
    if (this.registration.waiting) {
      this.showUpdateToast();
    }
  }

  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.log('[360MVP] SW: Update check failed:', error);
    }
  }

  private showUpdateToast(): void {
    if (this.updateToastShown) return;
    this.updateToastShown = true;

    console.log('[360MVP] SW: Showing update toast');

    // Create toast notification
    const toast = this.createUpdateToast();
    document.body.appendChild(toast);

    // Auto-hide after 30 seconds if not interacted with
    setTimeout(() => {
      if (toast.parentElement) {
        this.hideUpdateToast(toast);
      }
    }, 30000);
  }

  private createUpdateToast(): HTMLElement {
    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">
              Nueva versión disponible
            </div>
            <div style="font-size: 14px; opacity: 0.8;">
              Actualiza para obtener las últimas mejoras
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 12px;">
          <button id="sw-update-dismiss" style="
            background: transparent;
            border: 1px solid #6b7280;
            color: #d1d5db;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
          ">
            Después
          </button>
          <button id="sw-update-accept" style="
            background: #10b981;
            border: none;
            color: white;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">
            Actualizar
          </button>
        </div>
      </div>
      
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        #sw-update-toast button:hover {
          transform: translateY(-1px);
          transition: transform 0.1s ease;
        }
      </style>
    `;

    // Add event listeners
    const dismissBtn = toast.querySelector('#sw-update-dismiss') as HTMLElement;
    const acceptBtn = toast.querySelector('#sw-update-accept') as HTMLElement;

    dismissBtn?.addEventListener('click', () => {
      this.hideUpdateToast(toast);
    });

    acceptBtn?.addEventListener('click', () => {
      this.acceptUpdate();
    });

    return toast;
  }

  private hideUpdateToast(toast: HTMLElement): void {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      this.updateToastShown = false;
    }, 300);
  }

  private acceptUpdate(): void {
    if (!this.registration?.waiting) {
      console.log('[360MVP] SW: No waiting worker found');
      return;
    }

    console.log('[360MVP] SW: Accepting update');
    
    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page to activate the new version
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  // Public method to manually check for updates
  async manualUpdate(): Promise<void> {
    console.log('[360MVP] SW: Manual update check requested');
    await this.checkForUpdates();
  }

  // Public method to get registration status
  getRegistration(): ServiceWorkerRegistrationWithUpdate | null {
    return this.registration;
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

// Auto-register when module is imported
// TEMPORARILY DISABLED to fix console errors
if (typeof window !== 'undefined' && false) {
  swManager.register().catch(console.error);
}

export default swManager;








