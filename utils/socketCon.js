import { io } from "socket.io-client";
import msgpack from 'msgpack-lite';

let socket;

// Binary conversion utilities
const convertToBinary = (data) => {
    if (!data) return null;
    try {
      return msgpack.encode(data);
    } catch (error) {
      console.error('Error encoding binary data:', error);
      return null;
    }
  };
  
  const convertFromBinary = (binaryData) => {
    if (!binaryData) return null;
    try {
      // Handle ArrayBuffer conversion
      if (binaryData instanceof ArrayBuffer) {
        binaryData = new Uint8Array(binaryData);
      }
      return msgpack.decode(Buffer.from(binaryData));
    } catch (error) {
      console.error('Error decoding binary data:', error);
      return null;
    }
  };

/**
 * Connects to the Socket.IO server and initializes the connection.
 */
export const connectSocket = () => {
    if (!socket) {
        socket = io("http://localhost:3002", {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socket.on("connect", () => {
            console.log("Connected to Socket.IO server:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from Socket.IO server");
        });
    }
    return socket;
};

/**
 * Retrieves the current socket instance.
 * Throws an error if the socket is not initialized.
 */
export const getSocket = () => {
    if (!socket) {
        // throw new Error("Socket not initialized. Call `connectSocket` first.");
    }
    return socket;
};

// In socketCon.js
export const sendLanguageUpdate = (room, message) => {
    const socket = getSocket();
    if (socket && room && message) {
        socket.emit("languageUpdate", { room, message });
    } else {
        console.error("Socket, room, and language are required to send language updates.");
    }
};

export const onLanguageUpdate = (callback) => {
    const socket = getSocket();
    if (socket) {
        socket.on("languageUpdate", (data) => {
            callback(data);
        });
    }
};

export const offLanguageUpdate = () => {
    const socket = getSocket();
    if (socket) {
        socket.off("languageUpdate");
    }
};

export const sendEditorUpdate = (room, message) => {
    const socket = getSocket();
    if (socket && room && message) {
        console.log("SOCKET_CON: Sending editor update");
        console.log("SOCKET_CON: Room:", room);
        console.log("SOCKET_CON: Message:", message);

        socket.emit("editorUpdate", { room, message });
    } else {
        console.error("Socket, room, and language are required to send language updates.");
    }
};

export const onEditorUpdate = (callback) => {
    const socket = getSocket();
    if (socket) {
        console.log("SOCKET_CON: Setting up EDITOR update listener");
        socket.on("editorUpdate", (data) => {
            console.log("SOCKET_CON: Received Editor update:", data);
            callback(data);
        });
    }
};

export const offEditorUpdate = () => {
    const socket = getSocket();
    if (socket) {
        console.log("SOCKET_CON: Removing editor update listener");
        socket.off("editorUpdate");
    }
};



/**
 * Joins a specified room on the server.
 * @param {string} room - The name of the room to join.
 */
export const joinRoom = (room, message) => {
    const socket = getSocket();
    if (room) {
        socket.emit("joinRoom", { room, message });
        console.log(`Joined room: ${room}`);
    } else {
        console.error("Room name is required to join a room.");
    }
};

/**
 * Leaves a specified room on the server.
 * @param {string} room - The name of the room to leave.
 */
export const leaveRoom = (room, message) => {
    const socket = getSocket();
    if (room) {
        socket.emit("leaveRoom", { room, message });
        console.log(`Left room: ${room}`);
    } else {
        console.error("Room name is required to leave a room.");
    }
};

/**
 * Retrieves all available rooms.
 */
export const getAllRooms = () => {
    const socket = getSocket();
    socket.emit("allRooms");
};

/**
 * Sends a message to a specified room.
 * @param {string} room - The name of the room to send the message to.
 * @param {object} message - The message content.
 */
export const sendMessage = (room, message) => {
    const socket = getSocket();
    if (room && message) {
        socket.emit("message", { room, message });
        console.log(`Message sent to room ${room}: ${message.text}`);
    } else {
        console.error("Room and message are required to send a message.");
    }
};

/**
 * Sends code updates to a specified room.
 * @param {string} room - The name of the room to send the code updates to.
 * @param {string} code - The code content to share.
 */
export const sendCodeUpdate = (room, code) => {
    const socket = getSocket();
    if (room && code !== undefined) {
        socket.emit("codeUpdate", { room, code });
        console.log(`Code update sent to room ${room}.`);
    } else {
        console.error("Room and code are required to send updates.");
    }
};

// Modified drawing update functions
export const sendDrawing = (room, data) => {
    const socket = getSocket();
    if (!socket || !room || !data) {
        console.error("Missing required parameters for sending drawing update");
        return;
    }

    try {
        socket.emit("drawingUpdate", { room, data });
    } catch (error) {
        console.error("Error sending drawing data:", error);
    }
};


export const onDrawing = (callback) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("drawingUpdate", ({ data }) => {
        try {
            const decodedData = convertFromBinary(data);
            console.log("SOCKET_CON: Received drawing update:", decodedData);

            callback(data);
            
        } catch (error) {
            console.error('Error handling drawing update:', error);
        }
    });
};

export const offDrawing = () => {
    const socket = getSocket();
    socket.off("drawingUpdate");
};

// Send cursor updates
export const sendCursor = (room, binaryData) => {
    const socket = getSocket();
    if (!socket || !room || !binaryData) {
        console.error("Missing required parameters for sending cursor update");
        return;
    }

    try {
        socket.emit("cursorUpdate", { room, data: binaryData });
    } catch (error) {
        console.error("Error sending cursor data:", error);
    }
};

// Receive cursor updates
export const onCursor = (callback) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("cursorUpdate", ({ data }) => {
        if (!data) return;

        callback(data);
    });
};


export const offCursor = () => {
    const socket = getSocket();
    socket.off("cursorUpdate");
};


/**
 * Listens for incoming messages from the server.
 * @param {function} callback - A function to handle incoming messages.
 */
export const onMessage = (callback) => {
    const socket = getSocket();
    socket.on("message", callback);
};

/**
 * Listens for incoming code updates from the server.
 * @param {function} callback - A function to handle code updates.
 */
export const onCodeUpdate = (callback) => {
    const socket = getSocket();
    socket.on("codeUpdate", callback);
};

/**
 * Stops listening for incoming messages.
 */
export const offMessage = () => {
    const socket = getSocket();
    socket.off("message");
};

/**
 * Stops listening for code updates.
 */
export const offCodeUpdate = () => {
    const socket = getSocket();
    socket.off("codeUpdate");
};
