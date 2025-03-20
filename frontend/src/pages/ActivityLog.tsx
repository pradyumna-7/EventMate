"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { Link } from "react-router-dom";

interface Activity {
  action: string;
  user: string;
  timestamp: string;
  id: string;
}

const ActivityLog = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const backendUrl = "http://localhost:5000";

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/activities/all`);
      setActivities(response.data.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleDeleteAllActivities = async () => {
    if (
      confirm(
        "Are you sure you want to delete all activity logs? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`${backendUrl}/api/activities/delete-all`);
        setActivities([]);
      } catch (error) {
        console.error("Error deleting activities:", error);
      }
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActivityColor = (action: string): string => {
    if (action.toLowerCase().includes("verify")) return "bg-green-500";
    if (action.toLowerCase().includes("delete")) return "bg-red-500";
    if (action.toLowerCase().includes("scan")) return "bg-purple-500";
    if (action.toLowerCase().includes("generate")) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
          <p className="text-gray-500">View and manage system activities</p>
        </div>
        <button
          className="p-2 text-red-600 hover:text-red-800 rounded-full relative group transition-all duration-200 ease-in-out"
          onClick={handleDeleteAllActivities}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Trash2 className="h-6 w-6" />
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap dark:bg-gray-900">
              Delete all activity logs
            </div>
          )}
        </button>
      </div>

      <Card className="p-6 bg-white shadow-lg rounded-xl dark:bg-gray-950 dark:shadow-gray-800">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-start space-x-4"
              >
                <div className="h-3 w-3 mt-2 rounded-full bg-gray-300"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div
                  className={`h-3 w-3 rounded-full ${getActivityColor(
                    activity.action
                  )}`}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    {activity.action} -{" "}
                    <span className="text-gray-700 dark:text-gray-200">{activity.user}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            No activities found
          </p>
        )}
      </Card>

      <div className="text-center">
        <Link
          to="/"
          className="text-sm text-blue-600 hover:text-blue-800 transition-all duration-200"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ActivityLog;
