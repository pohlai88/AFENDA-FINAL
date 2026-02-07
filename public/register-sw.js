if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Service worker registration
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then(function(registration) {
        console.log('✓ Service Worker registered:', registration.scope);

        // Check for updates immediately
        registration.update();

        // Check for updates periodically (every hour)
        setInterval(function() {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready, notify user
                console.log('✓ New content available, please refresh.');

                // Optionally auto-update by sending SKIP_WAITING message
                if (window.confirm('New version available! Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(function(error) {
        console.error('✗ Service Worker registration failed:', error);
      });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('✓ Service Worker controller changed');
      // Optionally reload the page
      // window.location.reload();
    });
  });
}
