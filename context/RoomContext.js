// context/RoomContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getAllRooms, onMessage, joinRoom } from "@/utils/socketCon";
import { fetchRooms, incrementRoomMembers, fetchFromRedis } from "@/utils/postgresCon";
import { useLoader } from "./loadingContext";

const RoomContext = createContext();
export const RoomProvider = ({ children }) => {
  const [isRoomActive, setRoomCreated] = useState(false);
  const [stage, setStage] = useState(0)
  const [room, setRoom] = useState("");
  const [language, setLanguage] = useState('python');
  const { showLoader, hideLoader } = useLoader();

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
        const foundRoom = allRooms.find((room) => room.token === tokenFromUrl);
        console.log("Found room", foundRoom)

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
            const response = incrementRoomMembers(foundRoom.room_id);
            console.log(response)
          }
          catch (e) {
            console.error("Unable to increase Members under this room", e)
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

    if (tokenFromUrl)
      fetchAllRooms();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('roomId');
  
    async function roomOnRedis() {
      try {
        const roomData = await fetchFromRedis(roomFromUrl); // Fetch room data based on roomId
        console.log("Room data", roomData);
        
        const newMsg = {
          type: "join",
          name: "You",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        if (roomData.token !== '') {
          joinRoom(roomFromUrl, newMsg);
          setRoom(roomFromUrl); // Set room ID if found
          setRoomCreated(true); // Indicate that the room is created
          setStage(2); // Update stage if necessary
        } else {
          setRoomCreated(false); // Indicate that the room is not created
          setStage(0); // Update stage if necessary
        }
      } catch (e) {
        console.error("Error while getting room from Redis", e);
      } finally {
      }
    }
    if (roomFromUrl) {
      roomOnRedis();
    }
  }, []);
  
  return (
    <RoomContext.Provider value={{ isRoomActive, setRoomCreated, stage, setStage, room, setRoom, language, setLanguage }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);