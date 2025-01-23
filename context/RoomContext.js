// context/RoomContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getAllRooms, onMessage, joinRoom } from "@/utils/socketCon";
import { fetchRooms, incrementRoomMembers, fetchFromRedis } from "@/utils/postgresCon";
import { useLoader } from "./loadingContext";
import { getAuthStatus } from "@/utils/googleAuth";
import { all } from "axios";
import { getLoginUrl } from "@/utils/googleAuth";

const RoomContext = createContext();
export const RoomProvider = ({ children }) => {
  const [isRoomActive, setRoomCreated] = useState(false);
  const [stage, setStage] = useState(0)
  const [room, setRoom] = useState("");
  const [language, setLanguage] = useState('python');
  const { showLoader, hideLoader } = useLoader();
  const [invalidRoom, setInvalidroom] = useState(false);

  // In RoomContext.js, uncomment and modify the first useEffect
  useEffect(() => {
    // Initialize socket connection
    const socket = connectSocket();

    // Set up other socket listeners after connection
    getAllRooms();
    onMessage((data) => {
      console.log("All rooms", data)
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');

    async function fetchAllRooms() {
      try {
        showLoader();
        const allRooms = await fetchRooms();
        if (allRooms.error === 'Not authenticated') {
          if (tokenFromUrl) {
            localStorage.setItem('pendingRoomToken', tokenFromUrl);
          }
          // Add returnUrl parameter to login URL
          const currentUrl = window.location.href;
          const loginUrl = getLoginUrl();
          const loginUrlWithReturn = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}returnUrl=${encodeURIComponent(currentUrl)}`;
          console.log(loginUrlWithReturn);
          window.location.href = loginUrlWithReturn;
          return;
        }

        // Check if we have a pending room token from a previous redirect
        const pendingToken = tokenFromUrl || localStorage.getItem('pendingRoomToken');
        if (pendingToken) {
          localStorage.removeItem('pendingRoomToken'); // Clean up

          const foundRoom = allRooms.find((room) => room.token === pendingToken);
          console.log("Found room", foundRoom);

          if (foundRoom) {
            const currentUrl = window.location.href;
            const baseUrl = currentUrl.split('?')[0];
            const newUrl = `${baseUrl}?roomId=${foundRoom.room_id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

            const newMsg = {
              type: "join",
              name: "You",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            joinRoom(foundRoom.room_id, newMsg);
            setRoom(foundRoom.room_id);
            setRoomCreated(true);
            setStage(2);
            try {
              const response = await incrementRoomMembers(foundRoom.room_id);
              console.log(response);
            }
            catch (e) {
              console.error("Unable to increase Members under this room", e);
            }
          }
          else{
            setInvalidroom(true);
            return;
          }
        }
      }
      catch (e) {
        console.error("Error while getting all rooms", e);
      }
      finally {
        hideLoader();
      }
    }

    if (tokenFromUrl || localStorage.getItem('pendingRoomToken')) {
      fetchAllRooms();
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('roomId');

    async function roomOnRedis() {
      try {
        if (!roomFromUrl) {
          console.error("No room ID provided");
          setRoomCreated(false);
          setStage(0);
          return;
        }

        const roomData = await fetchFromRedis(roomFromUrl);
        console.log("Room data", roomData);

        // Check if roomData exists and has the expected structure
        if (!roomData) {
          console.error("Room not found");
          setRoomCreated(false);
          setStage(0);
          return;
        }

        const newMsg = {
          type: "join",
          name: "You",
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        // Check for valid token
        if (roomData.token && typeof roomData.token === 'string') {
          try {
            await joinRoom(roomFromUrl, newMsg);
            setRoom(roomFromUrl);
            setRoomCreated(true);
            setStage(2);
          } catch (joinError) {
            console.error("Error joining room:", joinError);
            setRoomCreated(false);
            setStage(0);
          }
        } else {
          setInvalidroom(true);
          console.log("Invalid or missing room token");
          setRoomCreated(false);
          setStage(0);
        }
      } catch (e) {
        console.error("Error while getting room from Redis:", e);
        setRoomCreated(false);
        setStage(0);
      }
    }

    async function checkAndInitializeRoom() {
      try {
        const userData = await getAuthStatus();

        if (!userData) {
          console.log("Not authenticated");
          const currentUrl = window.location.href;
          const loginUrl = getLoginUrl();
          // Ensure proper URL encoding and handling of special characters
          const encodedUrl = encodeURIComponent(currentUrl);
          const loginUrlWithReturn = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}returnUrl=${encodedUrl}`;
          console.log("Redirecting to:", loginUrlWithReturn);
          window.location.href = loginUrlWithReturn;
          return;
        }

        await roomOnRedis();
      } catch (error) {
        console.error("Error in authentication process:", error);
        // Handle authentication errors gracefully
        const currentUrl = window.location.href;
        const loginUrl = getLoginUrl();
        window.location.href = `${loginUrl}?error=auth_failed&returnUrl=${encodeURIComponent(currentUrl)}`;
      }
    }

    if (roomFromUrl) {
      checkAndInitializeRoom();
    } else {
      console.log("No room ID in URL");
      setRoomCreated(false);
      setStage(0);
    }

    // Cleanup function
    return () => {
      // Add any cleanup logic if needed
    };
  }, []);

  return (
    <RoomContext.Provider value={{ isRoomActive, setRoomCreated, stage, setStage, room, setRoom, language, setLanguage, invalidRoom, setInvalidroom}}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);