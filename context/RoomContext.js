// context/RoomContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const RoomContext = createContext();
import { joinRoom } from "@/utils/socketCon";
export const RoomProvider = ({ children }) => {
  const [isRoomActive, setRoomCreated] = useState(false);

  return (
    <RoomContext.Provider value={{ isRoomActive, setRoomCreated, stage, setStage, room, setRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);
