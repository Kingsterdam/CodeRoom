// uniqueNames.js
const adjectives = ['Red', 'Blue', 'Swift', 'Clever', 'Brave']; // Add more
const mythicalCreatures = ['Dragon', 'Phoenix', 'Unicorn', 'Griffin']; // Add more

export const generateRandomName = () => {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomCreature = mythicalCreatures[Math.floor(Math.random() * mythicalCreatures.length)];
    return `${randomAdjective}-${randomCreature}`;
};

export const assignNameToRoom = (roomId, existingNames = []) => {
    let newName;
    let attempts = 0;
    
    do {
        newName = generateRandomName();
        attempts++;
        if (attempts > 100) throw new Error('Name generation failed');
    } while (existingNames.includes(newName));
    
    return newName;
};