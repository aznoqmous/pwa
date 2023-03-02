function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        /*Notification.requestPermission(permission => {
            if (permission === "granted") {
                console.log("Notifications permission not granted")
            } else console.error("Permission was not granted.");
        });*/
        await requestNotifications(registration)
        await requestPushNotification(registration)
        await requestBackgroundSync(registration)
    });
}

async function requestNotifications(registration){
    let result = await Notification.requestPermission()
}

async function requestBackgroundSync(registration) {
    let status = await navigator.permissions.query({name: "periodic-background-sync"})
    console.log(status, registration)
    if (status.state === 'granted' && 'periodicSync' in registration) {
        try {
            await registration.periodicSync.register('sync', {
                minInterval: 24 * 60 * 60 * 1000,
                networkState: "any"
            });
            registration.addEventListener('periodicsync', (e) => {
                console.log("Periodic sync", e)
            })
            console.log('Periodic Sync registered');
            navigator.serviceWorker.addEventListener('message', async (event) => {
                console.log(e)
                registration.showNotification(e.data.tag)
                if (event.data.tag === 'sync') {
                }
            });
        } catch (e) {
            console.log('Periodic Sync could not be registered!', e);
        }
    }
}
async function requestPushNotification(registration){
    let subscription = await registration.pushManager.getSubscription()
    if(!subscription){
        // Get the server's public key
        const response = await fetch('/vapidPublicKey');
        const vapidPublicKey = await response.text();
        // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
        // urlBase64ToUint8Array() is defined in /tools.js
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
        // send notifications that don't have a visible effect for the user).
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });
    }

    // Send the subscription details to the server using the Fetch API.
    fetch('/register', {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            subscription
        }),
    });

    document.getElementById('instantPush').onclick = function() { sendPushNotification("Push notification !", 0) };
    document.getElementById('programmedPush').onclick = function() { sendPushNotification("Push notification !", 5) };

    function sendPushNotification(message="New push notification", delay=0){
        fetch('/sendNotification', {
            method: 'post',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                subscription,
                delay,
                ttl: 2000,
                message
            }),
        });
    }
}

/*
  const available = document.querySelector('.available');
  const notAvailable = document.querySelector('.not-available');
  const ul = document.querySelector('ul');
  const lastUpdated = document.querySelector('.last-updated');
  
  const updateContent = async () => {
    const data = await fetch(
      'https://worldtimeapi.org/api/timezone/Europe/London.json'
    ).then((response) => response.json());
    return new Date(data.unixtime * 1000);
  };
  
  const registerPeriodicBackgroundSync = async (registration) => {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync',
    });
    if (status.state === 'granted' && 'periodicSync' in registration) {
      try {
        // Register the periodic background sync.
        await registration.periodicSync.register('content-sync', {
          // An interval of one day.
          minInterval: 24 * 60 * 60 * 1000,
        });
        available.hidden = false;
        notAvailable.hidden = true;
  
        // List registered periodic background sync tags.
        const tags = await registration.periodicSync.getTags();
        if (tags.length) {
          ul.innerHTML = '';
        }
        tags.forEach((tag) => {
          const li = document.createElement('li');
          li.textContent = tag;
          ul.append(li);
        });
  
        // Update the user interface with the last periodic background sync data.
        const backgroundSyncCache = await caches.open('periodic-background-sync');
        if (backgroundSyncCache) {
          const backgroundSyncResponse =
            backgroundSyncCache.match('/last-updated');
          if (backgroundSyncResponse) {
            lastUpdated.textContent = `${await fetch('/last-updated').then(
              (response) => response.text()
            )} (periodic background-sync)`;
          }
        }
  
        // Listen for incoming periodic background sync messages.
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data.tag === 'content-sync') {
            lastUpdated.textContent = `${await updateContent()} (periodic background sync)`;
          }
        });
      } catch (err) {
        console.error(err.name, err.message);
        available.hidden = true;
        notAvailable.hidden = false;
        lastUpdated.textContent = 'Never';
      }
    } else {
      available.hidden = true;
      notAvailable.hidden = false;
      lastUpdated.textContent = `${await updateContent()} (manual)`;
    }
  };
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service worker registered for scope', registration.scope);
  
      await registerPeriodicBackgroundSync(registration);
    });
  }*/