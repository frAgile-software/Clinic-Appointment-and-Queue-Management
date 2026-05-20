import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../api/useApi';
import './NotificationCenter.css';

const sortNotifications = (items) => {
  return [...items].sort((a, b) => new Date(b.Time) - new Date(a.Time));
};

export default function NotificationCenter({ userId }) {
  console.log("NotificationCenter rendered with userId:", userId);
  const api = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const fetchNotifications = useCallback(async () => {
  if (!userId) {
    setNotifications([]);
    return;
  }

  try {
    setLoading(true);
    setError("");
    const data = await api.notifications.getNotifs(userId);
    setNotifications(Array.isArray(data) ? sortNotifications(data) : []);
  } catch (fetchError) {
    console.error("Could not fetch notifications:", fetchError);
    setNotifications([]);
    setError("Could not load notifications.");
  } finally {
    setLoading(false);
  }
}, [api, userId]);

  const toggleNotifications = async () => {
    setIsOpen((prev) => !prev);
  };

  const handleClearSeen = async () => {
    if (!userId) return;

    try {
      setError("");
      await api.notifications.deleteSeen(userId);
      setNotifications((prev) => prev.filter((notification) => !notification.Seen));
    } catch (clearError) {
      console.error("Could not clear seen notifications:", clearError);
      setError("Could not clear notifications.");
    }
  };

  const handleMarkSeen = async () => {
    if (!userId) return;

    try {
      setError("");
      await api.notifications.markSeen(userId);
      setNotifications((prev) => prev.map((notification) => ({
        ...notification,
        Seen: true
      })));
    } catch (markError) {
      console.error("Could not mark seen notifications:", markError);
      setError("Could not mark notifications.");
    }
  };

  useEffect(() => {
    console.log("fetching notifs for user id:",userId)
    fetchNotifications();

    //poll every 10 secs
    const intervalId = setInterval(() => {
      console.log("Polling for new notifications...");
      fetchNotifications();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [userId,fetchNotifications]);

  return (
    <aside className="notif-wrapper">
      <button className="btn" onClick={toggleNotifications} type="button">
      Notifications {notifications.filter(n => !n.Seen).length > 0 && <span className="notif-badge">{notifications.filter(n => !n.Seen).length}</span>}
      </button>

      {isOpen && (
        <aside className="notif-dropdown">
          <header className="notif-header">
            <h4>Notifications</h4>
            <section className="notif-actions">
              <button className="btn-text" onClick={handleMarkSeen} type="button">Mark all as seen</button>
              <button className="btn-text" onClick={handleClearSeen} type="button">Clear Seen</button>
            </section>
          </header>

          <section className="notif-list">
            {loading ? (
              <p className="notif-empty">Loading notifications...</p>
            ) : error ? (
              <p className="notif-empty">{error}</p>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <article key={notification._id} className={`notif-item ${notification.Seen ? '' : 'unseen'}`}>
                  <p>{notification.Message}</p>
                  <small>
                    {new Date(notification.Time).toLocaleString([], {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </small>
                </article>
              ))
            ) : (
              <p className="notif-empty">No new notifications</p>
            )}
          </section>
        </aside>
      )}
    </aside>
  );
}
