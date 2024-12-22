// context/RoomContext.js
"use client";

import { createContext, useContext, useState } from "react";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [isRoomActive, setRoomCreated] = useState(false);

  return (
    <RoomContext.Provider value={{ isRoomActive, setRoomCreated }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);
