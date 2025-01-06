// context/RoomContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getAllRooms, onMessage, joinRoom } from "@/utils/socketCon";

const RoomContext = createContext();
export const RoomProvider = ({ children }) => {
  const [isRoomActive, setRoomCreated] = useState(false);
  const [stage, setStage] = useState(0)
  const [room, setRoom] = useState("");
  const [language, setLanguage] = useState('python');

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
    const roomFromUrl = params.get('roomId');
    async function fetchAllRooms() {
      try {
        const response = await fetch("http://localhost:3300/api/v1/room");
        const allRooms = await response.json();
        const foundRoom = allRooms.find((room) => {
          return room.room_id === roomFromUrl
        })
        console.log("Found room", foundRoom)
        if (foundRoom) {
          const newMsg = {
            type: "join",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          joinRoom(roomFromUrl, newMsg);
          setRoom(roomFromUrl);
          setRoomCreated(true);
          setStage(2);
          try {
            await fetch(`http://localhost:3300/api/v1/room/${roomFromUrl}/increment`, {
              method: "PATCH",
              headers: { 'Content-Type': 'application/json' },
            })
          }
          catch (e) {
            console.error("Unable to increase Members under this room", e)
          }
        }
      }
      catch (e) {
        console.error("Error while getting all rooms", e);
      }
    }
    if (roomFromUrl)
      fetchAllRooms();
  }, [])

  return (
    <RoomContext.Provider value={{ isRoomActive, setRoomCreated, stage, setStage, room, setRoom, language, setLanguage }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);