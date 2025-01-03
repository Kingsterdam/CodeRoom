import { io } from "socket.io-client";

let socket;

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
        throw new Error("Socket not initialized. Call `connectSocket` first.");
    }
    return socket;
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

// Add these new functions to your existing socketCon.js
export const sendLanguageUpdate = (room, languageData) => {
    const socket = getSocket();
    if (room && languageData) {
        socket.emit("languageUpdate", { room, ...languageData });
        console.log(`Language update sent to room ${room}:`, languageData);
    } else {
        console.error("Room and language data are required to send updates.");
    }
};

export const onLanguageUpdate = (callback) => {
    const socket = getSocket();
    socket.on("languageUpdate", callback);
};

export const offLanguageUpdate = () => {
    const socket = getSocket();
    socket.off("languageUpdate");
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
