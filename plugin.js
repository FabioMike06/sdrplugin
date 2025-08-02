Plugins.connect_notify.init = async function () {
  const WS_URL = "wss://sdrapi.mastrovito.eu"; // change this
  const USERLIST_URL = "https://sdrapi.mastrovito.eu/users"; // you must expose this with HTTP
  const HEARTBEAT_INTERVAL = 10000;

  // Helper: Get cookie by name
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // DOM container for user list
  const userBox = $("<div id='active-users-box' style='position:fixed;bottom:10px;right:10px;background:#222;color:#fff;padding:10px;font-size:14px;z-index:9999;border-radius:8px;'>Users: loading...</div>");
  $("body").append(userBox);

  const nick = getCookie("user") || "Unknown";

  // WebSocket connection
  const ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    Plugins._debug("WebSocket connected");

    // Start sending heartbeats
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "heartbeat", nick }));
      }
    }, HEARTBEAT_INTERVAL);
  };

  // Optional: Receive real-time user updates
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "users") {
        updateUserBox(data.users);
      }
    } catch (err) {
      console.error("Bad WS message", err);
    }
  };

  // Poll fallback (if you don't want to use ws.onmessage)
  async function fetchUsers() {
    try {
      const res = await fetch(USERLIST_URL);
      const json = await res.json();
      updateUserBox(json.users || []);
    } catch (err) {
      console.error("Failed to fetch user list:", err);
    }
  }

  function updateUserBox(users) {
    const names = users.map(u => u.nick).join(', ');
    userBox.html("Users: " + (names || "None"));
  }

  setInterval(fetchUsers, 15000); // fallback polling (optional)

  return true;
};
